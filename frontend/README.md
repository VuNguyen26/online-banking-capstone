# SafeBank User Banking App

React, TypeScript, Vite, ethers v6 frontend for the SafeBank Online Banking Capstone.

## Network

The application targets Ethereum Sepolia only.

- Chain ID: `11155111`
- MockUSDC: `0xcf779EC5D80573D3254054a17c5B4f0117491662`
- VaultManager: `0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7`
- SavingCore: `0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443`

Contract metadata is synchronized from the tracked Phase 14 deployment records.

## Implemented User Features

- connect an EIP-1193 browser wallet;
- detect and switch to Ethereum Sepolia;
- read public SafeBank state without connecting a wallet;
- display protocol, account, plan, and C2 vault metrics;
- mint test mUSDC from the Sepolia test-token faucet;
- approve the exact mUSDC amount required by SavingCore;
- open a saving deposit;
- display owned ERC721 deposit certificates;
- withdraw early;
- withdraw at maturity;
- renew manually during the grace period;
- trigger permissionless auto-renewal after grace;
- display and claim deferred C1 interest;
- link addresses and transactions to Sepolia Etherscan;
- switch between Vietnamese and English;
- persist the selected language in localStorage.

Vietnamese is the default language.

## Architecture

Public reads use an ethers `JsonRpcProvider`.

Wallet writes use an ethers `BrowserProvider` and user-approved signer.

The frontend does not contain deployment private keys, mnemonics, Etherscan API keys, or privileged admin credentials. On-chain contract state remains the source of truth.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run validation:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Preview the production build:

```bash
npm run preview
```

Contract artifacts are synchronized automatically before development, testing, typechecking, and production builds.

## Validation Checkpoint

Phase 15 frontend validation completed with:

- 32 passing test files;
- 146 passing tests;
- zero Oxlint warnings or errors;
- successful TypeScript project build;
- successful Vite production build;
- successful production preview smoke test;
- HTTP 200 for the HTML entry point and all five generated CSS/JavaScript assets.

## Scope

This directory contains the User Banking App only.

The Admin Portal and AI assistants are outside Phase 15 and are not implemented here.
