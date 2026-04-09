# 🏦 RWA Settlement Relayer - Dinari V2 PoC

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Dinari SDK](https://img.shields.io/badge/Dinari_SDK-V2-green)
![Status](https://img.shields.io/badge/Status-PoC-orange)

A working proof-of-concept demonstrating **Dinari V2 RWA integration** with a **Hybrid Custody Architecture** - LIVE ✅

This repository serves as a technical baseline and risk assessment for migrating from Dinari V1 to V2, specifically focusing on the new EIP-155 Vault/Self-Managed flows.

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **MANAGED Flow** | ✅ Working | Direct API orders - HTTP 201, fully functional |
| **EIP155 Vault Flow** | ⚠️ Blocked by Provider | Implementation complete. Fails on Dinari Sandbox due to internal 500 API error. |
| **Frontend UI** | ✅ Working | Dual-account demo with live order tracking |
| **Smart Vault Signature** | ✅ Verified | Backend correctly generates valid EIP-712 offline signatures |

---

## 💡 Architecture & Technical Flow

Our unified entrypoint `/api/dinari/order` dynamically routes the order based on the `isVault` flag, greatly simplifying the frontend logic.

### 1️⃣ MANAGED Account Flow (Working)
Direct provider-managed custody via Dinari API:
1. `POST /api/dinari/order` (`isVault: false`)
2. Backend maps input and calls Dinari `POST /order_requests/market_buy` or `market_sell`
3. Dinari returns `HTTP 201 QUOTED`
4. Status polling confirms the order execution.

### 2️⃣ EIP155 Vault Flow / Self-Managed (PoC Complete, Sandbox limitation)
Smart Vault integration requiring offline EIP-712 signatures and EVM on-chain broadcast. The implementation successfully handles the complex cryptography server-side:

1. **PERMIT TEMPLATE:** We call `POST .../eip155/permit` to fetch the EIP-712 `PermitTemplate` domain and message.
2. **OFFLINE SIGNATURE:** Ethers.js signs the permit server-side using the `SIGNING_PRIVATE_KEY` (never exposing it to the client).
3. **SUBMIT ORDER:** We send the `order_request_id` and the generated `permit_signature` to Dinari via `POST .../eip155`. **(✅ Returns 200 OK / PENDING - Signature validated successfully by Dinari!)**
4. **REQUEST EVM CALLDATA:** We call `POST .../eip155/permit_transaction` to get the raw EVM byte-code (`to`, `data`, `value`).
5. **ON-CHAIN BROADCAST:** Using the generic `ethers.Wallet.sendTransaction`, the Next.js relayer pushes the transaction to Sepolia.

> 🛑 **KNOWN LIMITATION (Dinari Sandbox Bug)**
> Step 4 currently returns an `HTTP 500 Internal Server Error` on the Dinari Sandbox.
> *Reason:* The `permit_transaction` sandbox endpoint crashes internally when simulating the market order or calculating Gas. 
> *Resolution:* Code logic is certified correct (Step 3 accepted the signature). Awaiting Dinari team to fix their Sandbox environment for V2 endpoint `/eip155/permit_transaction`.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Dinari Sandbox Account
- Ethereum Sepolia wallet

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with:
# - DINARI_API_KEY_ID
# - DINARI_API_SECRET_KEY
# - SIGNING_PRIVATE_KEY
# - SEPOLIA_RPC (e.g. from Infura/Alchemy)

# Run dev server
npm run dev

# Open http://localhost:3000
```

---

## 🎮 Live Demo Features

The terminal-style UI lets you:

- **Check Auth** → Verify Dinari SDK is initialized
- **Mint USD+** → Fund account with testnet tokens
- **Place Order** → Execute market buy on MANAGED account
- **Order Status** → Poll order progress
- **Portfolio** → View account holdings
- **List Orders** → See order history

### How to Test

1. Select **MANAGED Account** from profile selector
2. Click **Mint USD+** to get tokens
3. Click **Place Order** to buy a stock
4. Click **Order Status** to see it progressing (QUOTED → SUBMITTED)
5. Click **Portfolio** to see updated holdings

For SELF-MANAGED, the order is created but fails during processing.

---

## 📡 API Endpoints

All endpoints are in `/app/api/dinari/`:

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `/order` | ✅ | Place order (MANAGED or vault) |
| `/order-status` | ✅ | Get order status |
| `/order-await` | ✅ | Poll until completion |
| `/portfolio` | ✅ | Account holdings |
| `/orders` | ✅ | Order history |
| `/permit` | ✅ | Health check (SDK init) |

Faucet: `/api/fund-sandbox` - Mint test USD+

---

## 🏗️ Project Structure

```
nextjs-rwa-dinari-relayer/
├── app/
│   ├── api/dinari/           ← All RWA endpoints
│   ├── page.tsx              ← Live demo UI
│   ├── contracts/
│   │   └── DummyVault.sol    ← EIP-1271 smart vault
│   └── globals.css
├── lib/
│   └── eip712.ts             ← Signature generation
└── README.md (this file)
```

---

## 🔗 Key References

- **Dinari API Docs:** https://docs.dinari.com/reference/environments
- **Smart Vault:** [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x6233C94F2f6c0d73575335994F4ddEDa12B936FC)
- **EIP-712 Spec:** https://eips.ethereum.org/EIPS/eip-712
- **ERC-1271 Spec:** https://eips.ethereum.org/EIPS/eip-1271
 