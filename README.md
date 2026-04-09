# 🏦 RWA Settlement Relayer - Dinari V2 PoC

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Dinari SDK](https://img.shields.io/badge/Dinari_SDK-V2-green)
![Status](https://img.shields.io/badge/Status-PoC-orange)

A working proof-of-concept demonstrating **Dinari V2 RWA integration** with a **Hybrid Custody Architecture** - LIVE ✅

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **MANAGED Flow** | ✅ Working | Direct API orders - HTTP 201, fully functional |
| **EIP155 Vault Flow** | ⏸️ On Hold | Pending provisioning |
| **Frontend UI** | ✅ Working | Dual-account demo with live order tracking |
| **Smart Vault** | ✅ Deployed | ERC-1271 reference on Sepolia [`0x77DbB...`](https://sepolia.etherscan.io/address/0x6233C94F2f6c0d73575335994F4ddEDa12B936FC) |

---

## 💡 What This Demonstrates

### ✅ MANAGED Account Flow (Working)
Direct provider-managed custody via Dinari API:
```
1. POST /api/dinari/order (isVault: false)
2. → Dinari API: /order_requests/market_buy
3. → HTTP 201 QUOTED
4. → Status polling: QUOTED → SUBMITTED ✅
```

**Test Results:**
- Order placed: ✅ HTTP 201
- Portfolio updated: ✅ 0.0975 AAPL shares visible
- Faucet working: ✅ USD+ tokens minted

### ⏸️ EIP155 Vault Flow (On Hold)
Smart Vault integration via EIP-712 signatures:
```
1. POST /api/dinari/order (isVault: true)
2. → Order created with status: PENDING ✓
3. → Polling status → Error (status: ERROR, order_id: null)
```

**Note:** Orders are created successfully but fail during processing. Provider configuration pending.

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

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with your Dinari credentials

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
| `/stocks` | ✅ | Available securities |

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

---

## 📝 Notes 

**What's Blocked:**
- ❌ EIP155 vault flow - 