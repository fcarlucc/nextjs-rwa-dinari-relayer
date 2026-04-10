# Dinari V2 RWA Integration - Proof of Concept

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Dinari SDK](https://img.shields.io/badge/Dinari_SDK-V2-green)
![Architecture](https://img.shields.io/badge/Architecture-Hybrid_Custody-blue)

A proof-of-concept repository demonstrating integration patterns for Dinari V2 Real World Assets (RWA). This PoC evaluates the differences, requirements, and limitations between Dinari's fully managed custodial offering and the self-managed, non-custodial EVM flows (EIP-155).

## Table of Contents
1. [Overview](#overview)
2. [Architecture Profiles](#architecture-profiles)
3. [Technical Findings](#technical-findings)
4. [Getting Started](#getting-started)
5. [API Reference](#api-reference)
6. [Project Structure](#project-structure)
7. [Key References](#key-references)

---

## Overview

Dinari V2 introduces distinct paradigms for asset settlement and custody. This repository implements a "Relayer Backend" pattern in Next.js, acting as an intermediary to generate cryptographic payloads and proxy intent to Dinari's infrastructure, abstracting EVM complexities away from the client.

To isolate integration variables, the system implements a triple-profile testing strategy, evaluating:
* **Managed Accounts**: Custodial baseline.
* **Self-Managed Wallets (EOA)**: Non-custodial accounts managed by standard cryptography (EIP-2612).
* **Self-Managed Vaults (Smart Contracts)**: Non-custodial accounts requiring account abstraction (ERC-1271).

---

## Architecture Profiles & Status

| Profile | Status | Implementation Notes |
|---------|--------|----------------------|
| **Managed Account** | ✅ Fully Functional | Relies entirely on Dinari's backend API for custodial execution via `POST /order_requests/market_...`. No EVM interaction required. |
| **Self-Managed (EOA)** | ✅ Fully Functional | Implements the **Proxied EIP-155 Flow**. The Next.js backend intercepts the order, fetches an EIP-712 Permit, signs it offline using the operator's private key, and submits the intent to Dinari as the relayer. |
| **Self-Managed (Vault)** | ⚠️ Environment Block | Codebase implements standard `DummyVault.sol` with `IERC1271` support. Bypassed in Sandbox due to testnet limitations (see [Technical Findings](#technical-findings)). |

---

## Technical Findings

During the evaluation of the Proxy EIP-155 Flow within the Dinari Sandbox, a critical integration vector was identified:

### ERC-1271 Support in Sandbox (Smart Contract Vaults)
Attempts to proxy an EIP-155 intent with an Account Abstraction vault (`DummyVault.sol`) result in an immediate rejected status (`ERROR`) in the Sandbox.
**Root Cause:** Dinari's testnet synthetic currency (`mockUSD`) utilizes standard `ERC20Permit` validation. This standard hardcodes the `ecrecover` cryptographic function to validate the signature against a private key. Smart contracts do not possess private keys and require `ERC-1271` (`isValidSignature`) validation loops, which are currently unsupported by `mockUSD`.
**Resolution:** The integration architecture is functionally sound. Production deployment utilizing advanced token standards (`Permit2` or custom ERC-1271 tokens) will execute successfully given the current backend payload generation. 

---

## Getting Started

### Prerequisites
* Node.js v20+ (Node v24 recommended for native `--env-file` support)
* Dinari Sandbox API Keys
* Sepolia RPC URL (Infura, Alchemy, etc.)

### Installation & Configuration

1. Clone and install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```
Update `.env` with your specific API credentials and the UUIDs of your Dinari test accounts. Provide your `SIGNING_PRIVATE_KEY` for the EIP-155 relay functionality.

3. Start the development server:
```bash
npm run dev
```

The live demo interface will be accessible at `http://localhost:3000`.

---

## API Reference

The backend exposes a unified internal API under `/api/dinari/`:

| Route | Method | Description |
|-------|--------|-------------|
| `/order` | `POST` | Core order router. Automatically identifies the active profile and executes either a Managed API call or generates/signs an EIP-155 proxied intent. |
| `/order-await` | `POST` | Implementation of a polling mechanic to fetch and await state transitions on asynchronous order fulfillment. |
| `/orders/[accountId]` | `GET` | Retrieve the order execution history for a given account. |
| `/portfolio` | `POST` | Aggregates both synthetic cash (`mockUSD`) and stock token holdings. |
| `/fund-sandbox` | `POST` | Developer utility to invoke the synthetic faucet on Sandbox. |

---

## Project Structure

```text
├── app/
│   ├── api/dinari/           # Next.js Serverless Route Handlers
│   ├── contracts/            
│   │   └── DummyVault.sol    # Reference implementation for an ERC-1271 Vault
│   ├── home-client.tsx       # Primary React Interface
│   └── page.tsx              # Server Component for Env Injection
├── lib/
│   └── eip712.ts             # EIP-712 Cryptography Utility
└── README.md                 # This documentation
```

---

## Key References

* **Dinari API Docs**: [Dinari Environments](https://docs.dinari.com/reference/environments)
* **Demo Vault (Sepolia)**: [0x6233C94F2f6c0d73575335994F4ddEDa12B936FC](https://sepolia.etherscan.io/address/0x6233C94F2f6c0d73575335994F4ddEDa12B936FC)
* **Demo EOA (Sepolia)**: [0x7a7362F666F90AfdE90b09c60235764e3F9Ed6aA#tokentxns](https://sepolia.etherscan.io/address/0x7a7362F666F90AfdE90b09c60235764e3F9Ed6aA#tokentxns)
* **EIP-155 Spec**: [Simple replay attack protection](https://eips.ethereum.org/EIPS/eip-155)
* **EIP-712 Spec**: [Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712)
* **EIP-2612 Spec**: [Permit Extension for EIP-20 Signed Approvals](https://eips.ethereum.org/EIPS/eip-2612)
* **ERC-1271 Spec**: [Standard Signature Validation Method for Contracts](https://eips.ethereum.org/EIPS/eip-1271)
* **Ethers.js v6**: [SignTypedData API](https://docs.ethers.org/v6/api/providers/#Signer-signTypedData)

 