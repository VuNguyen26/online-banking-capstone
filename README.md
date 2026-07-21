# SafeBank — Online Banking System

SafeBank is a blockchain-based fixed-term savings system developed for the Blockchain Programming Capstone Project.

Users will deposit six-decimal MockUSDC into a smart contract, receive an ERC721 deposit certificate, and later withdraw, renew, or claim eligible interest according to the on-chain deposit state.

> SafeBank is an educational project. MockUSDC is a freely mintable test token with no real-world monetary value.

## Current Status

Current phase:

**Phase 12 — Bonus C2 Solvency Guard implemented and validated locally**

Phase 12 deliverables:

- `contracts/SavingCore.sol`
- `contracts/VaultManager.sol`
- `contracts/mocks/MockSavingCoreCaller.sol`
- `contracts/mocks/MockSavingCoreHarness.sol`
- `test/SavingCore.test.ts`
- `test/VaultManager.test.ts`
- updated production ABIs for `SavingCore` and `VaultManager`
- Phase 12 documentation updates

Phase 12 implementation includes:

- aggregate `totalReservedInterest` stored by `SavingCore`;
- one expected-interest reservation for every positive-interest active deposit;
- zero-rounded interest producing no phantom reserve;
- reserve values calculated from each deposit's snapshotted principal, APR,
  and tenor;
- early withdrawal releasing the old term's full unused reserve;
- fully funded maturity settlement consuming the old reserve;
- C1 deferred interest remaining reserved until a successful later claim;
- successful pending-interest claims consuming the remaining reserve;
- manual renewal atomically consuming the old reserve and creating the new
  selected-plan reserve;
- permissionless auto-renew atomically consuming the old reserve and creating
  the new snapshot-based reserve;
- complete EVM rollback of reserve transitions when token transfers, vault
  payouts, authorization, pause checks, or safe NFT minting fail;
- undercollateralized deposit opening remaining allowed;
- `VaultManager.totalReservedInterest()` reading aggregate liabilities from
  the one-time authorized `SavingCore`;
- `VaultManager.availableLiquidity()` using saturating subtraction;
- `VaultManager.fundingShortfall()` exposing uncovered liabilities;
- owner withdrawal limited to current available liquidity;
- zero reserve reported by `VaultManager` before SavingCore authorization;
- direct vault funding and direct ERC20 transfers changing balance metrics
  without changing liabilities;
- no user principal held by `VaultManager`;
- no production dependency on test-only mocks or harnesses.

Phase 12 validation completed:

- `npm run clean`;
- Solidity `0.8.28` compilation with optimizer `1,000` runs and `viaIR`;
- TypeScript validation with `npx tsc --noEmit`;
- TypeChain generation for 37 artifacts and 108 typings;
- 13 MockUSDC tests;
- 55 VaultManager tests;
- 185 SavingCore tests;
- **253 passing** across the complete project suite;
- C2 tests for reservation, release, consumption, deferred liabilities,
  renewal transitions, undercollateralization, available liquidity, funding
  shortfall, withdrawal limits, rollback, and invariant protection;
- 100% statements, branches, functions, and lines for `SavingCore`;
- 100% statements, functions, and lines for `VaultManager`;
- production-contract coverage of 100% statements, 98.40% branches,
  100% functions, and 100% lines;
- complete project coverage of 99.11% statements, 97.17% branches,
  96.97% functions, and 96.98% lines;
- `SavingCore` deployed bytecode approximately `12.654 KiB`;
- `SavingCore` initcode approximately `13.905 KiB`;
- `VaultManager` deployed bytecode approximately `3.483 KiB`;
- `VaultManager` initcode approximately `3.897 KiB`;
- production ABI audit:
  - SavingCore: 107 entries, 50 functions, 19 events, 37 errors;
  - VaultManager: 42 entries, 20 functions, 9 events, 12 errors;
  - MockUSDC: 19 entries, 10 functions, 2 events, 6 errors;
- generated coverage output, test-mock ABIs, and internal interface ABI removed
  before staging.

Current limitations and pending work:

- rich NFT metadata remains unimplemented;
- deployment scripts and local deployment workflow remain pending;
- Sepolia deployment and Etherscan verification remain pending;
- frontend, AI assistants, demo video, and final submission remain pending;
- Phase 12 staging, commit, push, remote verification, and final checkpoint
  remain pending.

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
- Phase 11: Bonus C1 principal-first settlement and deferred-interest claims.

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
- Reservation on positive-interest deposit opening
- Reserve release on early withdrawal
- Reserve consumption on funded maturity and successful pending claim
- Old-reserve consumption plus new-reserve creation on manual and auto renewal
- Undercollateralized deposit opening with explicit funding shortfall
- Vault available-liquidity calculation
- Owner-withdrawal protection for reserved liquidity
- Production ABI export for MockUSDC, SavingCore, and VaultManager
- 253 passing tests
- 100% statements, branches, functions, and lines for SavingCore
- 100% statements, functions, and lines for VaultManager

Not implemented yet:

- Rich NFT metadata or custom `tokenURI`
- Deployment scripts
- Local deployment workflow
- Sepolia deployment
- Etherscan verification
- User Banking App
- Admin Portal
- AI Banking Assistant
- AI Risk Assistant
- Demo video
- Final submission audit

Mandatory contract flows, Bonus C1, and Bonus C2 are implemented and validated
locally. Deployment and product layers remain pending.

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

## Planned User Experience

SafeBank will eventually provide two clearly separated product areas.

### User Banking App

Planned capabilities:

- connect wallet;
- browse plans;
- estimate interest;
- approve exact MockUSDC amount;
- open a deposit;
- view owned certificates;
- withdraw early;
- withdraw at maturity;
- manually renew;
- trigger auto-renew;
- claim pending interest after C1.

### Admin Portal

Planned capabilities:

- create and manage plans;
- fund VaultManager;
- withdraw available liquidity;
- update fee receiver;
- pause and unpause;
- inspect audit events;
- review implemented solvency and liability metrics.

Neither frontend currently exists.

## Planned AI Assistants

### AI Banking Assistant

Planned to explain:

- saving plans;
- interest;
- penalties;
- maturity;
- renewal;
- pending interest;
- transaction errors.

### AI Risk Assistant

Planned to explain:

- vault balance;
- reserved interest;
- available liquidity;
- solvency ratio;
- funding shortfall;
- upcoming maturity risk.

AI will not:

- hold private keys;
- request seed phrases;
- sign transactions;
- submit transactions;
- change plans;
- withdraw funds;
- fabricate financial values.

Neither AI assistant currently exists.

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
| `npm run compile` | Compile Solidity contracts |
| `npm test` | Run the complete Hardhat test suite |
| `npx hardhat test test\SavingCore.test.ts` | Run focused SavingCore tests |
| `npm run coverage` | Generate Solidity coverage |
| `npm run clean` | Remove Hardhat-generated files |
| `npm run size` | Report compiled contract sizes |
| `npm run node` | Start a local Hardhat node |

At the current locally validated Phase 12 state:

- Solidity `0.8.28`, optimizer with `1,000` runs, and `viaIR` compile
  successfully;
- TypeScript validation passes with `npx tsc --noEmit`;
- focused SavingCore testing reports `185 passing`;
- focused VaultManager testing reports `55 passing`;
- the complete project suite reports `253 passing`;
- SavingCore deployed bytecode is approximately `12.654 KiB`;
- SavingCore initcode is approximately `13.905 KiB`;
- VaultManager deployed bytecode is approximately `3.483 KiB`;
- VaultManager initcode is approximately `3.897 KiB`;
- SavingCore coverage reports 100% statements, branches, functions, and lines;
- VaultManager coverage reports 100% statements, functions, and lines;
- production-contract coverage reports 100% statements, 98.40% branches,
  100% functions, and 100% lines;
- complete project coverage reports 99.11% statements, 97.17% branches,
  96.97% functions, and 96.98% lines;
- `artifacts/`, `cache/`, `typechain/`, `coverage/`, and `coverage.json` remain
  ignored;
- production MockUSDC, VaultManager, and SavingCore ABIs are retained;
- generated test-mock and internal-interface ABIs are removed before staging.


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
    │   └── .gitkeep
    ├── docs/
    │   ├── ARCHITECTURE.md
    │   ├── DESIGN_DECISIONS.md
    │   ├── SECURITY.md
    │   └── UI_UX_PLAN.md
    ├── scripts/
    │   └── .gitkeep
    ├── test/
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

`MockSavingCoreCaller.sol` and `MockSavingCoreHarness.sol` are test-only contracts. The harness exposes one internal invariant solely for coverage and is not part of the production architecture or retained ABI set.

The `frontend/` directory has not been created.

Generated Hardhat artifacts, cache files, TypeChain output, coverage reports, and test-mock ABIs are not part of the tracked source structure.

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

**Phase 12 — Bonus C2 Solvency Guard**

Before Phase 12 may be declared complete:

1. keep README, architecture, security, UI/UX, and design decisions aligned with
   the validated C2 behavior;
2. confirm aggregate reserve transitions across open, early withdrawal,
   maturity, deferred C1 claims, manual renewal, and auto-renew;
3. confirm undercollateralized deposit opening remains allowed;
4. confirm `availableLiquidity` and `fundingShortfall` use saturating
   subtraction;
5. confirm owner withdrawal cannot consume reserved liquidity;
6. retain only production ABIs;
7. run final clean compile, TypeScript, focused tests, full regression,
   coverage, contract-size, whitespace, scope, secret, and generated-file
   audits;
8. stage only approved Phase 12 files;
9. commit and push the Phase 12 changes;
10. fetch the remote and confirm local and remote hashes match;
11. confirm ahead/behind is `0 0` and the working tree is clean;
12. produce the complete Phase 12 checkpoint and MASTER HANDOFF PROMPT;
13. stop before Phase 13.

After Phase 12 is committed, pushed, and verified, the next planned phase is:

**Phase 13 — Deployment scripts and local deployment workflow**

Phase 13 must not begin automatically.
