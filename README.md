# SafeBank — Online Banking System

SafeBank is a blockchain-based fixed-term savings system developed for the Blockchain Programming Capstone Project.

Users will deposit six-decimal MockUSDC into a smart contract, receive an ERC721 deposit certificate, and later withdraw, renew, or claim eligible interest according to the on-chain deposit state.

> SafeBank is an educational project. MockUSDC is a freely mintable test token with no real-world monetary value.

## Current Status

Current phase:

**Phase 1 — Architecture and design documentation completed**

Phase 1 deliverables:

- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/UI_UX_PLAN.md`
- `docs/DESIGN_DECISIONS.md`
- Phase 1 README update

Phase 1 validation completed:

- documentation structure checks;
- Personal Variant consistency checks;
- README link checks;
- implementation-claim checks;
- UTF-8 and Markdown checks;
- secret scans;
- TypeScript regression check;
- Hardhat compile regression check;
- Hardhat test regression check;
- empty-project coverage command check;
- staged-file and whitespace checks.

Important interpretation:

- no Solidity contract exists yet;
- no frontend exists yet;
- test result remains `0 passing`;
- the displayed empty coverage table is not meaningful contract coverage;
- Phase 2 must not begin without explicit user confirmation.

Phase 0 base commit:

- Commit: `2e46bb4`
- Message: `chore: initialize online banking capstone`
- Branch: `main`
- Remote: `origin/main`
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
- Initial architecture documentation
- Initial security-model documentation
- Initial UI/UX planning
- Initial design-decision records

Not implemented yet:

- `MockUSDC.sol`
- `VaultManager.sol`
- `SavingCore.sol`
- Saving-plan management
- Deposit opening
- ERC721 deposit certificates
- Maturity withdrawal
- Early withdrawal
- Manual renewal
- Auto-renewal
- Contract pause behavior
- Contract unit and security tests
- Real contract coverage
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

No banking feature should currently be treated as implemented.

## Planned Core Contracts

### MockUSDC

A six-decimal ERC20 test token used only for local and Sepolia demonstrations.

Planned characteristics:

- 6 decimals
- Public minting for testing
- No real monetary value
- Not intended for production

### VaultManager

The planned interest-liquidity contract.

Its responsibilities will include:

- holding bank-funded interest liquidity;
- funding and controlled withdrawal;
- fee receiver management;
- authorized interest payouts;
- pause and unpause;
- reserved-interest accounting after Bonus C2.

VaultManager must not hold user principal.

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

At the current Phase 1 checkpoint:

- compile is expected to report that there is nothing to compile;
- tests are expected to report zero passing tests;
- coverage is expected to be empty because no Solidity contracts exist.

The empty coverage report is not evidence of meaningful contract coverage.

## Project Structure

Current relevant structure:

    online-banking-capstone/
    ├── contracts/
    │   └── .gitkeep
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
    │   └── .gitkeep
    ├── .env.example
    ├── .gitignore
    ├── hardhat.config.ts
    ├── package.json
    ├── package-lock.json
    ├── README.md
    └── tsconfig.json

The `frontend/` directory has not been created.

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

**Phase 2 — MockUSDC contract and tests**

Phase 2 must not begin automatically.

Before moving to Phase 2:

1. commit the completed Phase 1 documentation;
2. push the commit to `origin/main`;
3. verify the local and remote commit;
4. verify that the working tree is clean;
5. produce the complete Phase 1 checkpoint;
6. wait for explicit user approval.
