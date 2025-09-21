# Frontend-Backend Integration Guide

## Overview

The frontend is now connected to the `bridge.py` backend server to provide real-time blockchain interaction. When users click "Send ECO Coins", the transaction is sent directly to the physical blockchain hardware.

## How It Works

### 1. Real Blockchain Service (`src/lib/realBlockchain.ts`)
- Connects to `bridge.py` via WebSocket (ws://localhost:8787/events)
- Sends transactions via HTTP API (http://localhost:8787/tx)
- Receives real-time blockchain events (challenges, witnesses, commits, skips)
- Manages blockchain state synchronization

### 2. Updated Transaction Flow (`src/lib/transactions.ts`)
- When user clicks "Send ECO Coins", transaction is sent to bridge.py backend
- Maps user emails to blockchain addresses (Alice, Bob, Treasury)
- Blockchain handles the physical consensus process with Arduino hardware

### 3. New Components

#### BlockchainEventsDisplay (`src/components/BlockchainEventsDisplay.tsx`)
- Shows real-time blockchain events in the dashboard
- Displays challenges, witness responses, block commits, and skipped rounds
- Visual indicators for different event types

#### Updated BlockchainStatus (`src/components/BlockchainStatus.tsx`)
- Shows current blockchain state (round, leader, block height)
- Displays pending transactions in mempool
- Blockchain control buttons (start/stop/reset)
- Real-time balance updates from hardware

### 4. Dashboard Integration (`src/app/dashboard/page.tsx`)
- Added blockchain events display section
- Added hardware blockchain status section
- Real-time updates when transactions are processed

## Setup Instructions

### 1. Start the Backend
```bash
cd backend
python bridge.py
```
The bridge server will start on http://localhost:8787

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
The frontend will start on http://localhost:3000

### 3. User Flow
1. User logs into the dashboard
2. User fills out "Send ECO Coins" form
3. Click "Send ECO Coins" button
4. Transaction is sent to bridge.py backend
5. Backend adds transaction to mempool
6. Physical blockchain hardware processes the transaction
7. Events appear in real-time in the "Blockchain Events" section
8. Balance updates are reflected in the dashboard

## Key Features

- **Real-time Connection**: WebSocket connection shows live blockchain activity
- **Hardware Integration**: Direct communication with Arduino/physical blockchain
- **Event Visualization**: See challenges, witnesses, commits, and skips in real-time
- **Blockchain Controls**: Start, stop, and reset the blockchain from the frontend
- **Live State Monitoring**: Current round, leader, block height, and mempool status

## Configuration

The backend URL is configured in `src/lib/realBlockchain.ts`:
```typescript
const BACKEND_URL = 'http://localhost:8787';
const WS_URL = 'ws://localhost:8787';
```

User email to blockchain address mapping (customize as needed):
```typescript
const addressMap: Record<string, string> = {
  'alice@example.com': 'Alice',
  'bob@example.com': 'Bob',
  'treasury@example.com': 'Treasury'
};
```

## Troubleshooting

- Ensure `bridge.py` is running before starting the frontend
- Check browser console for WebSocket connection errors
- Verify the Arduino hardware is connected to the specified ports in `bridge.py`
- Use the blockchain control buttons to start/stop the consensus process