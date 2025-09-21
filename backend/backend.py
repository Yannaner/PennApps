# backend.py - physical-witness coordinator (2 UNO nodes)
import time, random, serial, threading, sys

# === EDIT THESE ===
PORTS = ["/dev/tty.usbmodem2101", "/dev/tty.usbmodem48CA436008D02"]  # e.g., Windows: ["COM4","COM5"]; macOS/Linux: ["/dev/tty.usbmodem14101","/dev/tty.usbmodem14201"]
BAUD  = 115200
DURATION_MS = 3000
THRESH = 0.005          # correlation threshold (0.6–0.75 typical)
ROUND_PAUSE = 0.5       # pause between rounds (s)
TXS_PER_BLOCK = 3       # include up to N txs per block

# === State ===
ser = []
buf = ["", ""]
cur_round = 0
witness_ok = False

# Simple balances & tx queue
balances = {"Alice": 100, "Bob": 0, "Treasury": 0}
mempool = []  # list of dicts {"from":..,"to":..,"amt":..}

def open_ports():
    global ser
    for p in PORTS:
        s = serial.Serial(p, BAUD, timeout=0.01)
        ser.append(s)
    print("[i] Opened ports:", PORTS)

def close_ports():
    for s in ser:
        try:
            s.close()
        except:
            pass

def read_lines(i):
    """Non-blocking line pump for node i"""
    global buf
    s = ser[i]
    while True:
        b = s.read(1)
        if not b:
            break
        c = b.decode(errors="ignore")
        if c in "\r\n":
            line = buf[i].strip()
            buf[i] = ""
            if line:
                print(f"< node{i}: {line}")
                handle_line(i, line)
        else:
            buf[i] += c

def handle_line(i, line):
    global witness_ok, cur_round
    if line.startswith("WIT"):
        # Example: WIT round=12 node=1 corr=0.823
        parts = {}
        for token in line.split()[1:]:
            if "=" in token:
                k,v = token.split("=",1)
                parts[k]=v
        r = int(parts.get("round","-1"))
        corr = float(parts.get("corr","0"))
        if r == cur_round and corr >= THRESH:
            witness_ok = True

def bcast(line):
    print(f"> {line}")
    for s in ser:
        s.write((line+"\n").encode())
        time.sleep(0.002)

def include_txs_and_apply():
    """Take up to N txs from mempool, apply to balances if valid."""
    included = []
    to_apply = mempool[:TXS_PER_BLOCK]
    for tx in to_apply:
        src, dst, amt = tx["from"], tx["to"], tx["amt"]
        if amt <= 0:
            continue
        if balances.get(src,0) >= amt:
            balances[src] = balances.get(src,0) - amt
            balances[dst] = balances.get(dst,0) + amt
            included.append(tx)
    # drop the included ones from mempool
    for _ in range(len(included)):
        mempool.pop(0)
    return included

def print_balances():
    print("   Balances:", ", ".join([f"{k}={v}" for k,v in balances.items()]))

def tx_input_thread():
    print("[i] Type transactions like:  send Alice Bob 3")
    print("    Or:  mint Bob 10    (mints from Treasury)")
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                time.sleep(0.1); continue
            line=line.strip()
            if not line:
                continue
            parts = line.split()
            if parts[0].lower()=="send" and len(parts)==4:
                src, dst, amt = parts[1], parts[2], int(parts[3])
                mempool.append({"from":src,"to":dst,"amt":amt})
                print(f"[+] queued tx: {src} -> {dst} : {amt}")
            elif parts[0].lower()=="mint" and len(parts)==3:
                dst, amt = parts[1], int(parts[2])
                mempool.append({"from":"Treasury","to":dst,"amt":amt})
                print(f"[+] queued mint: Treasury -> {dst} : {amt}")
            elif parts[0].lower()=="bal":
                print_balances()
            else:
                print("[!] unknown. try: send Alice Bob 3  |  mint Bob 5  |  bal")
        except Exception as e:
            print("input err:", e)

def main():
    global cur_round, witness_ok
    open_ports()
    threading.Thread(target=tx_input_thread, daemon=True).start()
    print("[i] Coordinator running. Alternating leaders. Ctrl+C to stop.")
    try:
        while True:
            for leader in (0, 1):
                cur_round += 1
                seed = random.getrandbits(16)  # small is fine for demo
                witness_ok = False
                chal = f"CHAL round={cur_round} seed={seed} leader={leader} dur={DURATION_MS}"
                bcast(chal)

                # give ~1.2s for witness
                t0 = time.time()
                while time.time() - t0 < DURATION_MS/1000.0 + 0.5:
                    for i in (0,1):
                        read_lines(i)
                    if witness_ok:
                        break

                if witness_ok:
                    # "commit" the block: include txs, update balances, notify nodes
                    included = include_txs_and_apply()
                    bcast(f"COMMIT round={cur_round}")
                    print(f"[✓] Block {cur_round} committed. Leader={leader}. Included {len(included)} tx(s).")
                    for tx in included:
                        print(f"    - {tx['from']} -> {tx['to']} : {tx['amt']}")
                    print_balances()
                else:
                    print(f"[x] Block {cur_round} skipped (no witness).")

                time.sleep(ROUND_PAUSE)
    except KeyboardInterrupt:
        print("\n[.] stopping...")
    finally:
        close_ports()

if __name__ == "__main__":
    main()
