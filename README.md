# SafeBank — Online Banking System

SafeBank is a blockchain-based fixed-term savings system developed for the Blockchain Programming Capstone Project.

Users will deposit six-decimal MockUSDC into a smart contract, receive an ERC721 deposit certificate, and later withdraw, renew, or claim eligible interest according to the on-chain deposit state.

> SafeBank is an educational project. MockUSDC is a freely mintable test token with no real-world monetary value.

## Current Status

Current phase:

**Phase 3 — Basic VaultManager contract and tests completed locally**

Phase 3 deliverables:

- `contracts/VaultManager.sol`
- `contracts/mocks/MockSavingCoreCaller.sol`
- `test/VaultManager.test.ts`
- `data/abi/contracts/VaultManager.sol/VaultManager.json`
- Phase 3 README update

Phase 3 validation completed:

- local OpenZeppelin `5.3.0` API inspection;
- TypeScript validation with `npx tsc --noEmit`;
- Solidity compilation with Solidity `0.8.28`;
- optimizer validation with `1,000` runs;
- successful `viaIR` compilation;
- TypeChain generation;
- ABI exporter validation;
- contract-size reporting;
- focused VaultManager test execution;
- full Hardhat regression test execution;
- real Solidity coverage generation;
- scope, six-decimal usage, and whitespace checks.

Current verified results:

- `VaultManager` compiled successfully;
- VaultManager deployed bytecode size is approximately `2.991 KiB`;
- VaultManager initcode size is approximately `3.391 KiB`;
- the test-only MockSavingCoreCaller deployed size is approximately `0.334 KiB`;
- `47 passing` focused VaultManager tests;
- `60 passing` tests in the complete current suite;
- current Solidity coverage reports 100% statements, 94% branches, 100% functions, and 100% lines.

Important interpretation:

- the coverage result applies to the currently implemented MockUSDC, VaultManager, and test mock sources;
- it is not the final coverage result for the complete SafeBank system;
- MockSavingCoreCaller is test-only and is not a SavingCore implementation;
- VaultManager currently implements only the mandatory base interest-liquidity behavior;
- Bonus C1 pending-interest behavior is not implemented;
- Bonus C2 reserved-interest and solvency accounting are not implemented;
- no saving plans, deposits, ERC721 certificates, withdrawal lifecycle, renewal flow, frontend, or AI assistant exists yet;
- Phase 4 must not begin without explicit user confirmation.

Previous completed phases:

- Phase 0: project, environment, Git, and GitHub initialization;
- Phase 1: architecture, security, UI/UX, and design-decision documentation;
- Phase 2: six-decimal MockUSDC contract and tests.
## Current Implementation Status

Completed:

- Hardhat project initialization
- npm package-manager standardization
- TypeScript and Hardhat configuration
- Environment-variable cleanup
- solidity-coverage setup
- Git repository initialization
- GitHub remote setup
- Phase 0 root commit and push
- Architecture documentation
- Security-model documentation
- UI/UX planning
- Design-decision records
- Six-decimal `MockUSDC` ERC20 implementation
- Permissionless test-token minting
- MockUSDC metadata, transfer, allowance, and failure-case validation
- Basic `VaultManager` interest-liquidity custody
- Immutable ERC20 token reference
- Owner-controlled vault funding
- Owner withdrawal to the current owner
- One-time deployed-contract SavingCore authorization
- Authorized SavingCore-only interest payout
- Fee receiver configuration
- Independent VaultManager pause and unpause
- `Ownable2Step`, `SafeERC20`, and `ReentrancyGuard` integration
- Vault balance derived from the actual ERC20 balance
- MockUSDC and VaultManager ABI export
- Thirteen passing MockUSDC tests
- Forty-seven passing focused VaultManager tests
- Sixty passing tests in the complete current suite
- Current Solidity coverage of 100% statements, 94% branches, 100% functions, and 100% lines

Not implemented yet:

- `SavingCore.sol`
- Saving-plan management
- Deposit opening
- ERC721 deposit certificates
- Maturity withdrawal
- Early withdrawal
- Manual renewal
- Auto-renewal
- SavingCore pause behavior
- Deposit lifecycle and timestamp-boundary tests
- SavingCore reentrancy and malicious-token security suites
- Bonus C1
- Bonus C2
- Deployment scripts
- Local contract deployment
- Sepolia deployment
- Etherscan verification
- User Banking App
- Admin Portal
- AI Banking Assistant
- AI Risk Assistant
- Final README
- Demo video
- Final submission audit

No principal custody, deposit, NFT, withdrawal, or renewal business flow should currently be treated as implemented.
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

The planned primary savings contract.

Its responsibilities will include:

- holding user principal;
- managing saving plans;
- opening deposits;
- snapshotting APR and penalty;
- minting ERC721 deposit certificates;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- permissionless auto-renewal;
- pending-interest accounting after Bonus C1.

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
| `npm test` | Run Hardhat tests |
| `npm run coverage` | Generate Solidity coverage |
| `npm run clean` | Remove Hardhat-generated files |
| `npm run size` | Report compiled contract sizes |
| `npm run node` | Start a local Hardhat node |

At the current Phase 3 checkpoint:

- the Solidity toolchain has successfully compiled `MockUSDC`, `VaultManager`, and the test-only mock;
- Solidity `0.8.28`, optimizer with `1,000` runs, and `viaIR` remain validated;
- the complete current test suite reports `60 passing`;
- focused VaultManager testing reports `47 passing`;
- coverage reports 100% statements, 94% branches, 100% functions, and 100% lines;
- `artifacts/`, `cache/`, `typechain/`, `coverage/`, and `coverage.json` remain ignored;
- project-owned MockUSDC and VaultManager ABIs are exported for later application integration;
- test-mock ABIs are not retained as project integration artifacts.
## Project Structure

Current relevant structure:

    online-banking-capstone/
    ├── contracts/
    │   ├── mocks/
    │   │   └── MockSavingCoreCaller.sol
    │   ├── MockUSDC.sol
    │   └── VaultManager.sol
    ├── data/
    │   └── abi/
    │       └── contracts/
    │           ├── MockUSDC.sol/
    │           │   └── MockUSDC.json
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
    │   └── VaultManager.test.ts
    ├── .env.example
    ├── .gitignore
    ├── hardhat.config.ts
    ├── package.json
    ├── package-lock.json
    ├── README.md
    └── tsconfig.json

`MockSavingCoreCaller.sol` is a minimal test-only authorization caller and is not the SavingCore implementation.

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

The next planned phase is:

**Phase 4 — SavingCore skeleton and saving-plan management**

Phase 4 must not begin automatically.

Before moving to Phase 4:

1. review the complete Phase 3 source diff;
2. confirm that VaultManager contains no principal, deposit, C1, or C2 logic;
3. verify that only project-owned MockUSDC and VaultManager ABIs are retained;
4. run final TypeScript, compile, focused test, full test, and coverage checks;
5. run whitespace, generated-file, scope, and secret checks;
6. stage only the approved Phase 3 files;
7. commit with `feat: add secure interest vault manager`;
8. push the commit to `origin/main`;
9. confirm that local and remote commits match;
10. confirm that the working tree is clean;
11. produce the complete Phase 3 checkpoint;
12. wait for explicit user approval.
