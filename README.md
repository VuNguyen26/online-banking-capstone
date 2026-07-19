# SafeBank — Online Banking System

SafeBank is a blockchain-based fixed-term savings system developed for the Blockchain Programming Capstone Project.

Users will deposit six-decimal MockUSDC into a smart contract, receive an ERC721 deposit certificate, and later withdraw, renew, or claim eligible interest according to the on-chain deposit state.

> SafeBank is an educational project. MockUSDC is a freely mintable test token with no real-world monetary value.

## Current Status

Current phase:

**Phase 5 — Deposit opening, financial-term snapshots, and ERC721 deposit certificates implemented and validated locally**

Phase 5 deliverables:

- `contracts/SavingCore.sol`
- `contracts/mocks/MockDepositReceiver.sol`
- `test/SavingCore.test.ts`
- `data/abi/contracts/SavingCore.sol/SavingCore.json`
- Phase 5 documentation updates

Phase 5 implementation includes:

- deposit identifiers beginning at `1`;
- `tokenId == depositId`;
- active deposit records;
- principal custody inside `SavingCore`;
- `openDeposit(planId, amount)`;
- plan existence and enabled-state validation;
- minimum and maximum deposit validation;
- `startedAt` and `maturityAt`;
- tenor, APR, and penalty snapshots;
- `SafeERC20.safeTransferFrom`;
- safe ERC721 certificate minting;
- `DepositOpened`;
- `whenNotPaused`;
- `nonReentrant`;
- smart-contract receiver support;
- complete rollback when ERC20 transfer or NFT delivery fails;
- callback reentrancy protection.

Phase 5 validation completed:

- TypeScript validation with `npx tsc --noEmit`;
- Solidity `0.8.28` compilation;
- optimizer validation with `1,000` runs and `viaIR`;
- TypeChain and ABI generation;
- contract-size reporting;
- focused SavingCore tests;
- full regression tests;
- focused and full-project Solidity coverage;
- ERC20 allowance and balance failure tests;
- invalid ERC721 receiver rollback tests;
- ERC721 callback reentrancy tests;
- paused deposit-opening tests;
- ABI and out-of-scope function checks.

Current verified results:

- SavingCore deployed bytecode: approximately `7.677 KiB`;
- SavingCore initcode: approximately `8.873 KiB`;
- `13 passing` MockUSDC tests;
- `47 passing` VaultManager tests;
- `84 passing` focused SavingCore tests;
- `144 passing` tests in the complete suite;
- SavingCore coverage: 100% statements, branches, functions, and lines;
- overall coverage: 98.75% statements, 94.74% branches, 100% functions, and 97.22% lines.

Important interpretation:

- user principal is now transferred into and held by `SavingCore`;
- `VaultManager` continues to hold only bank-funded interest liquidity;
- opening a deposit does not call `VaultManager`;
- each deposit snapshots its tenor, APR, and penalty at opening;
- later plan updates do not modify existing deposit snapshots;
- the ERC721 certificate is transferable;
- the current NFT owner will control future deposit economic rights;
- rich NFT metadata and a custom `tokenURI` strategy remain deferred;
- withdrawal, early withdrawal, renewal, C1, and C2 are not implemented;
- Phase 5 Git staging, commit, push, remote comparison, and final checkpoint are still pending.

Previous completed phases:

- Phase 0: project, environment, Git, and GitHub initialization;
- Phase 1: architecture, security, UI/UX, and design-decision documentation;
- Phase 2: six-decimal MockUSDC contract and tests;
- Phase 3: base VaultManager contract and tests;
- Phase 4: SavingCore foundation and saving-plan management.

## Current Implementation Status

Completed:

- Hardhat, TypeScript, coverage, Git, and GitHub setup
- Architecture, security, UI/UX, and design-decision documentation
- Six-decimal permissionless `MockUSDC`
- Base `VaultManager`
- SavingCore ownership, pause, and saving-plan management
- Deposit storage and active status
- Principal transfer into SavingCore
- Deposit opening
- ERC721 deposit-certificate issuance
- Sequential deposit and NFT identifiers beginning at one
- Tenor, APR, and penalty snapshots
- Deposit start and maturity timestamps
- SafeERC20 transfer handling
- Safe ERC721 minting
- Failed-transfer and failed-receiver rollback
- ERC721 receiver reentrancy protection
- MockUSDC, VaultManager, and SavingCore ABI export
- 144 passing tests
- 100% coverage across all four metrics for SavingCore

Not implemented yet:

- Rich NFT metadata or custom `tokenURI`
- Maturity withdrawal
- Early withdrawal
- Manual renewal
- Permissionless auto-renewal
- Interest calculation and payout integration
- Withdrawal and renewal timestamp-boundary tests
- Bonus C1
- Bonus C2
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

No withdrawal, renewal, C1, or C2 business flow should currently be treated as implemented.
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

`VaultManager` is now implemented as the base bank-funded interest-liquidity contract.

Implemented characteristics:

- immutable MockUSDC-compatible ERC20 reference;
- initial owner configured through OpenZeppelin `Ownable`;
- two-step ownership transfers through `Ownable2Step`;
- nonzero initial fee receiver;
- owner-only fee receiver updates;
- owner-only vault funding through `SafeERC20.safeTransferFrom`;
- funding remains available while paused for liquidity restoration;
- owner-only withdrawal to the current owner while unpaused;
- one-time owner-only authorization of a deployed SavingCore-compatible contract;
- interest payout callable only by the authorized contract;
- interest payout blocked while paused;
- zero-address, zero-amount, authorization, and liquidity validation;
- actual ERC20 balance used as the vault balance source of truth;
- reentrancy protection on token-moving entry points;
- inherited pause, unpause, and ownership events;
- explicit administrative and payout events.

The exported project ABI is located at:

`data/abi/contracts/VaultManager.sol/VaultManager.json`

VaultManager does not hold user principal.

The current base implementation intentionally does not include:

- Bonus C1 pending-interest logic;
- Bonus C2 reserved-interest accounting;
- `totalReservedInterest`;
- available-liquidity or solvency calculations;
- SavingCore deposit business logic.

### SavingCore

`SavingCore` is now implemented as the contract foundation and saving-plan administration layer.

Implemented characteristics:

- non-upgradeable deployment model;
- standard OpenZeppelin ERC721 inheritance;
- collection name `SafeBank Deposit Certificate`;
- collection symbol `SBDC`;
- immutable MockUSDC-compatible ERC20 reference;
- immutable deployed `VaultManager` reference;
- nonzero dependency validation;
- deployed-bytecode validation for token and vault dependencies;
- initial owner configured through OpenZeppelin `Ownable`;
- two-step ownership transfers through `Ownable2Step`;
- independent pause and unpause through `Pausable`;
- `ReentrancyGuard` protection for deposit-opening financial operations;
- fixed `GRACE_PERIOD` of two days;
- personal-variant constants:
  - `DEFAULT_TENOR_DAYS = 180`;
  - `DEFAULT_APR_BPS = 200`;
  - `DEFAULT_EARLY_WITHDRAW_PENALTY_BPS = 750`;
- plan identifiers beginning at `1`;
- plan ID `0` treated as invalid;
- saving plans containing tenor, APR, minimum deposit, maximum deposit, penalty, and enabled state;
- owner-only plan creation;
- owner-only APR update;
- owner-only plan enable and disable;
- tenor validation from 1 through 3,650 days;
- APR validation from 1 through 10,000 basis points;
- penalty validation from 0 through 10,000 basis points;
- zero minimum interpreted as no lower plan limit;
- zero maximum interpreted as no upper plan limit;
- rejection when both limits are nonzero and minimum exceeds maximum;
- duplicate enable and disable operations rejected explicitly;
- read-only plan access available while paused;
- plan administration intentionally available while paused;
- deposit identifiers beginning at `1`;
- deposit ID `0` treated as invalid;
- `tokenId == depositId`;
- active deposit records containing principal and snapshotted terms;
- `openDeposit(planId, amount)`;
- enabled-plan and deposit-limit validation;
- principal transferred from the depositor into `SavingCore`;
- `startedAt` and `maturityAt` calculation;
- tenor, APR, and penalty snapshots;
- `SafeERC20.safeTransferFrom`;
- safe ERC721 certificate minting to the depositor;
- `DepositOpened` events;
- complete rollback on token-transfer or NFT-receiver failure;
- callback reentrancy protection;
- deposit and certificate reads while paused.

The exported project ABI is located at:

`data/abi/contracts/SavingCore.sol/SavingCore.json`

The current Phase 5 implementation intentionally does not include:

- maturity withdrawal;
- early withdrawal;
- manual renewal;
- permissionless auto-renewal;
- interest calculation or VaultManager payout requests;
- pending-interest accounting;
- reserved-interest accounting;
- Bonus C1;
- Bonus C2;
- rich NFT metadata or a custom `tokenURI` implementation.

ERC721 certificates can now be minted through `openDeposit`. Financial rights are derived from the on-chain deposit record and current NFT ownership, not from off-chain metadata.

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

SafeBank has selected two bonus challenges.

### C1 — Principal-First Settlement

Planned behavior:

- return principal at maturity even when the vault cannot pay interest;
- record unpaid interest as pending;
- snapshot the eligible claimant;
- permit a later claim after the vault is funded.

Status:

**Selected, documented, but not implemented.**

### C2 — Solvency Guard

Planned behavior:

- track total reserved interest;
- calculate available liquidity;
- prevent administrator withdrawal above available liquidity;
- expose vault funding shortfall.

Status:

**Selected, documented, but not implemented.**

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
- review solvency and liabilities after C2.

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

At the current locally validated Phase 5 state:

- Solidity `0.8.28`, optimizer with `1,000` runs, and `viaIR` compile successfully;
- focused SavingCore testing reports `84 passing`;
- the complete current suite reports `144 passing`;
- SavingCore deployed bytecode is approximately `7.677 KiB`;
- SavingCore initcode is approximately `8.873 KiB`;
- SavingCore coverage reports 100% statements, branches, functions, and lines;
- MockUSDC coverage reports 100% statements, branches, functions, and lines;
- VaultManager coverage reports 100% statements, 94% branches, 100% functions, and 100% lines;
- overall coverage reports 98.75% statements, 94.74% branches, 100% functions, and 97.22% lines;
- remaining uncovered lines belong only to the test-only `MockDepositReceiver`;
- `artifacts/`, `cache/`, `typechain/`, `coverage/`, and `coverage.json` remain ignored;
- project-owned MockUSDC, VaultManager, and SavingCore ABIs are retained;
- test-mock ABIs are removed before staging and are not project integration artifacts.

## Project Structure

Current relevant structure:

    online-banking-capstone/
    ├── contracts/
    │   ├── mocks/
    │   │   └── MockSavingCoreCaller.sol
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

`MockSavingCoreCaller.sol` remains a minimal test-only authorization caller and is not the SavingCore implementation.

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

**Phase 5 — Deposit opening, financial-term snapshots, and ERC721 deposit certificates**

Before Phase 5 may be declared complete:

1. review the complete SavingCore, receiver mock, tests, ABI, and documentation diff;
2. confirm deposit opening, snapshots, principal custody, and certificate minting are implemented;
3. confirm withdrawal, renewal, C1, and C2 logic are not implemented;
4. remove generated test-mock ABIs before staging;
5. run final TypeScript, compile, focused test, full regression, coverage, and size checks;
6. run whitespace, generated-file, scope, and secret checks;
7. stage only the approved Phase 5 files;
8. commit with `feat: add deposit opening and NFT certificates`;
9. push the commit to `origin/main`;
10. confirm that local and remote commits match;
11. confirm that the working tree is clean;
12. produce the complete Phase 5 checkpoint;
13. stop and wait for explicit user approval.

After Phase 5 is fully committed, pushed, and approved, the next planned phase is:

**Phase 6 — Maturity withdrawal flow**

Phase 6 must not begin automatically.