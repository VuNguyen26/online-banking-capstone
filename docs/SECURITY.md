# SafeBank Security Model

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank — Blockchain Term Deposit System |
| Document | Implemented Security Model and Threat Analysis |
| Current documentation phase | Phase 19 — Final Documentation |
| Security approach | Defense-in-depth and explicit residual-risk disclosure |
| Smart-contract model | Non-upgradeable |
| Public network | Ethereum Sepolia, chain ID `11155111` |
| Local network | Hardhat and localhost, chain ID `31337` |
| Test asset | MockUSDC with 6 decimals |
| Student ID | `3122560090` |
| Assistant model | Deterministic local rule engines with no external LLM |

This document describes the controls implemented in the current repository.

Security evidence includes:

- Solidity source;
- contract tests;
- frontend tests;
- tracked deployment records;
- Etherscan source verification;
- locally observed validation results.

Passing tests and Etherscan verification reduce identified risk. They do not constitute an independent professional audit, formal verification, or production-readiness guarantee.

## 2. Personal Variant Security Baseline

The implementation must remain consistent with student ID `3122560090`.

Required values:

| Parameter | Value |
|---|---:|
| Grace period | `2 days` |
| Default APR | `200 bps = 2.00%` |
| Early-withdrawal penalty | `750 bps = 7.50%` |
| Default tenor | `180 days` |
| MockUSDC decimals | `6` |

Security implications:

- timestamp tests use the exact two-day grace period;
- default-plan tests use 200 bps APR and 180 days;
- early-withdrawal tests use the 750 bps penalty;
- all MockUSDC arithmetic uses six-decimal units;
- scripts and tests use `parseUnits(value, 6)`;
- `parseEther` is not used for MockUSDC values.

## 3. Security Philosophy

SafeBank applies defense-in-depth.

The project does not rely on one modifier, one administrator check, one frontend condition, one test, or one library.

Implemented layers include:

- separation of principal and interest custody;
- explicit ownership boundaries;
- `Ownable2Step`;
- one-time SavingCore authorization;
- `Pausable`;
- `ReentrancyGuard`;
- `SafeERC20`;
- safe ERC721 minting;
- checks-effects-interactions;
- active-only state transitions;
- immutable financial snapshots;
- exact timestamp boundaries;
- principal-first settlement;
- reserved-interest accounting;
- administrator-withdrawal containment;
- wallet and network validation;
- explicit transaction confirmations;
- deterministic assistant boundaries;
- extensive unit and integration tests;
- deployment chain guards;
- secret-management discipline.

The correct security language is:

- SafeBank reduces identified risks;
- SafeBank enforces explicit invariants;
- SafeBank limits the blast radius of failures;
- SafeBank validates critical transitions;
- SafeBank exposes known liabilities and limitations.

The project must not claim that the contracts are impossible to exploit.

## 4. Security Scope

### 4.1 Mandatory Contract Security

Implemented mandatory controls include:

- administrator access control;
- pause and unpause;
- principal and interest separation;
- owner validation;
- immutable APR and penalty snapshots;
- lifecycle-state validation;
- interest payment through VaultManager;
- required events;
- arithmetic and boundary tests;
- test coverage above 90%.

### 4.2 SafeBank Security Decisions

SafeBank additionally implements:

- current NFT owner controls active economic rights;
- completed NFTs remain historical but non-actionable;
- exact maturity and grace boundaries;
- maturity withdrawal remains available after grace while still active;
- auto-renew is permissionless but ownership-safe;
- floor rounding keeps dust in VaultManager;
- contracts are non-upgradeable;
- frontend authorization is UX only;
- assistants are read-only and advisory.

### 4.3 Bonus Security

Implemented bonuses:

- C1 — Principal-First Settlement;
- C2 — Solvency Guard.

C1 protects principal recovery during interest-liquidity shortfall.

C2 records interest liabilities and prevents administrator withdrawal from consuming reserved liquidity.

### 4.4 Product Security

Implemented product controls include:

- browser-wallet isolation;
- Sepolia chain validation;
- tracked contract-address configuration;
- exact-amount approval;
- transaction-state handling;
- explicit confirmations;
- NFT-transfer warnings;
- test-token warnings;
- independent contract pause display;
- assistant input validation;
- no autonomous financial execution.

## 5. Security Objectives

SafeBank has the following objectives.

### 5.1 Protect User Principal

User principal must remain in `SavingCore` until a valid withdrawal or renewal transition occurs.

Principal from one depositor must not pay another depositor's interest.

### 5.2 Protect Interest Liquidity

Vault liquidity must leave only through:

- an authorized interest payout;
- an owner withdrawal within available liquidity.

### 5.3 Enforce Current Ownership

Owner-restricted active-deposit actions must use the direct current result of:

~~~solidity
ownerOf(depositId)
~~~

The original depositor must lose those rights after transferring the NFT.

### 5.4 Prevent Double Processing

A deposit must not be:

- withdrawn twice;
- renewed twice;
- withdrawn after renewal;
- renewed after withdrawal;
- completed through two successful terminal paths.

### 5.5 Preserve Financial Correctness

The system must preserve:

- six-decimal accounting;
- APR snapshots;
- tenor snapshots;
- penalty snapshots;
- multiplication before division;
- deterministic floor rounding;
- exact principal and penalty conservation;
- funded positive-interest renewal;
- reserve-accounting invariants.

### 5.6 Contain Administrative Power

Administrator powers must be:

- explicit;
- contract-enforced;
- event-visible;
- limited by custody boundaries;
- limited by C2 available liquidity.

### 5.7 Preserve Operational Resilience

Failure of a:

- bot;
- frontend;
- assistant;
- RPC endpoint;
- browser session;
- Spline visual asset

must not transfer ownership or bypass contract rules.

### 5.8 Protect Secrets

Private keys, seed phrases, and API credentials must not be committed to Git or included in the frontend bundle.

## 6. Assets to Protect

### 6.1 User Principal

Principal is held by `SavingCore`.

Risks include:

- unauthorized transfer;
- double withdrawal;
- invalid renewal;
- accounting mismatch;
- reentrancy;
- use as bank-funded interest.

### 6.2 Vault Interest Liquidity

VaultManager holds bank-funded interest.

Risks include:

- unauthorized payout;
- excessive administrator withdrawal;
- wrong SavingCore authorization;
- callback reentrancy;
- reserve-accounting mismatch.

### 6.3 Pending Interest

C1 pending interest is an explicit liability.

It must be protected against:

- wrong claimant;
- claimant replacement;
- double claim;
- debt erasure after failed payout;
- transfer of a historical NFT after settlement.

### 6.4 Reserved Interest

`SavingCore.totalReservedInterest` represents:

- expected positive interest for active deposits;
- unpaid C1 pending interest.

Risks include:

- missing reservation;
- duplicate reservation;
- duplicate release;
- duplicate consumption;
- reserve underflow;
- failed-transaction residue.

### 6.5 NFT Ownership

NFT ownership controls active economic rights.

Risks include:

- checking original depositor instead of current owner;
- minting renewed NFT to the auto-renew caller;
- stale frontend ownership;
- user misunderstanding of transfer consequence.

### 6.6 Deposit State

Deposit status prevents repeated processing.

Risks include:

- terminal action executed twice;
- partial state change;
- old deposit returned to `Active`;
- optimistic frontend state treated as final.

### 6.7 Plan Configuration

Plan configuration affects future deposits and manual renewal selection.

Existing deposit snapshots must not change after administrator updates.

### 6.8 Administrative Ownership

A compromised owner may attempt to:

- create abusive plans;
- change future APR;
- disable plans;
- redirect penalties;
- pause operations;
- withdraw available vault liquidity.

### 6.9 Deployment Configuration

Critical values include:

- network chain ID;
- MockUSDC address;
- SavingCore address;
- VaultManager address;
- fee receiver;
- authorized SavingCore relationship;
- frontend ABI and deployment metadata.

## 7. Actors and Trust Model

### 7.1 Depositor or NFT Owner

Trust level: untrusted.

The contract assumes the caller may submit:

- invalid IDs;
- invalid amounts;
- repeated actions;
- premature actions;
- insufficient balances;
- insufficient allowances;
- adversarial call ordering.

### 7.2 Bank Administrator

Trust level: privileged but fallible.

The implementation assumes the administrator may:

- make mistakes;
- lose a key;
- use the wrong network;
- be compromised;
- act maliciously within available permissions.

### 7.3 SavingCore

SavingCore is the only contract authorized to request vault interest.

It is also the source of aggregate reserved-interest accounting.

### 7.4 VaultManager

VaultManager holds interest liquidity but has no authority over principal held in SavingCore.

### 7.5 Auto-Renew Caller

Trust level: fully untrusted.

Any address may trigger auto-renew, but cannot select:

- recipient;
- principal;
- APR;
- tenor;
- penalty;
- plan ID;
- token payout.

### 7.6 Frontend

Trust level: untrusted as a security boundary.

The frontend can prepare and explain transactions but cannot replace Solidity validation.

### 7.7 Deterministic Assistant

Trust level: advisory only.

The assistants have:

- no wallet connection;
- no signer;
- no transaction clients;
- no external AI provider;
- no contract-write authority.

### 7.8 RPC Provider

Trust level: potentially stale or unavailable.

RPC data supports display and transaction preparation, but network consensus and contract execution determine final state.

## 8. Trust Assumptions

The current model assumes:

- OpenZeppelin libraries behave according to their implementation;
- Solidity 0.8.x checked arithmetic applies;
- Ethereum transaction atomicity applies;
- block timestamps have limited validator influence;
- MockUSDC behaves as the implemented conventional ERC20 test token;
- browser wallets independently control signing;
- users may misunderstand NFT economic rights;
- auto-renew requires a real transaction;
- RPC data may be stale;
- administrator ownership remains centralized;
- MockUSDC has no real financial value.

Changing token type, ownership model, network, or deployment model requires a new security review.

## 9. Trust Boundaries

### 9.1 Wallet to Frontend

The frontend may request account access and transaction signatures.

It must never request or store:

- private keys;
- seed phrases;
- raw signing credentials.

### 9.2 Frontend to Contracts

All frontend inputs are untrusted.

Contracts revalidate:

- amount;
- address;
- plan ID;
- deposit ID;
- ownership;
- status;
- timestamp;
- pause state;
- authorization.

### 9.3 User to SavingCore

Every public financial function is an attack surface.

No user-provided value is trusted without contract validation.

### 9.4 SavingCore to VaultManager

VaultManager verifies the caller through `onlySavingCore`.

SavingCore does not consider interest paid unless the VaultManager call succeeds.

### 9.5 Contracts to MockUSDC

ERC20 transfers are external interactions.

SafeBank uses `SafeERC20` and atomic rollback.

### 9.6 Contract to ERC721 Receiver

Safe minting may invoke an external receiver callback.

The minting flows are protected by `nonReentrant`, and a receiver rejection reverts the complete transaction.

### 9.7 Administrator to Contracts

Admin UI visibility is not authorization.

Every privileged action is enforced in Solidity.

### 9.8 Assistant to Application

Assistant output is untrusted advisory text.

It cannot become a transaction or authorization source.

### 9.9 Repository to Deployment

Tracked source and local secrets are separate.

Deployment scripts use local environment configuration without committing credentials.

## 10. Core Security Invariants

### 10.1 Principal Separation

Active principal remains in SavingCore.

VaultManager cannot withdraw or spend it.

### 10.2 Interest Separation

Interest is paid from VaultManager.

### 10.3 Active-Only Processing

Only a deposit with status `Active` may enter a terminal transition.

### 10.4 One Terminal Transition

The first successful terminal action changes the status.

Later conflicting actions revert.

### 10.5 Current-Owner Authorization

Owner-restricted actions compare the caller directly with `ownerOf(depositId)`.

### 10.6 Snapshot Integrity

Existing deposit APR, tenor, and penalty values are immutable.

### 10.7 Funded Renewal

Positive old-term interest must be physically transferred into SavingCore before a renewed deposit may remain committed.

### 10.8 Auto-Renew Ownership Safety

The auto-renew caller never becomes the renewed NFT recipient solely by triggering the transaction.

### 10.9 Exact Boundary Behavior

At exact maturity:

- early withdrawal is invalid;
- maturity withdrawal is valid;
- manual renewal begins.

At exact grace end:

- manual renewal is invalid;
- auto-renew is valid.

### 10.10 Pending-Interest Integrity

C1 principal settlement occurs once.

Pending interest is recorded once and claimed once.

### 10.11 Reserve Integrity

Every interest liability is:

- reserved once;
- released once;
- consumed once;
- or preserved while unpaid.

### 10.12 Atomic Rollback

A failed required external interaction leaves no partial successful state.

## 11. Access Control

Both privileged contracts use `Ownable2Step`.

### 11.1 SavingCore Owner Functions

Owner-only functions include:

- plan creation;
- APR update;
- plan enable;
- plan disable;
- pause;
- unpause;
- ownership transfer initiation.

### 11.2 VaultManager Owner Functions

Owner-only functions include:

- vault funding;
- vault withdrawal;
- fee-receiver update;
- pause;
- unpause;
- one-time SavingCore authorization;
- ownership transfer initiation.

### 11.3 One-Time SavingCore Authorization

VaultManager authorization:

- rejects zero address;
- validates the configured dependency;
- is owner-only;
- emits `SavingCoreAuthorized`;
- cannot be replaced after successful configuration.

Incorrect authorization requires redeployment in the current architecture.

### 11.4 Zero-Address Validation

Critical configuration rejects zero address, including:

- token dependencies;
- fee receiver;
- SavingCore authorization.

## 12. Deposit State-Machine Security

Every terminal function:

1. verifies deposit existence;
2. verifies status `Active`;
3. performs action-specific authorization;
4. validates time;
5. calculates values;
6. changes state;
7. performs external settlement;
8. emits events.

This prevents:

- double withdrawal;
- double renewal;
- withdrawal after renewal;
- renewal after withdrawal;
- historical NFT reuse.

Two valid transactions may exist simultaneously in the mempool.

Only the first successfully mined transaction completes.

## 13. Reentrancy and External Interaction Security

### 13.1 Protected Entry Points

`nonReentrant` protects:

- `openDeposit`;
- `withdrawAtMaturity`;
- `earlyWithdraw`;
- `claimPendingInterest`;
- `manualRenew`;
- `autoRenew`;
- `fundVault`;
- `withdrawVault`;
- `payInterest`.

### 13.2 Checks-Effects-Interactions

Sensitive flows update status or pending state before external calls where appropriate.

Examples:

- maturity withdrawal marks the deposit `Withdrawn` before token settlement;
- early withdrawal marks the deposit `Withdrawn` before transfers;
- pending claim clears the amount before VaultManager payout;
- renewal changes old lifecycle and builds new state within one atomic transaction.

### 13.3 Callback Tests

Tests use malicious token and receiver mocks to attempt reentry during:

- deposit opening;
- early withdrawal;
- maturity withdrawal;
- pending-interest claim;
- manual renewal;
- auto-renew;
- ERC721 safe minting.

Nested attempts fail with `ReentrancyGuardReentrantCall`.

### 13.4 Atomic Rollback

If a later transfer or safe mint fails, EVM rollback restores:

- deposit status;
- counters;
- NFT state;
- token balances;
- pending debt;
- reserves.

## 14. ERC20 Security

### 14.1 SafeERC20

SafeBank uses `SafeERC20` for token interactions.

This handles tokens that:

- return `true`;
- return `false`;
- return no value;
- revert.

### 14.2 Supported Token Model

The accounting model is designed for MockUSDC.

It does not claim support for:

- fee-on-transfer tokens;
- rebasing tokens;
- tokens with independent balance mutation;
- arbitrary malicious token economics.

### 14.3 Allowance

The frontend defaults to exact-amount approval.

The contract independently rejects insufficient allowance or transfer failure.

### 14.4 Token Conservation

Tests verify exact balance movement among:

- user;
- SavingCore;
- VaultManager;
- fee receiver.

The system does not mint tokens to compensate for rounding.

## 15. ERC721 Ownership and Transfer Security

The deposit NFT is economically meaningful.

If Alice transfers the certificate to Bob before settlement:

- Bob becomes the current owner;
- Bob gains withdrawal and manual-renewal rights;
- Alice loses those rights.

The contract does not treat ERC721 approval as direct withdrawal authority.

Risks include:

- users treating the NFT as only a collectible;
- stale UI ownership;
- transfer immediately before settlement;
- transfer after C1 settlement.

Controls include:

- direct `ownerOf` checks;
- current-owner refresh;
- transfer warnings;
- fixed C1 claimant snapshot;
- historical terminal status.

## 16. Timestamp Security

### 16.1 Accepted Timestamp Assumption

Block timestamps may vary slightly.

For a 180-day term, limited timestamp influence is accepted.

### 16.2 Maturity Boundary

~~~text
earlyWithdraw:
    valid only when timestamp < maturityAt
~~~

~~~text
withdrawAtMaturity:
    valid when timestamp >= maturityAt
~~~

### 16.3 Grace Boundary

~~~text
manualRenew:
    maturityAt <= timestamp < graceEndsAt
~~~

~~~text
autoRenew:
    timestamp >= graceEndsAt
~~~

The comparisons are mutually exclusive at the transition boundaries.

### 16.4 No Automatic State Change

Time passing does not execute contract code.

A deposit remains in its stored state until a transaction succeeds.

## 17. Financial Math and Rounding

### 17.1 Interest Formula

~~~text
interest =
    principal × aprBps × tenorSeconds
    ÷ (365 days × 10,000)
~~~

The implementation uses `Math.mulDiv`.

### 17.2 Penalty Formula

~~~text
penalty =
    principal × penaltyBpsAtOpen
    ÷ 10,000
~~~

### 17.3 Floor Rounding

Integer results round down.

Consequences:

- the user receives no more than the exact mathematical interest;
- remaining dust stays in VaultManager;
- positive fractional values may round to zero;
- zero-rounded interest skips the payout call.

The test `"keeps integer-rounding dust inside VaultManager"` verifies that one smallest token unit remains in the vault after settlement.

### 17.4 Bounds

Plan validation limits:

- APR to at most 10,000 bps;
- penalty to at most 10,000 bps;
- tenor to at most 3,650 days.

These bounds reduce nonsensical or unsafe configuration.

## 18. Empty Vault and Bonus C1

### 18.1 Base Risk

A full revert on interest underfunding can keep user principal unavailable even though SavingCore still holds it.

### 18.2 Exact Fallback Classification

SafeBank activates C1 only when the VaultManager revert selector equals:

~~~text
InsufficientVaultBalance
~~~

Other failures are rethrown.

This prevents normal underfunding from being confused with:

- pause;
- unauthorized caller;
- malformed revert;
- empty revert;
- unexpected contract failure.

### 18.3 Principal-First Settlement

On exact underfunding:

- principal is returned;
- deposit becomes terminal;
- full interest is deferred;
- no partial interest is paid;
- current NFT owner is snapshotted as claimant;
- reserve remains outstanding.

### 18.4 Claim Security

`claimPendingInterest`:

- requires positive debt;
- requires exact claimant;
- clears debt before external payout;
- consumes reserve;
- relies on rollback if payout fails;
- rejects duplicate claim.

### 18.5 Historical NFT Transfer

A transfer after C1 settlement does not transfer the pending claim.

The receivable belongs to the snapshotted settlement claimant.

## 19. Bonus C2 Solvency Security

### 19.1 Aggregate Liability

`SavingCore.totalReservedInterest` is the authoritative liability ledger.

### 19.2 Reserve Creation

Opening a positive-interest deposit adds expected interest liability.

Zero-rounded expected interest adds no reserve.

### 19.3 Reserve Release

Early withdrawal releases the unused active-term reserve.

### 19.4 Reserve Consumption

Successful funded maturity and successful pending claim consume their liabilities.

### 19.5 Deferred Interest

C1 deferred interest remains reserved until payment succeeds.

### 19.6 Renewal Replacement

Manual and auto-renew atomically:

1. consume the old liability;
2. create the new liability;
3. fund positive old-term interest;
4. mint the renewed certificate.

Failure restores the old accounting state.

### 19.7 Vault Withdrawal Limit

~~~text
availableLiquidity =
    max(vaultBalance - totalReservedInterest, 0)
~~~

Owner withdrawal above this value reverts.

### 19.8 Funding Shortfall

~~~text
fundingShortfall =
    max(totalReservedInterest - vaultBalance, 0)
~~~

Shortfall is visible but does not automatically block valid deposit opening.

### 19.9 Residual Insolvency Risk

C2 does not guarantee full collateralization.

The bank may still fail to fund all obligations.

## 20. Pause Security

SavingCore and VaultManager have independent pause states.

### 20.1 SavingCore Pause Blocks

- deposit opening;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claim.

### 20.2 VaultManager Pause Blocks

- interest payout;
- owner withdrawal.

### 20.3 Funding During Pause

Vault funding remains available to restore liquidity.

### 20.4 Mixed States

The contracts may have different pause states.

The frontend displays both separately.

Pause is a containment tool. It cannot:

- reverse transactions;
- restore stolen keys;
- fund liabilities automatically;
- repair an incorrect deployment;
- guarantee recovery.

## 21. Administrator Key Risk

A compromised administrator may:

- create undesirable future plans;
- change future APR;
- disable plans;
- redirect future penalties;
- pause the system;
- withdraw available vault liquidity.

Implemented containment:

- `Ownable2Step`;
- principal and interest separation;
- immutable existing deposit snapshots;
- C2 withdrawal limit;
- event emission;
- no active-deposit edit function;
- one-time SavingCore authorization.

Recommended operational controls:

- use a dedicated deployment wallet;
- do not reuse personal wallets;
- use hardware or multisig control for production-like extensions;
- monitor ownership and vault events;
- keep secrets outside Git;
- prepare an incident-response process.

## 22. Bot Liveness and Transaction Ordering

### 22.1 Dead Bot

A dead bot does not change state.

Deposits remain `Active`.

### 22.2 Permissionless Protection

Any address may call `autoRenew`.

The caller cannot redirect ownership or value.

### 22.3 Owner Exit

After grace, the current owner may still call maturity withdrawal while the deposit remains active.

### 22.4 One Delayed Term

A delayed auto-renew creates exactly one new term.

It does not create retroactive multi-term compounding.

### 22.5 Competing Transactions

After grace:

- owner maturity withdrawal may be valid;
- permissionless auto-renew may be valid.

The first mined valid action wins.

SafeBank does not guarantee transaction ordering.

## 23. Frontend Security

### 23.1 Wallet Secrets

The frontend does not:

- request a private key;
- request a seed phrase;
- store private keys;
- sign without the browser wallet;
- transmit secrets to assistants.

### 23.2 Network Validation

Before writes, the wallet layer verifies:

- injected EIP-1193 provider;
- connected account;
- Ethereum Sepolia.

### 23.3 Read and Write Separation

Public reads use `JsonRpcProvider`.

Writes use `BrowserProvider` and the user-approved signer.

### 23.4 Contract Configuration

Addresses and ABIs are synchronized from tracked deployment records.

### 23.5 Approval Safety

The frontend defaults to exact-amount approval.

Approval and deposit or funding actions are separate transactions.

### 23.6 Confirmation

Consequential actions require review before the wallet opens.

### 23.7 Transaction Lifecycle

The UI distinguishes:

- waiting for wallet;
- submitted;
- confirming;
- confirmed;
- rejected;
- reverted;
- provider failure.

### 23.8 State Refresh

After confirmation or failure, the frontend refreshes authoritative contract state.

### 23.9 Admin Guards

Frontend admin checks improve UX only.

Solidity ownership is authoritative.

### 23.10 Untrusted Rendering

Assistant responses are rendered as ordinary React text.

The checked assistant paths do not use `dangerouslySetInnerHTML`.

## 24. Assistant Security

### 24.1 Model

The assistants are deterministic local rule engines.

They do not call an external LLM provider.

### 24.2 Input Validation

Questions:

- are normalized;
- have control characters replaced;
- cannot be empty;
- cannot exceed 500 characters;
- cannot contain HTTP or HTTPS URLs.

### 24.3 Structured Output

Answers contain:

1. fact;
2. explanation;
3. caution;
4. next step.

### 24.4 No Financial Authority

The assistants cannot:

- connect a wallet;
- request a signer;
- import write clients;
- approve;
- deposit;
- withdraw;
- renew;
- claim;
- fund;
- pause;
- change plans;
- sign;
- submit transactions.

### 24.5 Context Boundary

Assistant facts derive from serializable application context.

Contract state remains authoritative.

### 24.6 Spline Boundary

The external Spline scene is a visual launcher only.

Its availability or content does not affect SafeBank state or authorization.

## 25. Deployment and Secret Security

### 25.1 Local Chain Guard

Local deployment and seed scripts enforce chain ID `31337`.

They reject accidental use on another network.

### 25.2 Sepolia Guard

Sepolia deployment validates:

- chain ID `11155111`;
- expected deployment sequence;
- contract relationships;
- transaction receipts;
- canonical plan;
- initial state.

### 25.3 Confirmation Policy

Tracked Sepolia deployment uses two confirmations.

### 25.4 Secret Files

Local environment files remain ignored.

The repository must not commit:

- deployment private keys;
- seed phrases;
- RPC secrets;
- Etherscan API keys;
- future external-provider secrets.

### 25.5 Source Verification

All three Sepolia production contracts are source-verified on Etherscan.

Source verification is not a security audit.

## 26. Threat and Mitigation Matrix

| Threat | Target | Implemented mitigation |
|---|---|---|
| Reentrancy during token transfer | Principal or vault liquidity | `nonReentrant`, state updates, atomic rollback, malicious callback tests |
| Double withdrawal | Principal | Active-only status and terminal transition |
| Double renewal | Principal and NFT | Active-only status |
| Withdrawal after renewal | Principal | Terminal old-deposit state |
| Renewal after withdrawal | Principal and NFT | Terminal old-deposit state |
| Former owner withdrawal | Principal | Direct current `ownerOf` comparison |
| Approved operator withdrawal | Principal | Caller must equal direct owner |
| Auto-renew caller steals NFT | NFT ownership | New NFT minted to current old-certificate owner |
| Unauthorized administrator | Plans and vault | Solidity `onlyOwner` and `Ownable2Step` |
| Unauthorized vault payout | Interest liquidity | `onlySavingCore` |
| SavingCore replacement attack | Interest liquidity | One-time authorization |
| Vault over-withdrawal | Interest liabilities | Available-liquidity limit |
| Reserve underflow | Liability accounting | Explicit invariant check and checked arithmetic |
| Vault underfunding | User interest | C1 full-value deferral |
| Principal locked by underfunding | User principal | Principal-first maturity settlement |
| Double pending claim | Vault liquidity | Clear debt before payout and zero-debt rejection |
| Claim stolen after NFT transfer | Pending interest | Fixed claimant snapshot |
| Exact maturity error | User rights | Explicit `<` and `>=` comparisons |
| Exact grace error | Renewal rights | Half-open manual window and complementary auto window |
| Disabled plan invalidates old deposits | User rights | Existing snapshots remain actionable |
| Disabled plan reused manually | New liability | Manual renewal checks `enabled` |
| Bot outage | Availability | Permissionless auto-renew and owner withdrawal |
| Rounding overpayment | Vault liquidity | Floor rounding with `Math.mulDiv` |
| False-return ERC20 | Token accounting | `SafeERC20` and rollback |
| Unsafe ERC721 receiver | NFT custody | Safe minting and full rollback |
| Frontend authorization bypass | Admin functions | Solidity access control |
| Wrong network transaction | User interaction | Sepolia chain validation |
| Wrong contract metadata | Frontend interaction | Tracked artifact synchronization |
| Assistant financial execution | User funds | No signer or write-layer access |
| Assistant unsafe rendering | Browser UI | Ordinary React text rendering |
| Secret leakage | Keys and provider access | Ignored local environment files and no frontend secrets |

## 27. Testing Evidence

Validated contract checkpoint:

- 258 passing tests;
- 100% production statements;
- 98.40% production branches;
- 100% production functions;
- 100% production lines.

Coverage includes:

- access control;
- pause behavior;
- ownership transfer;
- NFT economic rights;
- exact maturity;
- exact grace end;
- interest and penalty math;
- rounding dust;
- C1 deferral and claim;
- C2 reserve lifecycle;
- vault withdrawal limits;
- callback reentrancy;
- ERC20 failures;
- ERC721 receiver failures;
- full rollback;
- deployment regression.

Validated frontend checkpoint:

- 65 passing test files;
- 256 passing tests;
- zero Oxlint warnings or errors;
- successful TypeScript validation;
- successful Vite build.

Frontend coverage includes:

- wallet events;
- chain validation;
- contract reads;
- transaction preparation;
- user actions;
- admin actions;
- confirmations;
- loading, empty, and error states;
- bilingual behavior;
- assistant input safety;
- assistant cancellation;
- stale-response handling;
- no-write assistant boundaries.

## 28. Residual Risks

The following risks remain accepted or unresolved:

- centralized administrator ownership;
- administrator key compromise;
- permanent incorrect one-time authorization;
- insufficient bank funding;
- delayed pending-interest payment;
- transaction-ordering competition after grace;
- timestamp variance;
- unsupported ERC20 economics;
- RPC outage or stale reads;
- browser-wallet failure;
- user misunderstanding of transferable certificate value;
- external Spline availability;
- absence of rich NFT metadata;
- non-upgradeable bug recovery requiring redeployment;
- absence of independent professional audit;
- no guarantee of production banking suitability.

## 29. Operational Incident Response

Recommended response process:

1. identify the affected contract and action;
2. inspect confirmed contract state and receipts;
3. pause the affected contract if the administrator key remains trusted;
4. avoid classifying every failure as ordinary underfunding;
5. preserve transaction and event evidence;
6. inspect vault balance, reserve, liquidity, and shortfall;
7. fund legitimate liabilities where appropriate;
8. do not expose or rotate secrets through Git;
9. communicate exact affected operations;
10. prepare a corrected deployment when non-upgradeable code must change.

Pause should be used only as a containment mechanism, not described as a complete recovery solution.

## 30. Security Conclusion

SafeBank implements explicit boundaries among:

- user principal;
- bank-funded interest;
- NFT ownership;
- pending claims;
- aggregate liabilities;
- administrator authority;
- frontend transaction preparation;
- assistant explanation.

The strongest implemented protections are:

- principal and interest separation;
- active-only lifecycle transitions;
- current-owner authorization;
- reentrancy protection;
- atomic rollback;
- immutable term snapshots;
- exact timestamp rules;
- C1 principal-first settlement;
- C2 reserved-interest withdrawal containment;
- user-approved wallet writes;
- deterministic read-only assistants.

These controls create a defensible Capstone security model, but they do not eliminate all smart-contract, administrative, operational, or user risks.