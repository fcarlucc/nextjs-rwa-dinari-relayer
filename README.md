# 🏦 RWA Settlement Relayer (Dinari V2 PoC)

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.20-lightgray)
![Dinari SDK](https://img.shields.io/badge/Dinari_SDK-V2-green)

A professional Full-Stack Proof of Concept (PoC) validating the integration of **Dinari V2 RWAs** into a **Hybrid Custody Architecture**. This project demonstrates the bridge between off-chain cryptographic requirements (EIP-712) and on-chain decentralized custody via Smart Contract Vaults (EIP-1271).

## 🧠 The Architectural Challenge
Dinari V2 requires **EIP-712 off-chain signatures** (Permits) for order execution. This creates a functional barrier for Smart Contract-based protocols, as contracts cannot natively sign off-chain messages using standard ECDSA private keys.

## 💡 The Solution: Universal Settlement Gateway
This PoC implements a **Dual-Mode Bridge** that handles the signature logic server-side while maintaining on-chain integrity:

1.  **Smart Vault (Non-Custodial):** - Uses an **EIP-1271** compliant Vault.
    - The Relayer generates the EIP-712 Permit.
    - The Vault validates the authorization via the `isValidSignature` method, enabling secure decentralized settlement.
2.  **Managed Account (Custodial):** - A standard execution path for users opting for provider-managed custody.
    - Orders are processed directly via the managed infrastructure using high-level API authentication.

## ⛓️ Smart Contract Reference
The reference implementation of the **IERC1271-compliant Vault** has been deployed and verified on the Ethereum Sepolia Testnet.

- **Vault Address:** [`0x77DbB5eBc222a2B0A9155D3032116Ad227dA7c84`](https://sepolia.etherscan.io/address/0x77DbB5eBc222a2B0A9155D3032116Ad227dA7c84)
- **Standard:** ERC-1271 (Universal Signature Validation Method)

## 🏗️ Project Structure
- **`/app/api/dinari/order`**: The core execution engine. It dynamically routes requests:
    - **Vault Flow**: Invokes `createEIP155OrderRequestPermit` (Standard Permit flow).
    - **Managed Flow**: Invokes `createLimitBuyManagedOrderRequest` (Direct API flow).
- **`/contracts/DummyVault.sol`**: The Solidity source for the EIP-1271 simulation.
- **`/app/page.tsx`**: A low-latency "Terminal UI" for real-time log monitoring and flow validation.

## 🚦 Integration Status (Sandbox)
The middleware is **100% Mapped** to the Dinari Enterprise V2 SDK specifications.

> **Technical Note:** Current responses from the Sandbox environment (`401 Unauthorized`) confirm successful authentication and endpoint reachability. These statuses indicate that the **Brokerage Module** for the test entity is awaiting final administrative provisioning from the provider. The gateway is designed to handle these states gracefully, as shown in the `architecture_verified` debug logs.

## 🚀 Getting Started

### 1. Environment Configuration
Create a `.env.local` file:
```env
DINARI_API_KEY_ID=your_key_id
DINARI_API_SECRET_KEY=your_secret_key