# SafeBank — Online Banking System

SafeBank is a blockchain-based fixed-term savings system developed for the Blockchain Programming Capstone Project.

Users will deposit six-decimal MockUSDC into a smart contract, receive an ERC721 deposit certificate, and later withdraw, renew, or claim eligible interest according to the on-chain deposit state.

> SafeBank is an educational project. MockUSDC is a freely mintable test token with no real-world monetary value.

## Current Status

Current phase:

**Phase 18 — deterministic read-only assistants implemented and locally validated; documentation and Git finalization are in progress**

Phase 14 public deployment:

| Item | Value |
|---|---|
| Network | Ethereum Sepolia |
| Chain ID | `11155111` |
| Deployer, administrator, and fee receiver | `0xA998526b0A5F23680f50fa3677f5c6576Dba89d9` |
| Confirmation policy | 2 confirmations |
| MockUSDC | `0xcf779EC5D80573D3254054a17c5B4f0117491662` |
| VaultManager | `0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7` |
| SavingCore | `0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443` |
| Canonical plan | Plan ID `1` |
| Etherscan source verification | Successful for all three contracts |

Public deployment transactions:

| Action | Transaction hash | Block |
|---|---|---:|
| Deploy MockUSDC | `0xa81c48442241a266792a81f735a5af0af1a3fa9251978b2ac9edeb6d4fe7b28a` | `11320265` |
| Deploy VaultManager | `0x815109fdaa03422d1b8692e80d1d9f8ec3ba25b3d21a5488e90b7347f66a7dbf` | `11320267` |
| Deploy SavingCore | `0xbfcd2b495cac445e3f7af8c29d9d93fdbf6ff2e491d788f4392d67945d3c3883` | `11320269` |
| Authorize SavingCore | `0x6c665a22b299c14297c7492c9bf218475a8270702ac162a8ac6d92d78cc56061` | `11320271` |
| Create canonical plan | `0x8913d7f10bb4e952f08543cd6ee550ff4285e9214c6656042b9dd5edb086415b` | `11320273` |

Validated public initial state:

- plan count `1`;
- deposit count `0`;
- canonical plan: 180 days, 200-bps APR, 100–10,000 mUSDC limits,
  750-bps early-withdrawal penalty, enabled;
- VaultManager balance `0`;
- total reserved interest `0`;
- available liquidity `0`;
- funding shortfall `0`;
- SavingCore and VaultManager unpaused;
- no demo balances minted;
- no vault funding;
- no default deposits.

The public workflow was rerun idempotently: all three contracts were reused,
authorization was skipped, plan ID `1` was preserved, nonce stayed at `5`,
and no additional SepoliaETH was spent.

Etherscan source verification proves source-to-bytecode matching for the
submitted compiler settings and constructor arguments. It is not an
independent professional security audit.

Retained Phase 13 local-deployment checkpoint:

- `hardhat.config.ts` local-network and named-account configuration;
- `.gitignore` policy for local deployment records;
- `deploy/00_deploy_mock_usdc.ts`;
- `deploy/01_deploy_vault_manager.ts`;
- `deploy/02_deploy_saving_core.ts`;
- `deploy/03_authorize_saving_core.ts`;
- `deploy/04_seed_demo.ts`;
- `scripts/verify-local-deployment.ts`;
- `test/Deployment.test.ts`;
- local deployment, verification, and focused-test npm workflows;
- production-only ABI export allowlist;
- Phase 13 documentation alignment.

Phase 13 implementation includes:

- explicit local network support for `hardhat` and `localhost`;
- chain ID `31337` enforcement in every Phase 13 deployment script;
- rejection of nonlocal networks by the deploy and seed workflow;
- deterministic named accounts for deployer/admin, fee receiver, two demo
  users, and a low-privilege keeper;
- deployment order:
  1. MockUSDC;
  2. VaultManager;
  3. SavingCore;
  4. one-time SavingCore authorization;
  5. deterministic demo seed;
- exact constructor configuration:
  - `MockUSDC()`;
  - `VaultManager(token, admin, feeReceiver)`;
  - `SavingCore(token, vaultManager, admin)`;
- dependency, bytecode, owner, pause, fee receiver, token, vault, and
  authorization verification after deployment;
- canonical plan ID `1` with 180-day tenor, 200-bps APR, 100–10,000 mUSDC
  limits, 750-bps early-withdrawal penalty, and enabled status;
- demo user target balances of 5,000 and 10,000 mUSDC;
- VaultManager target balance of 25,000 mUSDC;
- no default deposit creation;
- idempotent authorization, plan, user-balance, and vault-funding behavior;
- persistent `localhost` deployment records ignored by Git;
- ephemeral `hardhat` deployment without saved records;
- read-only post-deployment verification with structured JSON output;
- ABI export restricted to MockUSDC, VaultManager, and SavingCore.

Phase 13 validation completed:

- clean Solidity compilation using Solidity `0.8.28`, optimizer `1,000` runs,
  and `viaIR`;
- TypeScript validation with `npx tsc --noEmit`;
- ephemeral `hardhat` deployment and deterministic seed;
- persistent `localhost` reset deployment;
- two successful `verify:local` runs;
- successful idempotent `deploy:local` rerun with reused contracts and no
  duplicate seed state;
- three deployed contracts with nonempty bytecode;
- matching token, vault, ownership, fee-receiver, authorization, and Personal
  Variant configuration;
- seeded state:
  - plan count `1`;
  - deposit count `0`;
  - demo user balances `5000.0` and `10000.0` mUSDC;
  - vault balance `25000.0` mUSDC;
  - reserved interest `0.0` mUSDC;
  - available liquidity `25000.0` mUSDC;
  - funding shortfall `0.0` mUSDC;
- 5 focused deployment workflow tests;
- **258 passing** across the complete project suite;
- production-contract coverage of 100% statements, 98.40% branches,
  100% functions, and 100% lines;
- complete project coverage of 99.11% statements, 97.17% branches,
  96.97% functions, and 96.98% lines;
- exactly three retained production ABI files;
- local node shutdown and temporary-log cleanup verified.

Phase 15 User Banking App validation completed:

- React 19, TypeScript, Vite, ethers v6, Vitest, Testing Library, and Oxlint;
- public Sepolia reads through an ethers JsonRpcProvider;
- wallet-authorized writes through an ethers BrowserProvider and signer;
- browser-wallet connection, account state, chain detection, and Sepolia switching;
- public protocol, saving-plan, account, and C2 interest-vault metrics;
- permissionless Sepolia test-token faucet for MockUSDC;
- exact-amount MockUSDC approval and saving-deposit opening;
- owned ERC721 deposit-certificate portfolio;
- early withdrawal, maturity withdrawal, manual renewal, and permissionless auto-renewal;
- C1 deferred-interest visibility and claims;
- Vietnamese and English UI with Vietnamese as the default;
- persisted language preference and synchronized HTML language metadata;
- localized deterministic validation and internal provider/transaction errors while preserving external RPC and revert messages;
- 32 passing frontend test files and 146 passing frontend tests;
- zero Oxlint warnings or errors;
- successful TypeScript validation and Vite production build;
- successful production preview smoke test with HTTP 200 for the HTML entry point and all five generated assets.

Phase 16 Admin Portal validation completed:

- shared User Banking App and Admin Portal shell with internal view switching;
- AdminDataProvider mounted only while the Admin Portal is active;
- public Sepolia reads without requiring wallet connection;
- separate SavingCore-owner and VaultManager-owner authorization;
- owner, pending-owner, pause-state, fee-receiver, contract-relationship,
  deposit-count, saving-plan, and vault-solvency visibility;
- saving-plan creation, APR updates, and independent enable or disable actions;
- exact-amount MockUSDC approval followed by separate VaultManager funding;
- withdrawals restricted in the UI to available VaultManager liquidity;
- fee-receiver updates with address validation;
- independent SavingCore and VaultManager pause or unpause actions;
- strictly read-only deposit inspection by deposit ID;
- reusable transaction lifecycle feedback with Sepolia Etherscan links;
- Vietnamese and English interfaces with Vietnamese as the default;
- no frontend private key, unlimited approval, active-deposit editing, or
  exposure of the deployment-only SavingCore authorization operation;
- no smart-contract, deployment, Hardhat-configuration, or dependency changes;
- complete frontend tests, TypeScript validation, Oxlint, production build,
  Hardhat compilation, contract tests, and whitespace checks succeeded.

Current limitations and pending work:

- Phase 18 documentation review, repository audits, staging, commit, push,
  remote verification, checkpoint, and handoff remain pending;
- rich NFT metadata, demonstration video, and final submission remain pending;
- the assistants are deterministic rule-based explanation engines, not an
  external LLM integration;
- the Spline robot launcher requires its external scene host and may display
  Spline branding;
- the User Banking App and Admin Portal target Ethereum Sepolia and are not
  production banking services;
- local deterministic addresses remain development-only; the frontend uses
  the tracked and verified public Sepolia deployment addresses.

Previous completed phases:

- Phase 0: project, environment, Git, and GitHub initialization;
- Phase 1: architecture, security, UI/UX, and design-decision documentation;
- Phase 2: six-decimal MockUSDC contract and tests;
- Phase 3: base VaultManager contract and tests;
- Phase 4: SavingCore foundation and saving-plan management;
- Phase 5: deposit opening, financial-term snapshots, principal custody, and
  ERC721 deposit certificates;
- Phase 6: base maturity withdrawal flow;
- Phase 7: early withdrawal with snapshotted penalty and atomic settlement;
- Phase 8: manual renewal during the two-day grace period;
- Phase 9: permissionless auto-renewal after the grace period;
- Phase 10: hardening, regression, security, and documentation alignment;
- Phase 11: Bonus C1 principal-first settlement and deferred-interest claims;
- Phase 12: Bonus C2 reserved-interest solvency guard;
- Phase 13: deterministic local deployment scripts and demo seed.

## Current Implementation Status

Completed:

- Hardhat, TypeScript, coverage, Git, and GitHub setup
- Architecture, security, UI/UX, and design-decision documentation
- Six-decimal permissionless `MockUSDC`
- Base `VaultManager`
- SavingCore ownership, pause, and saving-plan management
- Deposit opening, immutable financial snapshots, principal custody, and
  ERC721 deposit certificates
- Maturity withdrawal, early withdrawal, manual renewal, and permissionless
  auto-renewal
- Current NFT owner economic rights and historical NFT retention
- Exact maturity and grace-period boundaries
- C1 principal-first maturity settlement
- Full-value deferred interest and fixed claimant snapshots
- Claimant-only pending-interest claims with rollback and reentrancy protection
- C2 aggregate reserved-interest accounting
- Reservation, release, consumption, and renewal reserve transitions
- Undercollateralized deposit opening with explicit funding shortfall
- Vault available-liquidity calculation and owner-withdrawal protection
- Production ABI export restricted to MockUSDC, SavingCore, and VaultManager
- Local-only deployment scripts with chain-ID and network guards
- Deterministic named local roles
- One-time SavingCore authorization workflow
- Idempotent canonical-plan and demo-liquidity seed
- Ephemeral Hardhat and persistent localhost deployment modes
- Read-only local deployment verification
- Dedicated Sepolia deployment workflow separated from local demo seeding
- Sepolia preflight validation for network, signer, nonce, balance, fee budget,
  deployment-record state, and predicted addresses
- Public deployment of MockUSDC, VaultManager, and SavingCore
- One-time public SavingCore authorization and canonical plan ID `1`
- Read-only public state and receipt verification
- Idempotent public deployment rerun
- Tracked public deployment records and compact machine-readable metadata
- Etherscan source verification for all three production contracts
- Deployment fixture regression tests
- 258 passing tests
- Production coverage of 100% statements, 98.40% branches, 100% functions,
  and 100% lines

- Phase 15 User Banking App
- Phase 16 Admin Portal
- Phase 18 deterministic Banking and Risk Assistants
- Structured read-only assistant context and input-safety layer
- Vietnamese and English assistant UI
- Floating Spline 3D launcher with responsive dialog
- 65 passing frontend test files and 256 passing frontend tests
- Successful frontend lint, typecheck, and production build

Not implemented yet:

- Rich NFT metadata or custom `tokenURI`
- Demo video
- Final submission audit

Mandatory contract flows, Bonus C1, Bonus C2, deterministic local deployment,
the verified Sepolia deployment, the User Banking App, the Admin Portal, and
the deterministic read-only assistants are implemented and validated locally.

Documentation and Git finalization for Phase 18 remain in progress.

## Core Contracts

### MockUSDC

`MockUSDC` is now implemented as a six-decimal ERC20 test token using OpenZeppelin Contracts `5.3.0`.

Implemented characteristics:

- contract name: `MockUSDC`;
- token name: `Mock USD Coin`;
- token symbol: `mUSDC`;
- 6 decimals;
- permissionless public minting for tests and demonstrations;
- no owner restriction on minting;
- no tax, blacklist, redemption, backing, or production stablecoin behavior;
- no real-world monetary value.

The exported project ABI is located at:

`data/abi/contracts/MockUSDC.sol/MockUSDC.json`

MockUSDC amounts must use six-decimal units.

Examples:

- `ethers.parseUnits("1", 6)` equals `1,000,000` smallest units;
- `ethers.parseUnits("1000", 6)` equals `1,000,000,000` smallest units;
- `parseEther` must not be used for MockUSDC amounts.
### VaultManager

`VaultManager` is the bank-funded interest-liquidity contract and the
enforcement point for administrator withdrawal limits.

Implemented characteristics:

- immutable MockUSDC-compatible ERC20 reference;
- initial owner configured through OpenZeppelin `Ownable`;
- two-step ownership transfers through `Ownable2Step`;
- nonzero initial fee receiver;
- owner-only fee receiver updates;
- owner-only vault funding through `SafeERC20.safeTransferFrom`;
- funding remains available while paused for liquidity restoration;
- one-time owner-only authorization of a deployed SavingCore-compatible
  contract;
- interest payout callable only by the authorized contract;
- interest payout blocked while paused;
- actual ERC20 balance used as the vault-balance source of truth;
- `totalReservedInterest()` read from the authorized `SavingCore`;
- zero reserve returned before SavingCore authorization;
- `availableLiquidity()` equal to
  `max(vaultBalance - totalReservedInterest, 0)`;
- `fundingShortfall()` equal to
  `max(totalReservedInterest - vaultBalance, 0)`;
- owner withdrawal to the current owner while unpaused;
- owner withdrawal rejected above available liquidity;
- zero-address, zero-amount, authorization, pause, and liquidity validation;
- reentrancy protection on token-moving entry points;
- inherited pause, unpause, and ownership events;
- explicit administrative and payout events.

The exported project ABI is located at:

`data/abi/contracts/VaultManager.sol/VaultManager.json`

VaultManager does not hold user principal.

`SavingCore` remains the authoritative source of aggregate interest
liabilities. VaultManager reads that value through the internal
`ISavingCoreReserve` interface after one-time authorization; the separate
interface ABI is not retained as a production artifact.

VaultManager does not contain:

- per-deposit records;
- C1 pending-interest mappings;
- deposit lifecycle transitions;
- reserve mutation functions callable by external users or administrators.

### SavingCore

`SavingCore` is the central deposit lifecycle, certificate, principal-custody,
C1, and C2 accounting contract.

Implemented characteristics include:

- non-upgradeable OpenZeppelin ERC721 deployment;
- collection name `SafeBank Deposit Certificate` and symbol `SBDC`;
- immutable MockUSDC and VaultManager references with deployed-bytecode checks;
- `Ownable2Step`, independent `Pausable`, `ReentrancyGuard`, and `SafeERC20`;
- personal-variant constants:
  - `GRACE_PERIOD = 2 days`;
  - `DEFAULT_TENOR_DAYS = 180`;
  - `DEFAULT_APR_BPS = 200`;
  - `DEFAULT_EARLY_WITHDRAW_PENALTY_BPS = 750`;
- saving-plan creation, APR updates, enable, disable, bounds, and reads;
- deposit and NFT identifiers beginning at one with `tokenId == depositId`;
- principal transfer into SavingCore;
- immutable principal, tenor, APR, penalty, start, and maturity snapshots;
- safe ERC721 certificate minting and complete rollback on failure;
- maturity withdrawal, early withdrawal, manual renewal, and permissionless
  auto-renew;
- C1 principal-first settlement and fixed pending-interest claimant;
- claimant-only full-value pending-interest claims;
- aggregate `totalReservedInterest`;
- reservation from snapshotted expected interest when a deposit opens;
- no reservation when interest rounds to zero;
- reserve release on early withdrawal;
- reserve consumption on funded maturity settlement;
- reserve preservation when C1 defers interest;
- reserve consumption after a successful pending-interest claim;
- atomic old-reserve consumption and new-reserve creation during renewal;
- explicit `InsufficientReservedInterest` invariant protection;
- `InterestReserved`, `ReservedInterestReleased`, and
  `ReservedInterestConsumed` events;
- EVM rollback preserving reserve accounting on failed transfers, payouts,
  authorization, pause checks, and safe NFT minting;
- first-successful-terminal-action enforcement;
- ERC20 and ERC721 callback reentrancy protection.

The exported project ABI is located at:

`data/abi/contracts/SavingCore.sol/SavingCore.json`

The current implementation does not include rich NFT metadata or a custom
`tokenURI`.

Financial rights are derived from the on-chain deposit record, current NFT
ownership for active owner-restricted actions, and the fixed C1 claimant
snapshot for an already-created pending claim.

## Architecture Principle

SafeBank separates user principal from bank-funded interest.

- `SavingCore` holds user principal.
- `VaultManager` holds interest liquidity.
- Interest must never be paid using another depositor's principal.
- The frontend and AI are not security boundaries.
- On-chain contract state is the source of truth.

The current architecture is non-upgradeable.

Upgradeable proxy packages were intentionally removed during Phase 0.

## Personal Variant

Student ID:

`3122560090`

Required values:

| Parameter | Value |
|---|---:|
| Grace period | 2 days |
| Default APR | 200 bps = 2.00% per year |
| Early-withdrawal penalty | 750 bps = 7.50% |
| Default tenor | 180 days |
| MockUSDC decimals | 6 |

MockUSDC amount conversion must use six decimals.

Examples:

- 1 mUSDC = 1,000,000 smallest units
- 1,000 mUSDC = 1,000,000,000 smallest units
- ethers scripts must use `parseUnits(amount, 6)`
- `parseEther` must not be used for MockUSDC

## Selected Bonus Challenges

SafeBank selected and implemented two bonus challenges.

### C1 — Principal-First Settlement

Implemented behavior:

- return principal at maturity even when VaultManager cannot pay the complete
  calculated interest;
- defer the full unpaid amount rather than attempting partial payout;
- snapshot the direct current NFT owner as the fixed claimant;
- permit that claimant to claim after later vault funding;
- preserve complete rollback for non-liquidity VaultManager failures;
- keep manual and auto-renewal fully funded without a pending fallback.

Status:

**Implemented and validated locally in Phase 11.**

### C2 — Solvency Guard

Implemented behavior:

- track aggregate expected and pending interest in
  `SavingCore.totalReservedInterest`;
- reserve positive expected interest when opening a deposit;
- release reserve on early withdrawal;
- consume reserve on funded settlement and successful pending claim;
- preserve deferred C1 interest as a real reserved liability;
- atomically replace old and new reserves during renewal;
- allow undercollateralized deposit opening while exposing shortfall;
- expose `VaultManager.totalReservedInterest()`;
- expose `VaultManager.availableLiquidity()`;
- expose `VaultManager.fundingShortfall()`;
- prevent owner withdrawal above available liquidity.

Status:

**Implemented and validated locally in Phase 12.**

## Documentation

Phase 1 documentation:

- [System Architecture](docs/ARCHITECTURE.md)
- [Security Model](docs/SECURITY.md)
- [UI/UX Plan](docs/UI_UX_PLAN.md)
- [Design Decisions](docs/DESIGN_DECISIONS.md)

These documents describe the planned system.

They are not evidence that the described contracts, security controls, tests, frontend, AI assistants, or deployments already exist.

## Product Experience

SafeBank defines two clearly separated product areas.

### User Banking App

The Phase 15 User Banking App is implemented with:

- explicit EIP-1193 browser-wallet connection;
- Ethereum Sepolia chain detection and network switching;
- public protocol reads without requiring wallet connection;
- saving-plan browsing and estimated-interest display;
- permissionless test mUSDC minting;
- exact-amount MockUSDC approval;
- saving-deposit opening;
- owned ERC721 deposit-certificate display;
- early and maturity withdrawal;
- manual renewal during the grace period;
- permissionless auto-renewal after grace;
- C1 deferred-interest visibility and claims;
- C2 interest-vault transparency metrics;
- Sepolia Etherscan links;
- Vietnamese and English interfaces with Vietnamese as the default.

### Admin Portal

The Phase 16 Admin Portal is implemented in the shared frontend with:

- a dedicated admin view without adding a routing dependency;
- public Sepolia reads and browser-wallet-authorized writes;
- separate SavingCore-owner and VaultManager-owner access checks;
- owner, pending-owner, pause-state, fee-receiver, contract-relationship,
  plan, deposit-count, and solvency visibility;
- saving-plan creation, APR updates, and plan enable or disable actions;
- exact-amount MockUSDC approval and VaultManager funding;
- withdrawals limited to available VaultManager liquidity;
- fee-receiver updates;
- independent SavingCore and VaultManager pause or unpause actions;
- strictly read-only deposit inspection by deposit ID;
- transaction lifecycle and Sepolia Etherscan feedback;
- Vietnamese and English interfaces with Vietnamese as the default.

The portal does not expose private keys, unlimited token approval, active
deposit editing, or the deployment-only SavingCore authorization operation.

## Implemented Read-Only SafeBank Assistants

Phase 18 implements two deterministic, local, read-only explanation engines.

### Banking Assistant

The Banking Assistant explains verified dashboard context including:

- saving plans and APR;
- deposit terms and maturity;
- early-withdrawal penalties;
- manual and permissionless renewal;
- pending interest and claimant rules;
- VaultManager funding-shortfall information.

### Risk Assistant

The Risk Assistant explains verified administrator context including:

- vault balance;
- total reserved interest;
- available liquidity;
- funding shortfall;
- independent pause states;
- ownership and contract relationships;
- plan configuration.

Each response contains four explicit sections:

1. fact;
2. explanation;
3. caution;
4. next step.

The assistant architecture:

- builds serializable context from already-read SafeBank dashboard data;
- formats financial bigint values deterministically;
- normalizes user input and rejects empty, overlong, control-character, and
  external-URL input;
- renders responses as plain React text;
- supports loading, safe failure fallback, cancellation, and stale-response
  protection;
- supports Vietnamese and English;
- does not use OpenAI, Gemini, another LLM, or an external AI API;
- does not access a signer, transaction hook, write client, or wallet secret;
- cannot approve, deposit, withdraw, renew, fund, pause, or change plans.

A floating Spline 3D robot is used only as the visual launcher. Clicking the
robot opens the relevant Banking or Risk Assistant. The Spline iframe is an
external visual dependency and is not part of the assistant reasoning engine.

The assistants are a SafeBank product extension rather than a mandatory
Capstone contract requirement. Contract storage and confirmed transaction
receipts remain authoritative.

## Local Requirements

Current development environment:

- Node.js `v22.18.0`
- npm `11.5.2`
- Hardhat `2.28.6`
- Solidity `0.8.28`
- ethers `6.17.0`
- TypeScript `5.9.3`
- OpenZeppelin Contracts `5.3.0`

The project currently uses npm and `package-lock.json`.

## Available Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npx tsc --noEmit` | Check TypeScript without generating output |
| `npm run compile` | Compile Solidity contracts and export production ABIs |
| `npm test` | Run the complete Hardhat test suite |
| `npm run test:deployment` | Run the focused local deployment regression suite |
| `npx hardhat test test\SavingCore.test.ts` | Run focused SavingCore tests |
| `npx hardhat test test\VaultManager.test.ts` | Run focused VaultManager tests |
| `npm run coverage` | Generate Solidity coverage |
| `npm run clean` | Remove Hardhat-generated files |
| `npm run size` | Report compiled contract sizes |
| `npm run node` | Start a Hardhat node using normal deploy-task behavior |
| `npm run node:local` | Start a persistent localhost node without auto-deploy |
| `npm run deploy:ephemeral` | Deploy and seed on the ephemeral Hardhat network |
| `npm run deploy:local:reset` | Reset-deploy and seed on a running localhost node |
| `npm run deploy:local` | Reuse localhost deployments and idempotently reconcile seed state |
| `npm run verify:local` | Read and verify the current localhost deployment |
| `npx hardhat run scripts/preflight-sepolia-deployment.ts --network sepolia --no-compile` | Run the read-only Sepolia preflight |
| `npm run deploy:sepolia` | Deploy or safely reuse the approved Sepolia deployment |
| `npm run verify:sepolia:state` | Read and verify the Sepolia deployment state |

Validated Phase 13 checkpoints:

- Solidity compilation succeeds with `0.8.28`, optimizer `1,000` runs, and
  `viaIR`;
- TypeScript validation succeeds;
- focused deployment testing reports `5 passing`;
- the complete project suite reports `258 passing`;
- SavingCore deployed bytecode is approximately `12.654 KiB`;
- SavingCore initcode is approximately `13.905 KiB`;
- VaultManager deployed bytecode is approximately `3.483 KiB`;
- VaultManager initcode is approximately `3.897 KiB`;
- production-contract coverage reports 100% statements, 98.40% branches,
  100% functions, and 100% lines;
- complete project coverage reports 99.11% statements, 97.17% branches,
  96.97% functions, and 96.98% lines;
- only the three production ABI files are retained;
- `deployments/hardhat/` and `deployments/localhost/` remain ignored.

Validated Phase 14 checkpoints:

- Sepolia chain ID `11155111`;
- dedicated deployer, owner, and fee receiver
  `0xA998526b0A5F23680f50fa3677f5c6576Dba89d9`;
- three deployed contracts with nonempty bytecode;
- five successful public transaction receipts;
- two-confirmation deployment policy;
- correct constructor dependencies, ownership, authorization, pause states,
  Personal Variant, canonical plan, and C2 formulas;
- no public demo mint, vault funding, or default deposits;
- idempotent rerun with unchanged nonce and balance;
- all three production contracts verified on Etherscan;
- public metadata stored in `data/deployments/sepolia.json`;
- public deployment records retained under `deployments/sepolia/`;
- generated `deployments/*/solcInputs/` files remain ignored.

## Project Structure

Current relevant structure:

    online-banking-capstone/
    ├── contracts/
    │   ├── mocks/
    │   │   ├── MockDepositReceiver.sol
    │   │   ├── MockReentrantToken.sol
    │   │   ├── MockSavingCoreCaller.sol
    │   │   └── MockSavingCoreHarness.sol
    │   ├── MockUSDC.sol
    │   ├── SavingCore.sol
    │   └── VaultManager.sol
    ├── data/
    │   └── abi/
    │       └── contracts/
    │           ├── MockUSDC.sol/
    │           │   └── MockUSDC.json
    │           ├── SavingCore.sol/
    │           │   └── SavingCore.json
    │           └── VaultManager.sol/
    │               └── VaultManager.json
    ├── deploy/
    │   ├── 00_deploy_mock_usdc.ts
    │   ├── 01_deploy_vault_manager.ts
    │   ├── 02_deploy_saving_core.ts
    │   ├── 03_authorize_saving_core.ts
    │   └── 04_seed_demo.ts
    ├── docs/
    │   ├── ARCHITECTURE.md
    │   ├── DESIGN_DECISIONS.md
    │   ├── SECURITY.md
    │   └── UI_UX_PLAN.md
    ├── scripts/
    │   └── verify-local-deployment.ts
    ├── test/
    │   ├── Deployment.test.ts
    │   ├── MockUSDC.test.ts
    │   ├── SavingCore.test.ts
    │   └── VaultManager.test.ts
    ├── .env.example
    ├── .gitignore
    ├── hardhat.config.ts
    ├── package.json
    ├── package-lock.json
    ├── README.md
    └── tsconfig.json

`MockSavingCoreCaller.sol` and `MockSavingCoreHarness.sol` are test-only
contracts. They are not part of the retained production ABI set.

Phase 14 adds these tracked public-deployment assets:

- `deploy/10_deploy_sepolia.ts`;
- `scripts/preflight-sepolia-deployment.ts`;
- `scripts/verify-sepolia-deployment.ts`;
- `data/deployments/sepolia.json`;
- `deployments/sepolia/.chainId`;
- `deployments/sepolia/MockUSDC.json`;
- `deployments/sepolia/VaultManager.json`;
- `deployments/sepolia/SavingCore.json`.

Generated `deployments/*/solcInputs/` files remain ignored.

The local deployment-record directories are generated at runtime and ignored:

- `deployments/hardhat/`;
- `deployments/localhost/`.

Phases 15 and 16 provide the tracked `frontend/` application, including:

- React, TypeScript, and Vite configuration;
- synchronized Sepolia deployment metadata and production ABIs;
- public read and wallet-authorized write clients;
- wallet connection and Sepolia network guards;
- deposit opening, certificate portfolio, lifecycle actions, and C1 claims;
- C2 interest-vault transparency;
- Vietnamese and English localization;
- component, provider, hook, contract-client, and utility tests;
- frontend development and validation documentation.
- shared User Banking App and Admin Portal application shell;
- admin configuration, plan, vault, and deposit-inspection panels;
- per-contract owner authorization and wallet-network guards;
- admin transaction lifecycle feedback and focused test coverage;

Generated `frontend/node_modules/` and `frontend/dist/` directories remain
ignored and are not part of the tracked source structure.

Generated Hardhat artifacts, cache files, TypeChain output, coverage reports,
test-mock ABIs, internal-interface ABIs, local deployment records, and
temporary node logs are not part of the tracked source structure.

## Security Notice

SafeBank follows a defense-in-depth approach.

The project must not claim that the contracts are impossible to hack.

Security will later depend on:

- correct access control;
- state-machine validation;
- current NFT ownership;
- SafeERC20;
- reentrancy protection;
- exact timestamp boundaries;
- principal and interest separation;
- test coverage;
- security tests;
- deployment verification;
- secure administrator-key handling.

Never commit:

- `.env`
- private keys
- wallet seed phrases
- API secrets
- `node_modules/`
- `coverage/`
- `coverage.json`
- `artifacts/`
- `cache/`

## Repository

GitHub repository:

`https://github.com/VuNguyen26/online-banking-capstone`

Current development branch:

`main`

## Next Step

The current action is to finalize:

**Phase 18 — Deterministic Read-Only SafeBank Assistants**

Before Phase 18 may be declared complete:

1. finish documentation alignment and stale-wording audits;
2. review the complete tracked and untracked diff;
3. run secret, generated-file, dependency, scope, and whitespace audits;
4. perform the final User/Admin, Vietnamese/English, and responsive browser
   smoke checks;
5. stage only approved Phase 18 files;
6. inspect the cached diff and cached whitespace result;
7. commit and push Phase 18;
8. fetch and verify matching local and remote commit hashes;
9. confirm ahead/behind is `0 0` and the working tree is clean;
10. produce the Phase 18 checkpoint and Phase 19 handoff.
