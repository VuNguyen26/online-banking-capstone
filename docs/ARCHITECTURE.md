# SafeBank System Architecture

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank — Blockchain Term Deposit System |
| Document | Implemented System Architecture |
| Current documentation phase | Phase 19 — Final Documentation |
| Smart-contract model | Non-upgradeable |
| Local network | Hardhat and localhost, chain ID `31337` |
| Public network | Ethereum Sepolia, chain ID `11155111` |
| Test asset | MockUSDC with 6 decimals |
| Student ID | `3122560090` |
| Assistant model | Deterministic local rule engines; no external LLM |

This document describes the architecture that exists in the current repository.

It is grounded in:

- deployed contract source;
- automated tests;
- tracked local and Sepolia deployment records;
- React frontend source;
- deterministic assistant source.

Automated tests and Etherscan source verification do not constitute an independent professional security audit.

## 2. Personal Variant

The SafeBank Personal Variant is derived from student ID `3122560090`.

The final digits are:

- `A = 0`;
- `B = 9`.

| Parameter | Required value |
|---|---:|
| Grace period | `2 days` |
| Default APR | `200 bps = 2.00%` |
| Early-withdrawal penalty | `750 bps = 7.50%` |
| Default tenor | `180 days` |
| MockUSDC decimals | `6` |

The same values are used across:

- contracts;
- tests;
- local seed;
- Sepolia canonical plan;
- frontend calculations;
- documentation;
- demonstration data.

## 3. Scope Classification

SafeBank separates project scope into three categories.

### 3.1 Mandatory Capstone Scope

Implemented mandatory scope:

- `MockUSDC`;
- `VaultManager`;
- `SavingCore`;
- saving-plan administration;
- deposit opening;
- immutable term snapshots;
- ERC721 deposit certificates;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- permissionless auto-renew;
- pause controls;
- required events;
- contract tests;
- test coverage above 90%;
- React demonstration frontend;
- seven Design Answers.

### 3.2 Bonus Scope

Implemented bonus scope:

- C1 — Principal-First Settlement;
- C2 — Solvency Guard.

### 3.3 Product Extensions

Implemented extension scope:

- User Banking App;
- Admin Portal;
- bilingual interface;
- responsive transaction UX;
- loading, empty, error, and confirmation states;
- deterministic Banking Assistant;
- deterministic Risk Assistant;
- Spline robot assistant launcher;
- deterministic local deployment;
- guarded Sepolia deployment and verification.

Product extensions do not override Solidity authorization or contract state.

## 4. Architectural Principles

SafeBank follows these primary principles.

### 4.1 Principal and Interest Separation

`SavingCore` holds depositor principal.

`VaultManager` holds bank-funded interest liquidity.

Interest is never paid using another depositor's principal.

### 4.2 Contract State Is Authoritative

Current contract storage and confirmed transaction receipts are authoritative.

The following are not authoritative security boundaries:

- frontend route or view selection;
- cached frontend values;
- assistant output;
- RPC display data;
- event history without current-state reconciliation.

### 4.3 One Successful Terminal Transition

An active deposit may complete through exactly one terminal action.

After the first successful transition, all conflicting later actions revert.

### 4.4 Current NFT Ownership Defines Active Economic Rights

For owner-restricted active-deposit actions, the current direct ERC721 owner controls the deposit.

The original depositor does not retain economic authority after transferring the certificate.

### 4.5 Positive-Interest Renewal Must Be Fully Backed

A renewal cannot create synthetic principal.

Positive old-term interest must move from `VaultManager` into `SavingCore` before the renewed deposit may remain committed.

### 4.6 Off-Chain Components Are Optional for Contract Safety

A frontend, RPC provider, bot, or assistant may become unavailable without changing deposit ownership or bypassing contract rules.

## 5. System Context

~~~mermaid
flowchart LR
    Depositor[Depositor or NFT Owner]
    Admin[Bank Administrator]
    Keeper[Permissionless Keeper]
    Wallet[Browser Wallet]
    Frontend[React Frontend]
    BankingAI[Banking Assistant]
    RiskAI[Risk Assistant]

    Token[MockUSDC]
    Core[SavingCore]
    Vault[VaultManager]
    NFT[ERC721 Deposit Certificate]

    Wallet --> Frontend
    Frontend --> Depositor
    Frontend --> Admin

    Frontend -. verified user context .-> BankingAI
    Frontend -. verified admin context .-> RiskAI

    Depositor -->|approve and open deposit| Core
    Depositor -->|withdraw or manually renew| Core
    Keeper -->|trigger auto-renew| Core
    Admin -->|manage plans and pause| Core
    Admin -->|fund, withdraw, configure, pause| Vault

    Core -->|principal transfer| Token
    Core -->|mint certificate| NFT
    Core -->|interest request| Vault
    Vault -->|bank-funded interest| Token
~~~

The diagram shows responsibilities, not token-contract implementation internals.

## 6. On-Chain Components

## 6.1 MockUSDC

`MockUSDC` is a test-only ERC20 token.

Implemented properties:

- name `Mock USD Coin`;
- symbol `mUSDC`;
- 6 decimals;
- permissionless public minting;
- standard ERC20 transfer and approval behavior;
- no owner-controlled monetary policy;
- no backing or redemption;
- no production stablecoin guarantees.

The token exists solely for local and Sepolia demonstration.

## 6.2 SavingCore

`SavingCore` is the central deposit and liability contract.

Implemented responsibilities:

- hold principal;
- create and manage saving plans;
- validate plan bounds;
- open deposits;
- snapshot financial terms;
- mint ERC721 certificates;
- process maturity withdrawal;
- process early withdrawal;
- process manual renewal;
- process permissionless auto-renew;
- record C1 pending interest;
- enforce claimant-only pending claims;
- maintain C2 aggregate interest liabilities;
- emit lifecycle and reserve events.

Implemented OpenZeppelin foundations:

- `ERC721`;
- `Ownable2Step`;
- `Pausable`;
- `ReentrancyGuard`;
- `SafeERC20`.

The contract is non-upgradeable.

## 6.3 VaultManager

`VaultManager` is the interest-liquidity and vault-solvency contract.

Implemented responsibilities:

- hold bank-funded MockUSDC;
- allow owner funding;
- allow owner withdrawals within available liquidity;
- configure the fee receiver;
- authorize SavingCore once;
- pay interest only when called by the authorized SavingCore;
- expose actual vault balance;
- read aggregate reserve from SavingCore;
- calculate available liquidity;
- calculate funding shortfall;
- independently pause payouts and owner withdrawals.

Implemented OpenZeppelin foundations:

- `Ownable2Step`;
- `Pausable`;
- `ReentrancyGuard`;
- `SafeERC20`.

`VaultManager` never holds deposit principal.

## 6.4 ERC721 Deposit Certificate

`SavingCore` issues ERC721 certificates with:

- collection name `SafeBank Deposit Certificate`;
- symbol `SBDC`;
- one NFT per deposit;
- `tokenId == depositId`;
- safe minting;
- transferable ownership;
- retained historical certificates.

The project uses base OpenZeppelin `ERC721`, not `ERC721Enumerable`.

Owned-deposit discovery is performed off-chain and reconciled against current `ownerOf` values.

Rich NFT metadata and a custom `tokenURI` are not implemented.

## 7. Contract Relationships

~~~mermaid
flowchart TD
    User[User]
    Admin[Administrator]
    Keeper[Keeper]

    Token[MockUSDC]
    Core[SavingCore]
    Vault[VaultManager]

    User -->|approve| Token
    User -->|openDeposit| Core
    User -->|withdraw or manualRenew| Core
    Keeper -->|autoRenew| Core

    Admin -->|plan and pause actions| Core
    Admin -->|fund, withdraw, fee receiver, pause| Vault

    Core -->|safeTransferFrom principal| Token
    Core -->|safeTransfer principal or penalty| Token
    Core -->|payInterest request| Vault
    Vault -->|safeTransfer interest| Token

    Vault -. totalReservedInterest read .-> Core
~~~

Critical configuration:

- `SavingCore` stores immutable MockUSDC and VaultManager references;
- `VaultManager` stores immutable MockUSDC reference;
- `VaultManager` authorizes one SavingCore address;
- SavingCore authorization cannot be replaced in the current architecture.

## 8. Saving Plan Architecture

Each saving plan stores:

| Field | Purpose |
|---|---|
| `tenorDays` | Length of one term |
| `aprBps` | Annual interest in basis points |
| `minDeposit` | Optional minimum amount |
| `maxDeposit` | Optional maximum amount |
| `earlyWithdrawPenaltyBps` | Early-withdrawal penalty |
| `enabled` | New-use availability |

Plan IDs begin at `1`.

Validation bounds:

- tenor: 1 to 3,650 days;
- APR: 1 to 10,000 bps;
- penalty: 0 to 10,000 bps;
- deposit amount: greater than zero;
- min cannot exceed max when both are nonzero.

After creation:

- APR may change;
- enabled state may change;
- tenor remains immutable;
- deposit limits remain immutable;
- penalty remains immutable.

New products with different immutable terms require a new plan.

## 9. Deposit Data Model

Each deposit stores:

| Field | Purpose |
|---|---|
| `planId` | Source plan identity |
| `principal` | Token amount represented by the certificate |
| `startedAt` | Term start timestamp |
| `maturityAt` | Term maturity timestamp |
| `tenorDays` | Snapshotted tenor |
| `aprBpsAtOpen` | Snapshotted APR |
| `penaltyBpsAtOpen` | Snapshotted early-withdrawal penalty |
| `status` | Current lifecycle state |

Deposit IDs begin at `1`.

The associated NFT ID equals the deposit ID.

Plan changes after opening do not modify an existing deposit's snapshots.

## 10. Deposit State Machine

~~~mermaid
stateDiagram-v2
    [*] --> Active: openDeposit

    Active --> Withdrawn: withdrawAtMaturity
    Active --> Withdrawn: earlyWithdraw
    Active --> ManualRenewed: manualRenew
    Active --> AutoRenewed: autoRenew

    Withdrawn --> [*]
    ManualRenewed --> [*]
    AutoRenewed --> [*]
~~~

Terminal old deposits never return to `Active`.

Renewal creates a separate new active deposit.

Every terminal function verifies the old deposit is still `Active`.

## 11. Deposit Opening Architecture

The implemented opening flow is:

1. verify SavingCore is not paused;
2. verify the plan exists;
3. verify the plan is enabled;
4. validate amount against plan limits;
5. transfer principal into SavingCore;
6. snapshot plan ID, tenor, APR, and penalty;
7. calculate start and maturity timestamps;
8. allocate the next deposit ID;
9. store an active deposit;
10. reserve positive expected interest;
11. safely mint the matching ERC721 certificate;
12. emit `DepositOpened`.

A failed transfer, reservation path, or NFT safe mint reverts the complete transaction.

## 12. Ownership Architecture

Owner-restricted actions resolve:

~~~solidity
address currentOwner = ownerOf(depositId);
~~~

The contract then compares the caller directly with `currentOwner`.

This applies to:

- maturity withdrawal;
- early withdrawal;
- manual renewal.

ERC721 approval does not grant direct deposit-operation authority.

Certificate transfer therefore transfers:

- remaining principal rights;
- maturity interest rights;
- early-withdrawal authority;
- maturity-withdrawal authority;
- manual-renewal authority.

Auto-renew is permissionless, but the new NFT is minted to the current owner of the old certificate.

## 13. Financial Architecture

## 13.1 Interest

One-term simple interest is:

~~~text
interest =
    principal × aprBps × tenorSeconds
    ÷ (365 days × 10,000)
~~~

The implementation uses `Math.mulDiv`.

Consequences:

- multiplication occurs before final division;
- integer result rounds down;
- no compensating token mint occurs;
- rounding dust remains in VaultManager;
- zero-rounded interest skips the vault payout call.

## 13.2 Early-Withdrawal Penalty

~~~text
penalty =
    principal × penaltyBpsAtOpen ÷ 10,000
~~~

~~~text
userReceive =
    principal - penalty
~~~

The current configured fee receiver receives the penalty.

The fee-receiver address is not snapshotted in the deposit.

## 13.3 Renewal Compounding

~~~text
newPrincipal =
    oldPrincipal + oldTermInterest
~~~

For positive old-term interest:

- VaultManager transfers the interest to SavingCore;
- SavingCore's token balance increases;
- VaultManager's token balance decreases;
- the user wallet balance does not change;
- total MockUSDC supply does not change.

A failed positive-interest payout reverts the renewal.

## 14. Exact Timestamp Architecture

## 14.1 Before Maturity

~~~text
block.timestamp < maturityAt
~~~

Early withdrawal is valid.

Maturity withdrawal and manual renewal are invalid.

## 14.2 Exact Maturity

~~~text
block.timestamp == maturityAt
~~~

The deposit is mature.

Therefore:

- early withdrawal is invalid;
- maturity withdrawal is valid;
- manual renewal is valid.

## 14.3 Manual-Renewal Window

~~~text
maturityAt <= block.timestamp < maturityAt + GRACE_PERIOD
~~~

The direct current owner may:

- withdraw at maturity;
- manually renew.

## 14.4 Exact Grace End

~~~text
block.timestamp == maturityAt + GRACE_PERIOD
~~~

At this exact timestamp:

- manual renewal is invalid;
- auto-renew is valid;
- maturity withdrawal remains valid while the deposit remains active.

## 14.5 After Grace

While the deposit remains `Active`:

- the current owner may withdraw at maturity;
- any address may trigger auto-renew.

The first successfully mined transaction wins.

## 15. Maturity Withdrawal Architecture

The implemented maturity flow:

1. verify deposit existence;
2. verify status `Active`;
3. resolve current NFT owner;
4. require direct current-owner caller;
5. require `block.timestamp >= maturityAt`;
6. calculate snapshotted interest;
7. mark the deposit `Withdrawn`;
8. transfer principal from SavingCore;
9. consume the interest reserve;
10. request full interest from VaultManager;
11. either record successful payment or activate the exact C1 fallback;
12. emit `Withdrawn`.

The old NFT remains historical.

## 16. Bonus C1 Architecture

## 16.1 Problem

The base revert-on-underfunding design can indirectly lock principal even though principal remains fully held by SavingCore.

## 16.2 Implemented Solution

SafeBank uses principal-first settlement.

Only this exact VaultManager failure activates deferral:

~~~text
InsufficientVaultBalance
~~~

On that failure:

- principal remains returned;
- deposit remains terminal;
- the full interest amount is recorded;
- no partial interest is paid;
- the settlement owner becomes the fixed claimant;
- an `InterestDeferred` event is emitted.

Storage:

~~~text
pendingInterest[depositId]
interestClaimant[depositId]
~~~

Non-liquidity failures are rethrown and revert the complete transaction.

## 16.3 Claim Flow

`claimPendingInterest`:

1. verifies deposit existence;
2. requires a positive pending amount;
3. requires the snapshotted claimant;
4. clears pending state;
5. consumes the matching reserve;
6. calls VaultManager;
7. emits `PendingInterestClaimed`.

If the external payout fails, EVM rollback restores both pending debt and reserve.

## 17. Bonus C2 Architecture

## 17.1 Liability Source of Truth

`SavingCore.totalReservedInterest` records aggregate interest liabilities.

It includes:

- positive expected interest for active deposits;
- unpaid C1 pending interest.

## 17.2 Reserve Lifecycle

| Action | Reserve transition |
|---|---|
| Open deposit | Add expected positive interest |
| Early withdrawal | Release unused expected interest |
| Funded maturity | Consume paid interest |
| C1 deferral | Preserve unpaid interest |
| Successful pending claim | Consume paid pending interest |
| Manual renewal | Replace old reserve with new selected-plan reserve |
| Auto-renew | Replace old reserve with new snapshot-based reserve |

All transitions are atomic with the lifecycle action.

## 17.3 Vault Solvency Reads

~~~text
availableLiquidity =
    max(vaultBalance - totalReservedInterest, 0)
~~~

~~~text
fundingShortfall =
    max(totalReservedInterest - vaultBalance, 0)
~~~

Vault withdrawal is restricted to available liquidity.

## 17.4 Undercollateralized Opening

A deposit may open while the vault balance is below aggregate reserve.

Consequences:

- principal remains separated;
- liabilities remain visible;
- available liquidity becomes zero;
- funding shortfall becomes positive;
- administrator withdrawal cannot worsen the shortfall;
- C1 remains available at maturity.

C2 is a visibility and containment mechanism, not a guarantee of immediate funding.

## 18. Early Withdrawal Architecture

The implemented early-withdrawal flow:

1. verify deposit exists;
2. verify status `Active`;
3. resolve direct current owner;
4. require owner caller;
5. require `block.timestamp < maturityAt`;
6. calculate snapshotted penalty;
7. calculate user receipt;
8. calculate and release expected-interest reserve;
9. mark deposit `Withdrawn`;
10. transfer nonzero user amount;
11. transfer nonzero penalty;
12. emit `Withdrawn` with zero interest and `isEarly = true`.

VaultManager pause alone does not block early withdrawal because no interest payout is requested.

## 19. Manual Renewal Architecture

Manual renewal requires:

- active old deposit;
- direct current NFT owner;
- maturity reached;
- timestamp before exact grace end;
- existing enabled target plan;
- compounded principal within target limits;
- complete positive-interest funding.

The new deposit uses:

- selected new plan ID;
- selected plan tenor;
- selected plan APR;
- selected plan penalty;
- renewal transaction timestamp;
- new calculated maturity.

The old certificate remains historical.

A new certificate is safely minted to the current owner.

## 20. Permissionless Auto-Renew Architecture

Auto-renew requires:

- active old deposit;
- timestamp at or after exact grace end;
- unpaused SavingCore.

It does not require:

- NFT ownership;
- ERC721 approval;
- administrator role;
- a specific bot account.

The new deposit preserves:

- old plan ID;
- old tenor snapshot;
- old APR snapshot;
- old penalty snapshot.

It ignores current plan:

- enabled state;
- APR;
- minimum;
- maximum.

Delayed execution creates one new term only.

The new term begins at the actual execution timestamp.

## 21. Pause Architecture

SavingCore and VaultManager have independent pause states.

### 21.1 SavingCore Pause

SavingCore pause blocks:

- opening deposits;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claims.

### 21.2 VaultManager Pause

VaultManager pause blocks:

- interest payouts;
- owner withdrawals.

Vault funding remains available for liquidity restoration.

### 21.3 Mixed Pause States

Mixed states are possible.

The frontend displays both states separately.

A global operational pause requires both contracts to be paused.

## 22. Administrative Architecture

SavingCore owner controls:

- plan creation;
- APR updates;
- plan enablement;
- plan disablement;
- SavingCore pause state;
- SavingCore ownership transfer.

VaultManager owner controls:

- vault funding;
- available-liquidity withdrawal;
- fee-receiver updates;
- VaultManager pause state;
- VaultManager ownership transfer;
- one-time SavingCore authorization.

Both contracts use `Ownable2Step`.

Active deposits cannot be directly edited by the administrator.

## 23. Event Architecture

Required Capstone events:

- `PlanCreated`;
- `PlanUpdated`;
- `DepositOpened`;
- `Withdrawn`;
- `Renewed`.

Additional implemented events:

- `PlanEnabled`;
- `PlanDisabled`;
- `VaultFunded`;
- `VaultWithdrawn`;
- `FeeReceiverUpdated`;
- `SavingCoreAuthorized`;
- `InterestPaid`;
- `InterestDeferred`;
- `PendingInterestClaimed`;
- `InterestReserved`;
- `ReservedInterestReleased`;
- `ReservedInterestConsumed`;
- inherited ownership events;
- inherited pause events;
- ERC20 and ERC721 transfer events.

Events support monitoring and history.

Current contract storage remains authoritative for present state.

## 24. Frontend Architecture

## 24.1 Application Shell

The frontend is one React application.

`App.tsx` maintains:

~~~text
ApplicationView = user | admin
~~~

It renders either:

- `UserDashboard`;
- `AdminDashboard`.

Both use `ApplicationShell`.

There is no React Router.

## 24.2 Provider Model

Public reads:

~~~text
JsonRpcProvider
    → read-only contracts
    → dashboard data providers
~~~

Wallet writes:

~~~text
window.ethereum
    → BrowserProvider
    → connected signer
    → signer-connected contracts
~~~

Before returning a signer, the wallet provider verifies:

- injected wallet availability;
- connected account;
- Sepolia chain.

## 24.3 User Data Layer

The User Banking App reads:

- protocol constants;
- plan state;
- deposit state;
- certificate ownership;
- token balance and allowance;
- pending interest;
- claimant;
- vault solvency metrics;
- latest block timestamp.

## 24.4 Admin Data Layer

The Admin Portal reads:

- owners and pending owners;
- independent pause states;
- fee receiver;
- contract relationships;
- plans;
- deposit count;
- vault solvency metrics.

`AdminDataProvider` is mounted only while the admin view is active.

## 24.5 Transaction Layer

State-changing components obtain a signer only when preparing a user-approved transaction.

The shared transaction hook tracks:

- wallet confirmation;
- submission;
- confirmation;
- success;
- failure.

After success, data providers refresh contract state.

## 24.6 UI State Model

The frontend explicitly represents:

- loading;
- ready;
- empty;
- error;
- retry;
- disabled;
- paused;
- underfunded;
- wallet disconnected;
- wrong network;
- transaction pending;
- transaction success;
- transaction failure.

## 25. Assistant Architecture

## 25.1 Banking Assistant

The Banking Assistant receives serializable User Banking App context.

It explains:

- plans;
- APR and tenor;
- maturity;
- early-withdrawal penalty;
- renewal;
- pending interest;
- claimant rules;
- funding shortfall.

## 25.2 Risk Assistant

The Risk Assistant receives serializable Admin Portal context.

It explains:

- vault balance;
- aggregate reserve;
- available liquidity;
- funding shortfall;
- pause states;
- ownership;
- contract relationships;
- plan configuration.

## 25.3 Input Safety

Assistant questions:

- have control characters replaced;
- have whitespace normalized;
- must not be empty;
- must not exceed 500 characters;
- must not contain external HTTP or HTTPS URLs.

## 25.4 Output Model

Every answer contains:

1. fact;
2. explanation;
3. caution;
4. next step.

Answers are rendered as ordinary React text.

## 25.5 Authorization Boundary

The assistants do not:

- connect a wallet;
- request a signer;
- import transaction clients;
- call an external LLM;
- sign transactions;
- submit transactions;
- modify contract state.

The Spline iframe is a visual launcher only.

## 26. Deployment Architecture

## 26.1 Local Deployment

Local workflows enforce chain ID `31337`.

Deployment order:

1. MockUSDC;
2. VaultManager;
3. SavingCore;
4. one-time authorization;
5. deterministic seed.

Local seed targets:

- canonical plan ID `1`;
- user balances `5,000` and `10,000` mUSDC;
- vault balance `25,000` mUSDC;
- no default deposits.

Persistent localhost deployment is idempotent.

## 26.2 Sepolia Deployment

Tracked public deployment:

| Contract | Address |
|---|---|
| MockUSDC | `0xcf779EC5D80573D3254054a17c5B4f0117491662` |
| VaultManager | `0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7` |
| SavingCore | `0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443` |

Public deployment properties:

- chain ID `11155111`;
- two-confirmation policy;
- one canonical plan;
- no default public deposits;
- no default vault funding;
- no default demo balances;
- all three sources verified on Etherscan.

Tracked public metadata is stored in:

- `deployments/sepolia/`;
- `data/deployments/sepolia.json`.

## 27. Testing Architecture

Contract suites:

- `MockUSDC.test.ts`;
- `VaultManager.test.ts`;
- `SavingCore.test.ts`;
- `Deployment.test.ts`.

Validated contract checkpoint:

- 258 passing tests;
- production statements: 100%;
- production branches: 98.40%;
- production functions: 100%;
- production lines: 100%.

Frontend tests cover:

- wallet behavior;
- public reads;
- transaction flows;
- user actions;
- administrator actions;
- loading, error, and empty states;
- confirmations;
- bilingual behavior;
- deterministic assistants;
- assistant safety;
- cancellation and stale responses.

Validated frontend checkpoint:

- 65 passing test files;
- 256 passing tests;
- successful lint;
- successful typecheck;
- successful production build.

## 28. Core Invariants

The implemented architecture preserves these invariants.

### 28.1 Custody

- active principal remains in SavingCore;
- interest liquidity remains in VaultManager;
- vault administration cannot directly withdraw principal.

### 28.2 Ownership

- owner-restricted active actions use current direct NFT ownership;
- auto-renew caller does not receive ownership;
- pending claimant remains fixed after settlement.

### 28.3 Lifecycle

- only active deposits may transition;
- one old deposit reaches one terminal state;
- renewal creates a new deposit;
- historical NFTs cannot reactivate terminal deposits.

### 28.4 Accounting

- interest uses immutable snapshots;
- penalty uses immutable snapshot;
- positive renewal interest must be funded;
- reserve changes match lifecycle changes;
- failed transactions restore state atomically.

### 28.5 Authorization

- only owners execute administrator functions;
- only authorized SavingCore requests vault interest;
- frontend checks do not replace Solidity checks;
- assistants have no write authority.

## 29. Known Architectural Limitations

- MockUSDC is not production money.
- The administrator model is centralized.
- Contracts are non-upgradeable.
- Vault underfunding remains possible.
- C1 may defer interest indefinitely until funding arrives.
- C2 does not guarantee full collateralization.
- Transaction ordering may decide withdrawal versus auto-renew after grace.
- The project assumes conventional MockUSDC-like ERC20 behavior.
- Rich NFT metadata is not implemented.
- The Spline launcher depends on an external host.
- The application targets Sepolia.
- No independent professional audit has been completed.

## 30. Architecture Summary

SafeBank separates principal custody, interest liquidity, ownership rights, liability accounting, frontend transaction preparation, and assistant explanation into explicit boundaries.

The resulting system provides:

- deterministic deposit lifecycle rules;
- transferable ERC721 economic rights;
- principal-first underfunding behavior;
- transparent interest liabilities;
- bounded administrator withdrawals;
- permissionless auto-renew liveness;
- user-confirmed frontend writes;
- read-only deterministic assistants.

On-chain contract state remains the final source of truth.