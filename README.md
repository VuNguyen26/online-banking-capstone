# SafeBank — Online Banking System

SafeBank is a blockchain-based fixed-term savings system developed for the Blockchain Programming Capstone Project.

Users will deposit six-decimal MockUSDC into a smart contract, receive an ERC721 deposit certificate, and later withdraw, renew, or claim eligible interest according to the on-chain deposit state.

> SafeBank is an educational project. MockUSDC is a freely mintable test token with no real-world monetary value.

## Current Status

Current phase:

**Phase 9 — Permissionless auto-renewal after the grace period implemented and validated locally**

Phase 9 deliverables:

- `contracts/SavingCore.sol`
- `contracts/mocks/MockDepositReceiver.sol`
- `contracts/mocks/MockReentrantToken.sol`
- `test/SavingCore.test.ts`
- `data/abi/contracts/SavingCore.sol/SavingCore.json`
- Phase 9 documentation updates

Phase 9 implementation includes:

- `autoRenew(depositId)`;
- permissionless execution by any address;
- old deposit must exist and remain `Active`;
- eligibility begins at:
  `block.timestamp >= maturityAt + GRACE_PERIOD`;
- `AutoRenewalTooEarly` before the exact grace-period end;
- the renewed NFT is minted to the current owner of the old certificate;
- the transaction caller receives no ownership merely for triggering;
- old principal, plan ID, tenor, APR, and penalty snapshots are preserved;
- current plan APR, enabled state, and deposit limits are not reapplied;
- disabling or updating the original plan does not block auto-renew;
- old-term interest is calculated for exactly one stored term;
- delayed execution creates one new term only, without retroactive catch-up;
- the new term begins at the successful transaction timestamp;
- positive interest is transferred from `VaultManager` into `SavingCore`;
- new principal equals old principal plus funded old-term interest;
- zero-rounded interest skips `VaultManager.payInterest`;
- zero-interest auto-renew may succeed while only VaultManager is paused;
- old deposit transitions from `Active` to `AutoRenewed`;
- one new `Active` deposit and one new ERC721 certificate are created;
- the old NFT remains as historical evidence;
- `Renewed` is emitted using the preserved old plan ID;
- auto-renew does not emit `DepositOpened` or `Withdrawn`;
- SavingCore pause blocks auto-renew;
- positive-interest execution requires an authorized, funded, and unpaused VaultManager;
- underfunding, missing authorization, paused payout, and unsafe NFT receipt roll back atomically;
- ERC20 payout callbacks and ERC721 receiver callbacks cannot reenter auto-renew;
- maturity withdrawal and auto-renew may compete after grace;
- the first successfully mined terminal transaction wins;
- all later conflicting actions are rejected by the terminal deposit status.

Phase 9 validation completed:

- TypeScript validation with `npx tsc --noEmit`;
- Solidity `0.8.28` compilation;
- optimizer with `1,000` runs and `viaIR`;
- TypeChain and ABI generation;
- `17 passing` focused permissionless auto-renew tests;
- `161 passing` complete SavingCore regression tests;
- `221 passing` complete project regression tests;
- exact grace-period boundary tests;
- permissionless caller and current-owner recipient tests;
- transferred-certificate ownership tests;
- snapshot preservation and disabled-plan tests;
- delayed execution and no-catch-up tests;
- current-plan deposit-limit bypass tests;
- zero-interest and positive-interest execution tests;
- SavingCore and VaultManager pause tests;
- underfunded and unauthorized VaultManager rollback tests;
- failed safe-mint rollback tests;
- lifecycle and competing-transaction ordering tests;
- ERC20 and ERC721 callback reentrancy tests;
- SavingCore-focused Solidity coverage;
- ABI, generated-file, scope, and whitespace checks.

Current verified results:

- SavingCore deployed bytecode: approximately `11.021 KiB`;
- SavingCore initcode: approximately `12.266 KiB`;
- `13 passing` MockUSDC tests;
- `47 passing` VaultManager tests;
- `161 passing` SavingCore tests;
- `221 passing` tests in the complete suite;
- SavingCore coverage: 100% statements, branches, functions, and lines;
- no uncovered SavingCore statement, branch, function, or line.

Important interpretation:

- permissionless execution improves liveness but does not transfer ownership;
- the current old-certificate owner receives the renewed certificate;
- auto-renew preserves the old plan ID, tenor, APR, and penalty snapshots;
- current plan changes do not alter an existing deposit's auto-renew terms;
- the old principal remains held by `SavingCore`;
- old-term interest is bank-funded by `VaultManager`;
- no unfunded interest is added to the new principal;
- one successful call creates exactly one new term;
- user wallet balance and total token supply remain unchanged;
- the old NFT remains and the new active deposit receives a new NFT;
- positive-interest execution depends on VaultManager authorization, liquidity, and pause state;
- zero-interest execution does not call VaultManager;
- failed payout or certificate delivery restores all state and balances;
- pending-interest accounting, reserved-interest accounting, C1, and C2 remain unimplemented;
- deployment, frontend, AI, demo, and final submission remain pending;
- Phase 9 staging, commit, push, remote verification, and checkpoint remain pending.

Previous completed phases:

- Phase 0: project, environment, Git, and GitHub initialization;
- Phase 1: architecture, security, UI/UX, and design-decision documentation;
- Phase 2: six-decimal MockUSDC contract and tests;
- Phase 3: base VaultManager contract and tests;
- Phase 4: SavingCore foundation and saving-plan management;
- Phase 5: deposit opening, financial-term snapshots, principal custody, and ERC721 deposit certificates;
- Phase 6: base maturity withdrawal flow;
- Phase 7: early withdrawal with snapshotted penalty and atomic settlement;
- Phase 8: manual renewal during the two-day grace period.

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
- Base maturity withdrawal
- Snapshotted simple-interest calculation
- Principal payout from SavingCore
- Interest payout through VaultManager
- Maturity withdrawal at exact maturity and after grace while active
- Early withdrawal before maturity
- Snapshotted early-withdrawal penalty calculation
- Net-principal payout to the direct current NFT owner
- Penalty payout to the current fee receiver
- Exact maturity rejection for early withdrawal
- Current NFT owner settlement rights
- Approved ERC721 operator rejection
- Disabled-plan settlement isolation
- Underfunded-vault maturity rollback
- Atomic early-withdrawal transfer rollback
- Maturity and early-withdrawal reentrancy protection
- Manual renewal during the two-day grace period
- Old-snapshot interest compounding into a selected-plan deposit
- Selected-plan validation and new-term snapshots
- Manual-renewal funding and atomic rollback
- Manual-renewal ERC20 and ERC721 callback reentrancy protection
- Permissionless auto-renewal after the two-day grace period
- Exact grace-period-end auto-renew eligibility
- Current-owner-safe renewed NFT issuance
- Old plan ID, tenor, APR, and penalty snapshot preservation
- Disabled-plan and updated-plan auto-renew isolation
- One delayed call creating exactly one new term
- Auto-renew without reapplying current plan deposit limits
- Positive-interest funded compounding
- Zero-interest VaultManager payout bypass
- Auto-renew VaultManager rollback protection
- Auto-renew safe-mint rollback protection
- Auto-renew ERC20 and ERC721 callback reentrancy protection
- First-mined terminal-action lifecycle enforcement
- New ERC721 certificate issuance while retaining old certificates
- Historical NFT retention
- MockUSDC, VaultManager, and SavingCore ABI export
- 221 passing tests
- 100% statements, branches, functions, and lines for SavingCore

Not implemented yet:

- Rich NFT metadata or custom `tokenURI`
- Pending-interest accounting
- Reserved-interest accounting
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

Manual renewal and permissionless auto-renewal are implemented and validated locally.

Pending-interest accounting, reserved-interest accounting, C1, and C2 must not yet be treated as implemented.

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

`SavingCore` is now implemented as the central deposit lifecycle, certificate, withdrawal, and renewal contract.

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
- deposit and certificate reads while paused;
- `withdrawAtMaturity(depositId)`;
- `earlyWithdraw(depositId)`;
- `manualRenew(depositId, newPlanId)`;
- `autoRenew(depositId)`;
- exact maturity and grace-period boundary enforcement;
- direct current-owner authorization for owner-restricted actions;
- permissionless auto-renew execution;
- current-owner-safe renewed certificate minting;
- immutable old-deposit snapshot calculations;
- funded positive-interest compounding through `VaultManager`;
- zero-rounded-interest payout bypass;
- `Active` to `Withdrawn`, `ManualRenewed`, or `AutoRenewed` lifecycle transitions;
- atomic rollback of failed payout and safe-mint operations;
- ERC20 and ERC721 callback reentrancy protection across withdrawal and renewal flows;
- first-successful-terminal-action enforcement.

The exported project ABI is located at:

`data/abi/contracts/SavingCore.sol/SavingCore.json`

The current Phase 9 implementation intentionally does not include:

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

At the current locally validated Phase 9 state:

- Solidity `0.8.28`, optimizer with `1,000` runs, and `viaIR` compile successfully;
- focused permissionless auto-renew testing reports `17 passing`;
- focused SavingCore testing reports `161 passing`;
- the complete current suite reports `221 passing`;
- SavingCore deployed bytecode is approximately `11.021 KiB`;
- SavingCore initcode is approximately `12.266 KiB`;
- SavingCore coverage reports 100% statements, branches, functions, and lines;
- no SavingCore statement, branch, function, or line remains uncovered;
- the Phase 9 coverage run focused on `test/SavingCore.test.ts`;
- `artifacts/`, `cache/`, `typechain/`, `coverage/`, and `coverage.json` remain ignored;
- project-owned MockUSDC, VaultManager, and SavingCore ABIs are retained;
- generated test-mock ABIs are removed before staging.

## Project Structure

Current relevant structure:

    online-banking-capstone/
    ├── contracts/
    │   ├── mocks/
    │   │   ├── MockDepositReceiver.sol
    │   │   ├── MockReentrantToken.sol
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

**Phase 9 — Permissionless auto-renewal after the grace period**

Before Phase 9 may be declared complete:

1. update README, architecture, security, UI/UX, and design-decision documentation with the validated Phase 9 behavior;
2. confirm `autoRenew(depositId)` remains permissionless;
3. confirm eligibility begins exactly at
   `maturityAt + GRACE_PERIOD`;
4. confirm the current old-certificate owner receives the new NFT;
5. confirm the caller cannot choose or steal the recipient;
6. confirm old plan ID, tenor, APR, and penalty snapshots are preserved;
7. confirm current plan updates, disabling, and deposit limits are not reapplied;
8. confirm one delayed call creates exactly one new term;
9. confirm positive interest is fully funded and zero interest skips VaultManager;
10. confirm complete rollback for payout, authorization, pause, and safe-mint failures;
11. confirm ERC20 and ERC721 callback reentrancy protection;
12. confirm maturity withdrawal and auto-renew follow first-successful-terminal-action ordering;
13. confirm pending interest, reserved interest, C1, and C2 remain unimplemented;
14. run final clean compile, TypeScript, focused tests, full regression, coverage, and size checks;
15. run whitespace, generated-file, scope, secret, ABI, and unit audits;
16. confirm generated test-mock ABIs and coverage artifacts are absent;
17. stage only the approved Phase 9 files;
18. commit with the approved Phase 9 commit message;
19. push the commit to `origin/main`;
20. fetch the remote and confirm local and remote commits match;
21. confirm the working tree is clean;
22. produce the complete Phase 9 checkpoint;
23. stop and wait for explicit user approval.

After Phase 9 is fully committed, pushed, and approved, the next planned phase is:

**Phase 10 — Bonus C1 Principal-First Settlement**

Phase 10 must not begin automatically.