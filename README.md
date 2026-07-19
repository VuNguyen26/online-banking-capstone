# SafeBank — Online Banking System

SafeBank is a blockchain-based fixed-term savings system developed for the Blockchain Programming Capstone Project.

Users will deposit six-decimal MockUSDC into a smart contract, receive an ERC721 deposit certificate, and later withdraw, renew, or claim eligible interest according to the on-chain deposit state.

> SafeBank is an educational project. MockUSDC is a freely mintable test token with no real-world monetary value.

## Current Status

Current phase:

**Phase 4 — SavingCore skeleton and saving-plan management implemented and validated locally**

Phase 4 deliverables:

- `contracts/SavingCore.sol`
- `test/SavingCore.test.ts`
- `data/abi/contracts/SavingCore.sol/SavingCore.json`
- Phase 4 README update

Phase 4 implementation includes:

- non-upgradeable `SavingCore`;
- standard OpenZeppelin ERC721 foundation;
- immutable MockUSDC-compatible token reference;
- immutable `VaultManager` reference;
- dependency zero-address and deployed-bytecode validation;
- `Ownable2Step`;
- independent SavingCore pause state;
- `ReentrancyGuard` foundation for later financial entry points;
- fixed two-day personal-variant grace period;
- personal-variant constants for 180-day tenor, 200-bps APR, and 750-bps penalty;
- plan identifiers beginning at `1`;
- saving-plan creation;
- APR-only plan updates;
- plan enable and disable operations;
- explicit tenor, APR, penalty, and deposit-limit validation;
- custom errors and plan-administration events.

Phase 4 validation completed:

- local OpenZeppelin Contracts `5.3.0` API inspection;
- TypeScript validation with `npx tsc --noEmit`;
- Solidity compilation with Solidity `0.8.28`;
- optimizer validation with `1,000` runs;
- successful `viaIR` compilation;
- TypeChain generation;
- ABI exporter validation;
- contract-size reporting;
- focused SavingCore test execution;
- full Hardhat regression test execution;
- real Solidity coverage generation;
- ABI-scope, generated-file, six-decimal, and out-of-scope business-logic checks.

Current verified results:

- `SavingCore` compiled successfully;
- SavingCore deployed bytecode size is approximately `5.755 KiB`;
- SavingCore initcode size is approximately `6.944 KiB`;
- `58 passing` focused SavingCore tests;
- `118 passing` tests in the complete current suite;
- SavingCore coverage reports 100% statements, 100% branches, 100% functions, and 100% lines;
- overall current coverage reports 100% statements, 96.67% branches, 100% functions, and 100% lines;
- no uncovered Solidity lines are reported.

Important interpretation:

- the current coverage applies only to the implemented MockUSDC, VaultManager, SavingCore plan-management foundation, and test mock;
- it is not the final coverage result for the complete SafeBank system;
- SavingCore currently contains no deposit-opening, principal-transfer, certificate-minting, withdrawal, renewal, C1, or C2 business flow;
- inheriting ERC721 does not mean deposit certificates have already been minted;
- inheriting ReentrancyGuard provides a foundation, but no SavingCore token-moving financial entry point exists yet;
- plan updates affect only the stored plan APR intended for future deposits;
- no active deposit snapshot exists yet;
- Phase 4 Git staging, commit, push, local/remote comparison, and final checkpoint are still pending.

Previous completed phases:

- Phase 0: project, environment, Git, and GitHub initialization;
- Phase 1: architecture, security, UI/UX, and design-decision documentation;
- Phase 2: six-decimal MockUSDC contract and tests;
- Phase 3: base VaultManager contract and tests.

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
- Immutable VaultManager ERC20 token reference
- Owner-controlled vault funding
- Owner withdrawal to the current owner
- One-time deployed-contract SavingCore authorization
- Authorized SavingCore-only interest payout
- Fee receiver configuration
- Independent VaultManager pause and unpause
- Vault balance derived from the actual ERC20 balance
- SavingCore contract foundation
- Standard ERC721 certificate foundation
- SavingCore immutable token and VaultManager references
- SavingCore dependency address and bytecode validation
- Independent SavingCore pause and unpause
- SavingCore two-step ownership
- Personal-variant constants
- Plan identifiers beginning at one
- Saving-plan creation
- APR-only plan updates
- Plan enable and disable
- Saving-plan bounds and deposit-range validation
- MockUSDC, VaultManager, and SavingCore ABI export
- Thirteen passing MockUSDC tests
- Forty-seven passing focused VaultManager tests
- Fifty-eight passing focused SavingCore tests
- One hundred eighteen passing tests in the complete current suite
- Current overall Solidity coverage of 100% statements, 96.67% branches, 100% functions, and 100% lines

Not implemented yet:

- Deposit storage and lifecycle
- Principal transfer into SavingCore
- Deposit opening
- ERC721 deposit-certificate minting
- NFT metadata strategy
- APR snapshot per deposit
- Penalty snapshot per deposit
- Maturity timestamp calculation
- Maturity withdrawal
- Early withdrawal
- Manual renewal
- Permissionless auto-renewal
- Timestamp-boundary deposit tests
- SavingCore token-transfer and vault-payout integration
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

No principal custody transaction, deposit, NFT mint, withdrawal, or renewal business flow should currently be treated as implemented.

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
- `ReentrancyGuard` foundation for later financial entry points;
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
- plan administration intentionally available while paused.

The exported project ABI is located at:

`data/abi/contracts/SavingCore.sol/SavingCore.json`

The current Phase 4 implementation intentionally does not include:

- deposit records;
- principal token transfers;
- `openDeposit`;
- `_safeMint` execution;
- deposit certificate issuance;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renewal;
- VaultManager interest requests;
- pending-interest accounting;
- reserved-interest accounting;
- Bonus C1;
- Bonus C2.

ERC721 inheritance establishes the future certificate interface, but no NFT can currently be minted through the public SafeBank business API.

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

At the current locally validated Phase 4 state:

- Solidity `0.8.28`, optimizer with `1,000` runs, and `viaIR` compile successfully;
- focused SavingCore testing reports `58 passing`;
- the complete current suite reports `118 passing`;
- SavingCore coverage reports 100% statements, branches, functions, and lines;
- overall coverage reports 100% statements, 96.67% branches, 100% functions, and 100% lines;
- no uncovered Solidity lines are reported;
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

**Phase 4 — SavingCore skeleton and saving-plan management**

Before Phase 4 may be declared complete:

1. review the complete SavingCore source, test, ABI, and README diff;
2. confirm that no deposit, NFT-minting, withdrawal, renewal, C1, or C2 business logic exists;
3. confirm that only the project-owned SavingCore ABI is retained;
4. run final TypeScript, compile, focused test, full regression, and coverage checks;
5. run whitespace, generated-file, scope, and secret checks;
6. stage only the approved Phase 4 files;
7. commit with `feat: add saving plan management`;
8. push the commit to `origin/main`;
9. confirm that local and remote commits match;
10. confirm that the working tree is clean;
11. produce the complete Phase 4 checkpoint;
12. stop and wait for explicit user approval.

After Phase 4 is fully committed, pushed, and approved, the next planned phase is:

**Phase 5 — Deposit opening, financial-term snapshots, and ERC721 deposit certificates**

Phase 5 must not begin automatically.
