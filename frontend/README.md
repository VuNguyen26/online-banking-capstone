# SafeBank Frontend

React, TypeScript, Vite, and ethers frontend for the SafeBank Blockchain Term Deposit System.

The frontend contains both:

- the User Banking App;
- the Admin Portal.

It also includes two deterministic, read-only explanation assistants:

- Banking Assistant;
- Risk Assistant.

> **Educational use only:** SafeBank targets Ethereum Sepolia and uses freely mintable MockUSDC with no real-world monetary value.

## Network

The frontend targets Ethereum Sepolia.

| Item | Value |
|---|---|
| Network | Ethereum Sepolia |
| Chain ID | `11155111` |
| MockUSDC | `0xcf779EC5D80573D3254054a17c5B4f0117491662` |
| VaultManager | `0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7` |
| SavingCore | `0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443` |

Contract addresses and ABIs are synchronized from tracked repository deployment records.

The frontend does not contain deployment private keys, mnemonics, administrator secrets, or Etherscan API keys.

## Application Architecture

SafeBank is one single-page React application.

`App.tsx` uses local `ApplicationView` state to switch between:

- `UserDashboard`;
- `AdminDashboard`.

Both dashboards use the shared `ApplicationShell`.

The project intentionally does not use:

- React Router;
- Redux;
- Zustand;
- another global state-management framework.

`AdminDataProvider` is mounted only while the Admin Portal is active.

## Read and Write Separation

Public contract reads use an ethers `JsonRpcProvider`.

~~~text
createPublicProvider()
    → JsonRpcProvider
    → createReadOnlyContracts()
~~~

Wallet-authorized writes use:

- an injected EIP-1193 browser wallet;
- ethers `BrowserProvider`;
- the connected account's signer;
- explicit transaction preparation;
- user confirmation in the wallet.

~~~text
window.ethereum
    → BrowserProvider
    → getSigner(account)
    → signer-connected contracts
~~~

Before a transaction is prepared, the wallet layer verifies:

- an injected browser wallet exists;
- an account is connected;
- the wallet is on Ethereum Sepolia.

Public reads do not require a connected wallet.

Contract storage and confirmed transaction receipts remain authoritative.

## User Banking App

The User Banking App supports:

- public protocol reads;
- browser-wallet connection;
- account and network status;
- switching to Ethereum Sepolia;
- viewing available saving plans;
- viewing plan APR, tenor, limits, penalty, and enabled state;
- deterministic interest estimates;
- minting test mUSDC;
- exact-amount MockUSDC approval;
- opening a deposit;
- viewing owned ERC721 deposit certificates;
- viewing active and historical deposits;
- early withdrawal;
- maturity withdrawal;
- manual renewal during the grace period;
- permissionless auto-renew after the grace period;
- viewing C1 pending interest;
- claimant-only pending-interest claims;
- viewing C2 vault metrics;
- Sepolia Etherscan links;
- Vietnamese and English interfaces.

Vietnamese is the default language.

The selected language is persisted locally and synchronized with the document language metadata.

## Admin Portal

The Admin Portal supports public reads and wallet-authorized administrator actions.

Implemented visibility includes:

- SavingCore owner;
- SavingCore pending owner;
- VaultManager owner;
- VaultManager pending owner;
- independent pause states;
- MockUSDC, SavingCore, and VaultManager relationships;
- fee receiver;
- saving plans;
- deposit count;
- vault balance;
- total reserved interest;
- available liquidity;
- funding shortfall;
- read-only deposit inspection.

Implemented administrator actions include:

- create a saving plan;
- update plan APR;
- enable a plan;
- disable a plan;
- approve an exact MockUSDC amount for vault funding;
- fund VaultManager;
- withdraw only available VaultManager liquidity;
- change the fee receiver;
- independently pause or unpause SavingCore;
- independently pause or unpause VaultManager.

The portal does not expose:

- private keys;
- seed phrases;
- unlimited token approval;
- direct editing of active deposits;
- replacement of the authorized SavingCore;
- bypasses for Solidity authorization.

Frontend authorization checks improve UX only. Solidity access control is authoritative.

## Transaction Lifecycle

State-changing workflows use reusable transaction handling.

The UI distinguishes:

- idle;
- waiting for wallet;
- submitted;
- confirming;
- confirmed success;
- user rejection;
- contract revert;
- RPC or provider failure.

Financial and administrator actions use explicit review and confirmation UI before requesting a wallet signature.

After confirmation, the relevant providers refresh authoritative on-chain state.

The UI does not claim success from optimistic local state alone.

## Loading, Empty, and Error States

The frontend contains explicit UI states for:

- loading public data;
- loading wallet-specific data;
- no connected wallet;
- no deposits;
- no pending interest;
- invalid or unavailable configuration;
- RPC failure;
- transaction failure;
- retry actions;
- disabled actions;
- paused contracts;
- underfunded vault state.

These states are rendered separately rather than being represented by fake balances or ambiguous blank sections.

## Confirmation Dialogs

Potentially consequential actions require confirmation, including:

- opening a deposit;
- early withdrawal;
- maturity withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claim;
- plan creation;
- APR update;
- plan enable or disable;
- vault funding;
- vault withdrawal;
- fee-receiver update;
- pause and unpause.

Confirmations display the relevant action details before the wallet is opened.

## Deterministic Assistants

### Banking Assistant

The Banking Assistant is available from the User Banking App after SafeBank dashboard data is ready.

It explains verified context involving:

- plans;
- APR;
- tenor;
- maturity;
- early-withdrawal penalty;
- manual renewal;
- permissionless auto-renew;
- pending interest;
- claimant rules;
- vault funding shortfall.

### Risk Assistant

The Risk Assistant is available from the Admin Portal after administrator dashboard data is ready.

It explains verified context involving:

- vault balance;
- total reserved interest;
- available liquidity;
- funding shortfall;
- independent pause states;
- ownership;
- contract relationships;
- plan configuration.

### Assistant Boundary

The assistants are deterministic local rule engines.

They do not call:

- OpenAI;
- Gemini;
- Anthropic;
- another external LLM or AI API.

They do not:

- connect a wallet;
- obtain a signer;
- import transaction clients;
- approve tokens;
- deposit;
- withdraw;
- renew;
- claim;
- fund;
- pause;
- update plans;
- sign or submit transactions.

Every assistant answer contains four structured sections:

1. fact;
2. explanation;
3. caution;
4. next step.

Assistant input handling:

- normalizes whitespace;
- replaces control characters;
- rejects empty questions;
- rejects questions longer than 500 characters;
- rejects external URLs.

Responses are rendered as ordinary React text.

The assistant panels support:

- loading state;
- safe failure fallback;
- cancellation;
- stale-response protection;
- Vietnamese;
- English.

The Spline robot is only a visual launcher. The external scene is not a financial data source, wallet boundary, or part of assistant reasoning.

## Security Properties

Frontend safety properties include:

- exact-amount approval by default;
- separate approval and action transactions;
- explicit supported-chain validation;
- no wallet-secret storage;
- no frontend private key;
- no dangerous HTML rendering for assistant responses;
- no autonomous financial actions;
- contract-state refresh after transactions;
- current-owner checks reflected in the UI;
- pending-interest claimant checks reflected in the UI;
- separate SavingCore and VaultManager pause handling;
- administrator withdrawals limited in the UI to available liquidity.

Client-side checks do not replace Solidity validation.

## Contract Artifact Synchronization

The frontend synchronizes production contract ABIs and Sepolia deployment data through:

~~~bash
npm run contracts:sync
~~~

Synchronization is executed automatically before:

- development;
- tests;
- typechecking;
- production builds.

The generated contract module is:

~~~text
src/contracts/generated/contracts.ts
~~~

Do not manually edit generated contract metadata without updating the tracked source deployment artifacts.

## Development

Install dependencies:

~~~bash
npm install
~~~

Start the development server:

~~~bash
npm run dev
~~~

Run tests:

~~~bash
npm test
~~~

Run tests in watch mode:

~~~bash
npm run test:watch
~~~

Run Oxlint:

~~~bash
npm run lint
~~~

Run TypeScript validation:

~~~bash
npm run typecheck
~~~

Create a production build:

~~~bash
npm run build
~~~

Preview the production build:

~~~bash
npm run preview
~~~

## Available Commands

| Command | Purpose |
|---|---|
| `npm install` | Install frontend dependencies |
| `npm run contracts:sync` | Synchronize tracked contract ABIs and deployment metadata |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the complete frontend Vitest suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run Oxlint |
| `npm run typecheck` | Run the TypeScript project build without a production bundle |
| `npm run build` | Synchronize contracts, typecheck, and build with Vite |
| `npm run preview` | Preview the production build |

## Source Structure

~~~text
src/
├── ai/
│   ├── bankingAssistant.ts
│   ├── context.ts
│   ├── models.ts
│   ├── riskAssistant.ts
│   └── safety.ts
├── components/
│   ├── ApplicationShell.tsx
│   ├── UserDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── AssistantLauncher.tsx
│   ├── BankingAssistantPanel.tsx
│   ├── RiskAssistantPanel.tsx
│   ├── OpenDepositPanel.tsx
│   ├── DepositPortfolioPanel.tsx
│   ├── DepositLifecycleActions.tsx
│   ├── PendingInterestClaimAction.tsx
│   ├── AdminConfigurationPanel.tsx
│   ├── AdminPlansPanel.tsx
│   ├── AdminVaultPanel.tsx
│   └── AdminDepositInspectionPanel.tsx
├── config/
├── contracts/
├── hooks/
├── i18n/
├── lib/
├── providers/
├── App.tsx
└── main.tsx
~~~

## Validation Checkpoint

Last validated frontend checkpoint:

- `65` passing test files;
- `256` passing tests;
- zero Oxlint warnings or errors;
- successful TypeScript validation;
- successful Vite production build.

This checkpoint covers:

- User Banking App;
- Admin Portal;
- loading, empty, error, and confirmation states;
- wallet and network handling;
- contract reads and writes;
- deterministic Banking Assistant;
- deterministic Risk Assistant;
- bilingual behavior;
- assistant safety and cancellation.

## Known Limitations

- The frontend targets Ethereum Sepolia only.
- MockUSDC is a test token with no monetary value.
- The application is not a production banking service.
- The assistants support defined SafeBank intents rather than unrestricted general conversation.
- The Spline visual launcher depends on an external scene host.
- RPC providers may be delayed or unavailable.
- Rich NFT metadata and custom `tokenURI` rendering are not implemented.
- Automated frontend tests do not constitute a professional security or accessibility audit.