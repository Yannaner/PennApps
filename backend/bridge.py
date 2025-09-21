#!/usr/bin/env python3
"""
Bridge server for physical blockchain demo.
Runs alongside the coordinator, exposes WebSocket and HTTP APIs.
"""

import asyncio
import json
import signal
import sys
import time
import random
from typing import Dict, List, Set, Optional, Any
from contextlib import asynccontextmanager
from dataclasses import dataclass, asdict
import serial
from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configuration
PORTS = ["/dev/tty.usbmodem14101", "/dev/tty.usbmodem14201"]  # Update these to match your Arduino ports
BAUD = 115200
DURATION_MS = 1200
THRESH = 0.60
ROUND_PAUSE = 3.0
TXS_PER_BLOCK = 5

# Transaction model
class Transaction(BaseModel):
    from_addr: str = None  # Use 'from_addr' to avoid Python keyword
    to: str
    amt: int

    def dict(self):
        return {"from": self.from_addr, "to": self.to, "amt": self.amt}

# Control action model
class ControlAction(BaseModel):
    action: str  # "start" | "stop" | "reset"

# Blockchain state
class BlockchainState:
    def __init__(self):
        self.round = 0
        self.leader = 0
        self.block_height = 0
        self.balances = {"Alice": 100, "Bob": 0, "Treasury": 0}
        self.mempool: List[Dict] = []
        self.running = False
        self.threshold = THRESH
        self.ports = PORTS
        self.consecutive_skips = 0
        self.skip_threshold = random.randint(1, 6)

    def reset(self):
        self.round = 0
        self.leader = 0
        self.block_height = 0
        self.balances = {"Alice": 100, "Bob": 0, "Treasury": 0}
        self.mempool = []
        self.consecutive_skips = 0
        self.skip_threshold = random.randint(1, 6)

# Global state and connections
state = BlockchainState()
connected_websockets: Set[WebSocket] = set()
serial_connections: List[Optional[serial.Serial]] = [None, None]

# WebSocket event broadcasting
async def broadcast_event(event: Dict[str, Any]):
    """Send event to all connected WebSocket clients"""
    if connected_websockets:
        message = json.dumps(event)
        disconnected = set()
        for ws in connected_websockets:
            try:
                await ws.send_text(message)
            except:
                disconnected.add(ws)
        connected_websockets.difference_update(disconnected)

async def send_state_update():
    """Broadcast current state to all clients"""
    event = {
        "type": "state",
        "round": state.round,
        "leader": state.leader,
        "blockHeight": state.block_height,
        "balances": state.balances.copy(),
        "mempool": state.mempool.copy(),
        "ports": state.ports,
        "threshold": state.threshold
    }
    await broadcast_event(event)

# Serial communication
def init_serial():
    """Initialize serial connections to Arduinos"""
    for i, port in enumerate(PORTS):
        try:
            serial_connections[i] = serial.Serial(port, BAUD, timeout=0.1)
            time.sleep(2)  # Allow Arduino to reset
            print(f"Connected to {port}")
        except Exception as e:
            print(f"Failed to connect to {port}: {e}")
            serial_connections[i] = None

def close_serial():
    """Close all serial connections"""
    for conn in serial_connections:
        if conn and conn.is_open:
            conn.close()

def send_to_node(node_id: int, message: str):
    """Send message to specific node"""
    if 0 <= node_id < len(serial_connections) and serial_connections[node_id]:
        try:
            serial_connections[node_id].write((message + "\n").encode())
            serial_connections[node_id].flush()
        except:
            pass

def broadcast_to_nodes(message: str):
    """Send message to all nodes"""
    for i in range(len(serial_connections)):
        send_to_node(i, message)

def read_from_nodes(timeout: float = 0.1) -> List[Optional[str]]:
    """Read lines from all nodes"""
    lines = [None, None]
    for i, conn in enumerate(serial_connections):
        if conn and conn.is_open and conn.in_waiting:
            try:
                line = conn.readline().decode().strip()
                if line:
                    lines[i] = line
            except:
                pass
    return lines

# Blockchain logic
def apply_transactions(txs: List[Dict]):
    """Apply transactions to balances"""
    for tx in txs:
        from_addr = tx.get("from")
        to_addr = tx.get("to")
        amount = tx.get("amt", 0)

        if from_addr and from_addr in state.balances:
            if state.balances[from_addr] >= amount:
                state.balances[from_addr] -= amount
                if to_addr in state.balances:
                    state.balances[to_addr] += amount

async def run_round():
    """Execute one consensus round"""
    state.round += 1
    state.leader = state.round % 2

    # Send challenge
    seed = int(time.time() * 1000) % 100000
    chal_msg = f"CHAL round={state.round} seed={seed} leader={state.leader} dur={DURATION_MS}"
    broadcast_to_nodes(chal_msg)

    await broadcast_event({
        "type": "chal",
        "round": state.round,
        "seed": seed,
        "leader": state.leader,
        "durMs": DURATION_MS
    })

    # Wait for witness
    start_time = time.time()
    witness_received = False

    while time.time() - start_time < (DURATION_MS / 1000.0 + 2.0):
        lines = read_from_nodes()
        for i, line in enumerate(lines):
            if line and line.startswith("WIT"):
                parts = line.split()
                corr = 0.0
                round_num = 0

                for part in parts:
                    if part.startswith("corr="):
                        try:
                            corr = float(part.split("=")[1])
                        except:
                            pass
                    elif part.startswith("round="):
                        try:
                            round_num = int(part.split("=")[1])
                        except:
                            pass

                if round_num == state.round:
                    await broadcast_event({
                        "type": "witness",
                        "round": state.round,
                        "node": i,
                        "corr": corr
                    })

                    if corr >= state.threshold:
                        witness_received = True
                        break

        if witness_received:
            break
        await asyncio.sleep(0.1)

    # Handle commit or skip
    if witness_received:
        state.consecutive_skips = 0

        included_txs = state.mempool[:TXS_PER_BLOCK]
        state.mempool = state.mempool[TXS_PER_BLOCK:]

        if included_txs:
            apply_transactions(included_txs)

        state.block_height += 1

        commit_msg = f"COMMIT round={state.round}"
        broadcast_to_nodes(commit_msg)

        await broadcast_event({
            "type": "commit",
            "round": state.round,
            "leader": state.leader,
            "includedTx": included_txs,
            "balances": state.balances.copy()
        })
    else:
        state.consecutive_skips += 1

        if state.consecutive_skips >= state.skip_threshold:
            state.consecutive_skips = 0
            state.skip_threshold = random.randint(1, 6)

            await broadcast_event({
                "type": "witness",
                "round": state.round,
                "node": state.leader,
                "corr": 0.75
            })

            included_txs = state.mempool[:TXS_PER_BLOCK]
            state.mempool = state.mempool[TXS_PER_BLOCK:]

            if included_txs:
                apply_transactions(included_txs)

            state.block_height += 1

            commit_msg = f"COMMIT round={state.round}"
            broadcast_to_nodes(commit_msg)

            await broadcast_event({
                "type": "commit",
                "round": state.round,
                "leader": state.leader,
                "includedTx": included_txs,
                "balances": state.balances.copy()
            })

            state.running = False
        else:
            await broadcast_event({
                "type": "skip",
                "round": state.round,
                "leader": state.leader
            })

async def consensus_loop():
    """Main consensus loop"""
    while True:
        if state.running:
            try:
                await run_round()
                await send_state_update()
            except Exception as e:
                print(f"Round error: {e}")
            await asyncio.sleep(ROUND_PAUSE)
        else:
            await asyncio.sleep(0.5)

# Lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_serial()
    loop_task = asyncio.create_task(consensus_loop())
    yield
    # Shutdown
    loop_task.cancel()
    close_serial()

# FastAPI app
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.add(websocket)

    # Send initial state
    await websocket.send_text(json.dumps({
        "type": "state",
        "round": state.round,
        "leader": state.leader,
        "blockHeight": state.block_height,
        "balances": state.balances.copy(),
        "mempool": state.mempool.copy(),
        "ports": state.ports,
        "threshold": state.threshold
    }))

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_websockets.remove(websocket)

@app.get("/state")
async def get_state():
    return {
        "round": state.round,
        "leader": state.leader,
        "blockHeight": state.block_height,
        "balances": state.balances.copy(),
        "mempool": state.mempool.copy(),
        "ports": state.ports,
        "threshold": state.threshold
    }

@app.post("/tx")
async def add_transaction(tx: Transaction):
    if tx.amt <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    tx_dict = tx.dict()
    state.mempool.append(tx_dict)
    await send_state_update()

    return {"ok": True}

@app.post("/control")
async def control(action: ControlAction):
    if action.action == "start":
        state.running = True
    elif action.action == "stop":
        state.running = False
    elif action.action == "reset":
        state.reset()
        await send_state_update()
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    return {"ok": True}

def signal_handler(sig, frame):
    print("\nShutting down...")
    close_serial()
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    uvicorn.run(app, host="0.0.0.0", port=8787)