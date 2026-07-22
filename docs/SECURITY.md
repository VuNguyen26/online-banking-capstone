# SafeBank Security Model

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank / Online Banking System |
| Document | Security Model and Threat Analysis |
| Current project phase | Phase 18 — Deterministic Read-Only SafeBank Assistants |
| Implementation status | Smart-contract controls, Bonus C1, Bonus C2, local and public deployment protections, User Banking App controls, Admin Portal controls, hardened UI states, and deterministic assistant boundaries are implemented and locally validated; professional audit and final submission remain pending |
| Security approach | Defense-in-depth and risk reduction |
| Smart contract model | Non-upgradeable |
| Assistant model | Deterministic local rule engine; no external LLM or AI API |
| Validated networks | Local chain ID 31337 and Ethereum Sepolia chain ID 11155111 |
| Test asset | MockUSDC with 6 decimals |
| Student ID | 3122560090 |

Phase 18 does not give the assistant financial authority.

The assistant receives only structured, serializable dashboard context and
returns explanatory plain text. It cannot obtain a signer, import transaction
clients, connect a wallet, or submit a transaction.

The external Spline iframe is a presentation dependency only. Its availability
or content does not determine SafeBank state or transaction authorization.

Passing tests and source verification reduce identified risks. They do not
constitute an independent professional audit or production-readiness
guarantee.

## 1.1 Personal Variant Security Baseline

The security model must remain consistent with student ID `3122560090`.

Required values:

- grace period: 2 days;
- default APR: 200 bps = 2.00% per year;
- early withdrawal penalty: 750 bps = 7.50%;
- default tenor: 180 days;
- MockUSDC decimals: 6 decimals.

Security implications:

- timestamp tests must use the exact 2-day grace period;
- interest tests must include the 200 bps default APR;
- early-withdrawal tests must include the 750 bps penalty;
- default-plan tests must include the 180-day tenor;
- token calculations must use six-decimal units;
- scripts and tests must use `parseUnits(value, 6)`, not `parseEther`.

---

## 2. Security Philosophy

SafeBank uses a defense-in-depth approach.

The project does not rely on one modifier, one library, one administrator, one frontend check, or one test to protect funds.

The intended security layers include:

- separation of principal and interest custody;
- explicit trust boundaries;
- least-privilege authorization;
- two-step ownership transfer where appropriate;
- deposit state validation;
- checks-effects-interactions;
- reentrancy protection;
- safe ERC20 operations;
- snapshot-based financial terms;
- exact timestamp rules;
- pause controls;
- event-based auditability;
- extensive unit, integration, boundary, and security tests;
- frontend confirmations and warnings;
- deterministic financial calculations;
- secret-management discipline;
- implemented principal-first settlement and deferred-interest claims;
- implemented solvency reserve accounting.

The correct security language for SafeBank is:

- the project reduces identified risks;
- the project applies defense-in-depth;
- the project limits the blast radius of failures;
- the project validates critical state transitions;
- the project preserves explicit accounting invariants.

The project must not claim that the contracts are impossible to exploit.

---

## 3. Security Scope Classification

Security requirements are separated into four categories.

### 3.1 Mandatory Capstone Security

The mandatory scope includes:

- access control;
- pause and unpause;
- correct interest and penalty math;
- APR snapshot;
- penalty snapshot;
- owner validation;
- state-machine protection;
- interest paid by `VaultManager`;
- principal held by `SavingCore`;
- insufficient-vault handling according to the base specification;
- event emission;
- coverage above 90%.

### 3.2 SafeBank Security Decisions

SafeBank additionally requires:

- the current NFT owner controls economic rights;
- pause also blocks opening deposits;
- old NFTs remain but cannot be reused;
- maturity and grace boundaries are exact;
- maturity withdrawal remains possible after grace if the deposit remains active;
- auto-renew is permissionless but ownership-safe;
- rounding dust remains in the vault;
- the contracts are non-upgradeable;
- the frontend is not treated as an authorization boundary;
- AI is read-only and advisory.

### 3.3 Bonus Security

The selected bonuses are:

- C1 — Principal-First Settlement, implemented and validated locally in
  Phase 11;
- C2 — Solvency Guard, implemented and validated locally in Phase 12.

C1 protects principal recovery during an interest-liquidity shortfall.

C2 records interest liabilities, exposes funding shortfall, and prevents owner
withdrawal from consuming reserved liquidity.

### 3.4 Product Security Extensions

The product-security scope includes:

- wallet and network validation;
- contract-address validation;
- transaction-state handling;
- approval warnings;
- NFT-transfer warnings;
- test-token warnings;
- safe AI fallback;
- admin confirmation flows;
- audit-event presentation.

---

## 4. Security Objectives

SafeBank has the following security objectives.

### 4.1 Principal Protection

User principal must remain isolated inside `SavingCore` until a valid withdrawal or renewal transition occurs.

Principal belonging to one depositor must not be used to pay another depositor's interest.

### 4.2 Interest Liquidity Protection

Bank-funded interest liquidity in `VaultManager` must only leave through:

- an authorized interest payout;
- an explicitly authorized administrator withdrawal;
- another narrowly defined administrative action documented by the project.

### 4.3 Correct Ownership Enforcement

Only the current NFT owner may execute owner-restricted economic actions.

The original depositor must lose those rights after transferring the NFT.

### 4.4 Single Settlement

A deposit must not be:

- withdrawn twice;
- renewed twice;
- withdrawn after renewal;
- renewed after withdrawal;
- processed simultaneously through two successful terminal actions.

### 4.5 Financial Correctness

The implementation must preserve:

- APR snapshots;
- penalty snapshots;
- six-decimal token accounting;
- multiplication-before-division;
- deterministic integer rounding;
- exact principal and interest balance movements;
- reserve accounting under the implemented C2 model.

### 4.6 Administrative Containment

Administrator privileges must be explicit, limited, auditable, and protected by on-chain access control.

### 4.7 Operational Resilience

Failure of:

- a bot;
- an AI provider;
- a frontend;
- an RPC endpoint;
- a browser session;

must not change ownership or bypass contract rules.

### 4.8 Secret Protection

Private keys, seed phrases, and API secrets must never be committed to Git or exposed in the frontend bundle.

---

## 5. Assets to Protect

## 5.1 User Principal

User principal is the most important protected asset.

It is held by `SavingCore` and backs active deposit obligations.

Potential losses include:

- unauthorized transfer;
- double withdrawal;
- incorrect renewal;
- accounting mismatch;
- admin extraction;
- use as another user's interest.

## 5.2 Vault Interest Liquidity

Vault liquidity is funded by the bank to pay interest.

Potential losses include:

- unauthorized payout;
- administrator over-withdrawal;
- reentrancy;
- incorrect reserve release;
- arbitrary token transfer;
- misconfigured SavingCore authorization.

## 5.3 Pending Interest

After C1, pending interest becomes an explicit debt.

It must be protected against:

- double claim;
- claimant replacement;
- claim by the wrong owner;
- state overwrite;
- settlement after deposit renewal;
- accounting inconsistency.

## 5.4 Reserved Interest

`SavingCore.totalReservedInterest` represents the aggregate of:

- expected positive interest for active deposits;
- unpaid C1 pending-interest liabilities.

It must be protected against:

- underflow;
- double release;
- missed release;
- double reservation;
- incorrect renewal replacement;
- debt loss after failed claims;
- inconsistent VaultManager withdrawal limits.

VaultManager does not mutate this value. It reads it from the one-time
authorized SavingCore and uses it to calculate available liquidity and funding
shortfall.

## 5.5 Early Withdrawal Penalty

The early withdrawal penalty must be transferred exactly once to the configured fee receiver.

Potential risks include:

- wrong receiver;
- zero-address receiver;
- incorrect basis-point math;
- duplicated transfer;
- principal and penalty imbalance.

## 5.6 NFT Ownership

NFT ownership determines economic rights.

Potential risks include:

- using original depositor instead of current owner;
- minting renewed NFT to the auto-renew caller;
- stale frontend ownership;
- transfer immediately before settlement;
- historical NFT reuse.

## 5.7 Deposit State

Deposit status prevents double processing.

It must not be:

- overwritten by an unauthorized actor;
- reset to `Active`;
- changed after an external failure unless the entire transaction succeeds;
- transitioned to multiple terminal states.

## 5.8 Saving Plan Configuration

Plan data affects future deposits.

Protected fields include:

- tenor;
- APR;
- min deposit;
- max deposit;
- penalty;
- enabled state.

Existing deposit snapshots must remain unaffected by later plan updates.

## 5.9 Administrative Ownership

Ownership controls privileged functions.

Risks include:

- compromised admin key;
- accidental ownership transfer;
- transfer to zero address;
- lost admin key;
- malicious administrator;
- frontend impersonation.

## 5.10 Contract Configuration

Critical addresses include:

- MockUSDC;
- SavingCore;
- VaultManager;
- fee receiver;
- deployed contract addresses used by scripts and frontend.

A wrong address may cause permanent loss, unusable contracts, or interaction with malicious code.

## 5.11 Frontend Configuration

Frontend configuration must protect against:

- wrong chain;
- wrong contract;
- stale ABI;
- accidental mainnet transaction;
- malicious environment-variable replacement;
- misleading transaction details.

## 5.12 Local Secrets

Protected local secrets include:

- `TESTNET_PRIVATE_KEY`;
- `MAINNET_PRIVATE_KEY`;
- `ETHERSCAN_API_KEY`;
- wallet seed phrases;
- provider keys;
- future AI API keys.

---

## 6. Actors and Privilege Levels

## 6.1 Depositor or NFT Owner

Privilege level:

- unprivileged user;
- may control deposits only when it owns the associated NFT.

Trust level:

- untrusted.

The contract must assume the caller may submit:

- invalid plan IDs;
- invalid deposit IDs;
- zero amounts;
- excessive amounts;
- premature withdrawals;
- repeated transactions;
- insufficient approvals;
- deliberately adversarial call sequences.

## 6.2 Bank Administrator

Privilege level:

- privileged.

Expected powers may include:

- creating and updating plans;
- enabling and disabling plans;
- funding the vault;
- withdrawing permitted vault liquidity;
- changing the fee receiver;
- pausing and unpausing;
- authorizing the SavingCore address.

Trust level:

- trusted for normal operations but not trusted beyond enforced contract rules.

The design must assume:

- the administrator may make mistakes;
- the administrator key may be compromised;
- the administrator may act maliciously;
- frontend admin-route guards may be bypassed.

## 6.3 SavingCore

Privilege level:

- authorized contract caller to `VaultManager`.

Trust requirement:

- only the configured and verified SavingCore contract may trigger interest payouts and reserve transitions.

Risk:

- a wrong or replaceable authorization could allow vault drainage.

## 6.4 VaultManager

Privilege level:

- custodian of interest liquidity.

Trust requirement:

- must not gain arbitrary access to principal held by SavingCore.

## 6.5 Auto-Renew Caller

Privilege level:

- permissionless trigger only.

Trust level:

- completely untrusted.

The caller must not control:

- recipient ownership;
- APR;
- tenor;
- penalty;
- principal;
- payout receiver.

## 6.6 Frontend

Privilege level:

- none on-chain.

Trust level:

- untrusted as a security boundary.

The frontend may improve UX, but a user can call the contracts directly.

## 6.7 Deterministic Assistant Engine

Privilege level:

- none on-chain;
- none in the wallet or transaction layer.

Trust level:

- advisory only;
- not authoritative for financial state.

The implemented engine uses local deterministic rules and verified structured
context. It does not call an external LLM or AI provider.

Its output may still be incomplete or fail to classify an unsupported
question, so contract state remains authoritative.

## 6.8 RPC Provider

Privilege level:

- none on-chain.

Trust level:

- may return stale, delayed, or incorrect display data.

Transactions still depend on wallet confirmation and network consensus.

---

## 7. Trust Assumptions

The current security model assumes:

- OpenZeppelin libraries behave according to their official implementation;
- MockUSDC behaves as a conventional ERC20 test token;
- Ethereum transaction atomicity applies;
- Solidity 0.8.x arithmetic reverts on overflow and underflow unless unchecked logic is used;
- block timestamps may be slightly influenced but cannot be arbitrarily rewritten;
- the administrator is privileged but potentially fallible;
- external callers are adversarial;
- browser wallets may reject, replace, delay, or fail transactions;
- RPC responses may be stale;
- users may transfer deposit NFTs without understanding the economic consequence;
- auto-renew requires a real transaction;
- AI may hallucinate or become unavailable;
- the contracts, not UI or AI, are the source of truth;
- MockUSDC has no real financial value.

These assumptions must be revisited if the token, network, ownership model, or deployment model changes.

---

## 8. Trust Boundaries

## 8.1 Wallet-to-Frontend Boundary

The frontend can request a wallet connection but must not access or store the user's private key.

The wallet independently displays and signs transactions.

## 8.2 Frontend-to-Contract Boundary

All frontend inputs are untrusted.

The contract must revalidate:

- addresses;
- amount;
- plan ID;
- deposit ID;
- ownership;
- status;
- timestamp;
- pause state.

## 8.3 User-to-SavingCore Boundary

Every public or external function callable by users is an attack surface.

No user-provided data may be assumed valid.

## 8.4 SavingCore-to-VaultManager Boundary

This is a critical contract boundary.

`VaultManager` verifies that interest-payout calls originate from the authorized SavingCore.

Reserve transitions occur internally in SavingCore. VaultManager reads the aggregate reserve from that same authorized contract for solvency enforcement.

`SavingCore` must not assume a payout succeeded unless the external call completes successfully.

## 8.5 Contract-to-Token Boundary

ERC20 transfers are external calls.

The Phase 6 SavingCore implementation uses `SafeERC20` for deposit principal collection and maturity principal return, while VaultManager uses it for interest settlement. These interactions handle tokens that:

- return `true`;
- return `false`;
- return no value;
- revert.

The project will still document that malicious tokens can violate broader economic assumptions.

## 8.6 Admin-to-Contract Boundary

Admin UI authentication is not sufficient.

Every privileged Solidity function must use on-chain access control.

## 8.7 AI-to-Application Boundary

AI output must be treated as untrusted text.

Financial values must come from deterministic sources before they are presented as factual.

## 8.8 Repository-to-Deployment Boundary

Committed source code and local environment values are separate.

Secrets must remain local and ignored.

Deployment scripts must verify dependencies before broadcasting transactions.

---

## 9. Attack Surfaces

The planned attack surfaces include:

- ERC20 approvals;
- ERC20 transfers;
- deposit opening;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claim;
- plan administration;
- vault funding;
- vault withdrawal;
- fee receiver update;
- SavingCore authorization;
- pause and unpause;
- ERC721 transfer;
- ERC721 receiver hooks if safe minting is used;
- contract constructors;
- deployment scripts;
- environment variables;
- frontend network configuration;
- frontend transaction preparation;
- event indexing;
- AI prompts and responses;
- auto-renew automation;
- block timestamp boundaries;
- transaction ordering and front-running.

Every attack surface must be connected to validation, tests, or an accepted residual risk.

---

## 10. Core Security Invariants

## 10.1 Principal Separation

Tokens backing active principal must remain inside `SavingCore`.

Vault operations must not consume them.

## 10.2 Interest Separation

Interest must be paid from `VaultManager`.

## 10.3 Active-Only Processing

Only a deposit with status `Active` may transition.

## 10.4 One Terminal Transition

A deposit may successfully reach exactly one terminal status.

## 10.5 Current-Owner Authorization

Owner-restricted actions use the current result of `ownerOf(depositId)`.

## 10.6 Snapshot Integrity

APR, penalty, and tenor snapshots of an existing deposit cannot be changed by future plan administration.

## 10.7 Renewal Funding

Manual renewal and permissionless auto-renewal must not create unpaid or synthetic principal.

For a positive old-term interest amount:

- the interest must be physically transferred from `VaultManager`;
- the recipient is `SavingCore`;
- the transfer must succeed before the renewed certificate can remain
  minted;
- the new principal must equal old principal plus funded interest.

The implementation uses:

`vaultManager.payInterest(address(this), interest)`

If the vault is:

- unauthorized;
- paused;
- underfunded;
- unable to complete the ERC20 transfer;

the complete renewal transaction reverts.

If old-term interest rounds down to zero:

- no VaultManager payout is requested;
- no unfunded principal is created;
- the new principal equals the old principal;
- renewal may succeed while only VaultManager is paused.

A later safe-mint failure also reverts any earlier interest transfer.

## 10.8 Auto-Renew Recipient

The new NFT is minted to the current old-NFT owner, not to the caller.

## 10.9 Exact Boundary Behavior

At `maturityAt`:

- early withdrawal is invalid;
- maturity withdrawal is valid;
- manual renewal begins.

At `maturityAt + gracePeriod`:

- manual renewal is invalid;
- auto-renew is valid.

## 10.10 Atomic Rollback

If a required external call fails, the entire transaction must revert without leaving a partial state transition.

## 10.11 Pending-Interest Integrity

After C1:

- principal settlement occurs once;
- claimant is snapshotted;
- pending interest is claimed once.

## 10.12 Reserve Integrity

Under the implemented C2 model:

- every reservation is recorded once;
- every release or consumption is recorded once;
- deferred C1 debt remains reserved until paid;
- administrator withdrawal stays within available liquidity.

---

## 11. Threat and Mitigation Matrix

| Threat | Target | Planned mitigation | Required validation |
|---|---|---|---|
| Reentrancy during payout | Principal or vault liquidity | `ReentrancyGuard`, checks-effects-interactions, state update before transfer | Reentrant mock tests |
| Double withdrawal | User principal | Active-only status validation and terminal state update | Second withdrawal must revert |
| Double renewal | Principal and NFT | Active-only status validation | Second renewal must revert |
| Withdraw after renewal | Principal | Terminal old-deposit status | Withdrawal must revert |
| Renew after withdrawal | Principal | Terminal old-deposit status | Renewal must revert |
| Unauthorized owner action | User principal | `ownerOf(depositId) == msg.sender` | Old owner and unrelated caller tests |
| Unauthorized admin action | Plans and vault | `Ownable2Step` and only-owner checks | Non-owner tests |
| Fake deposit ID | State and ownership | Deposit existence validation before ownership-dependent logic | Invalid-ID tests |
| Invalid plan ID | Plan creation and deposit opening | Explicit plan existence validation | Invalid-ID tests |
| Plan update changes old deposit | Financial terms | APR and penalty snapshots | Snapshot tests |
| Vault drain by arbitrary caller | Interest liquidity | Authorized SavingCore and owner-only admin methods | Unauthorized payout tests |
| Wrong SavingCore authorization | Interest liquidity | Address validation, controlled setup, event emission | Configuration tests |
| Admin over-withdrawal | Interest liabilities | Implemented `availableLiquidity` limit | Exact and one-unit-over withdrawal tests |
| Reserve underflow | Interest liabilities | Exact lifecycle transitions and Solidity checked arithmetic | Release-twice test |
| Underfunded vault | User interest | C1 full-or-defer principal-first settlement | Principal-first and claim rollback tests |
| Principal locked by missing interest | User principal | Implemented C1 principal-first settlement | Principal-first integration tests |
| Claim pending interest twice | Vault liquidity | Clear pending debt before payout and rely on EVM rollback on failure | Double-claim and payout-rollback tests |
| NFT transfer confusion | Economic rights | Current-owner logic and UI warning | Transfer-before-withdraw test |
| Auto-renew caller steals NFT | NFT ownership | Mint to current owner | Third-party caller test |
| Exact maturity bug | User rights | Explicit `<` and `>=` rules | Exact-second boundary tests |
| Exact grace bug | Renewal rights | Explicit grace comparisons | Exact-second boundary tests |
| Pause bypass | All financial actions | Pause checks on every required entry point | Per-function pause tests |
| Malicious ERC20 behavior | Token transfers | `SafeERC20`, atomic rollback, test mocks | False-return and revert tests |
| Insufficient allowance | Deposit opening | Safe transfer failure and rollback | Allowance test |
| Insufficient balance | Deposit opening | Safe transfer failure and rollback | Balance test |
| Wrong fee receiver | Penalty | Zero-address validation and controlled update | Receiver tests |
| Rounding discrepancy | Financial accounting | Defined floor rounding and conservation tests | Dust tests |
| Front-running withdraw vs auto-renew | Deposit state | First mined valid transaction wins; terminal state blocks second | Ordering tests |
| Dead auto-renew bot | Availability | Permissionless trigger and owner withdrawal remains valid | Liveness documentation |
| Admin key compromise | System administration | Two-step ownership, pause, monitoring, least privilege | Operational controls |
| Wrong network | User funds and UX | Chain-ID validation and visible network warning | Frontend tests |
| Wrong contract address | User funds and UX | Address verification and deployment config | Frontend validation |
| AI hallucination | User understanding | Deterministic data source and advisory label | AI fallback tests |
| Secret leakage | Wallet and API access | `.gitignore`, local environment, no frontend secrets | Git and build checks |

---

## 12. Reentrancy

## 12.1 Risk

Reentrancy may occur when SafeBank calls:

- MockUSDC or another ERC20;
- a future token with callbacks;
- an ERC721 receiver during safe minting;
- VaultManager from SavingCore;
- SavingCore from VaultManager through an unsafe design.

An attacker may attempt to re-enter before state is finalized.

## 12.2 Planned Controls

The project plans to use:

- `ReentrancyGuard`;
- checks-effects-interactions;
- terminal status update before external value transfer;
- no unnecessary external calls;
- tightly controlled cross-contract interfaces;
- `SafeERC20`;
- atomic rollback on failure.

## 12.3 Expected Processing Order

A sensitive function should generally:

1. validate inputs;
2. validate existence;
3. validate owner or role;
4. validate status;
5. validate timestamp;
6. calculate values;
7. update state;
8. execute external token or vault interactions;
9. emit events.

The exact order may differ when reserve accounting requires coordination, but the final implementation must preserve atomicity and avoid exploitable intermediate state.

## 12.4 Required Tests

Tests must include malicious mocks that attempt to:

- call withdrawal again;
- call renewal during settlement;
- call pending-interest claim again;
- re-enter vault payout;
- re-enter through ERC721 receiving where applicable.

A passing happy-path test is not enough to establish reentrancy resistance.

---

## 13. Double Execution and State-Machine Security

## 13.1 Threat

An attacker may attempt:

- maturity withdrawal twice;
- early withdrawal twice;
- manual renewal twice;
- auto-renew twice;
- withdrawal after renewal;
- renewal after withdrawal;
- simultaneous competing transactions.

## 13.2 Planned Control

Every terminal action requires:

- valid deposit;
- status `Active`.

The first successful action changes the status to:

- `Withdrawn`;
- `ManualRenewed`;
- `AutoRenewed`.

All later actions must revert.

## 13.3 Transaction Ordering

Two valid transactions may exist in the mempool at the same time.

For example:

- owner submits maturity withdrawal;
- bot submits auto-renew.

The transaction mined first changes the state.

The second transaction must fail its `Active` status validation.

SafeBank does not guarantee which valid transaction miners or validators order first.

## 13.4 Required Tests

Tests must cover every pair of conflicting terminal operations.

---

## 14. Access Control

## 14.1 Planned Ownership Model

`Ownable2Step` is preferred for privileged contracts.

Two-step ownership transfer reduces accidental transfer to:

- the wrong address;
- an address that cannot operate the contract;
- an address whose owner has not accepted responsibility.

## 14.2 Administrative Functions

Expected owner-only functions include:

- plan creation;
- plan APR update;
- plan enable;
- plan disable;
- vault withdrawal;
- fee receiver update;
- pause;
- unpause;
- SavingCore authorization where applicable.

Exact ownership distribution between SavingCore and VaultManager remains an implementation decision.

## 14.3 On-Chain Enforcement

The following are not sufficient security controls:

- hiding an admin button;
- checking an admin wallet only in React;
- redirecting non-admin users;
- storing an admin flag in local storage.

Every privileged function must reject unauthorized callers in Solidity.

## 14.4 Zero-Address Validation

The implementation must reject the zero address for critical configuration such as:

- token address;
- vault address;
- fee receiver;
- SavingCore authorization;
- ownership transfer where the library does not already prevent it.

## 14.5 Required Tests

Tests must cover:

- non-owner plan management;
- non-owner vault withdrawal;
- non-owner pause;
- unauthorized SavingCore payout;
- zero-address configuration;
- ownership-transfer flow.

---

## 15. SavingCore Authorization in VaultManager

## 15.1 Risk

If any address can request vault interest, the vault can be drained.

If the administrator can silently replace SavingCore at any time, a compromised admin may authorize a malicious contract.

If authorization is immutable but configured incorrectly, the vault may become unusable.

## 15.2 Candidate Designs

Possible designs include:

1. constructor-time immutable SavingCore;
2. one-time post-deployment setup;
3. replaceable address with owner control, validation, and events.

## 15.3 Current Security Direction

The preferred direction is:

- explicit zero-address validation;
- one clearly documented authorization path;
- event emission;
- no arbitrary public replacement;
- deployment script verification;
- integration test proving only the intended SavingCore may request payout.

The final choice will be recorded in `DESIGN_DECISIONS.md` before VaultManager implementation.

---

## 16. NFT Ownership and Transfer Risk

## 16.1 Economic Meaning

The NFT is not decorative.

It represents the right to receive principal and interest from the associated active deposit.

## 16.2 Transfer Consequence

If Alice transfers the NFT to Bob:

- Bob becomes the current owner;
- Bob may withdraw or manually renew;
- Alice loses those rights.

## 16.3 Risks

Risks include:

- users believing the NFT is only a collectible;
- selling the NFT without understanding its financial value;
- stale UI showing the previous owner;
- transfer immediately before withdrawal;
- incorrect use of original-depositor storage;
- transferring after C1 settlement and disputing pending interest.

## 16.4 Planned Controls

The project will:

- use current `ownerOf(depositId)` for active owner actions;
- display a prominent transfer warning;
- show the current owner on deposit details;
- snapshot the C1 claimant at settlement;
- retain old NFTs only as historical certificates;
- use deposit status to block reuse.

## 16.5 Required Tests

Tests must cover:

- transfer before maturity;
- current owner successfully withdraws;
- original owner is rejected;
- current owner manually renews;
- third party triggers auto-renew;
- new NFT is minted to the current owner;
- transfer after C1 settlement does not change claimant.

---

## 17. Timestamp and Boundary Security

## 17.1 Timestamp Risk

Block timestamps are not exact wall-clock guarantees.

Validators may have limited influence over timestamps.

The project must not use timestamps for extremely fine-grained price-sensitive logic.

For a 180-day savings term, limited timestamp variance is accepted.

## 17.2 Maturity Boundary

Rules:

- early withdrawal: `block.timestamp < maturityAt`;
- maturity withdrawal: `block.timestamp >= maturityAt`.

At exactly `maturityAt`, the deposit is mature.

## 17.3 Grace Boundary

Manual renewal is valid only during:

`maturityAt <= block.timestamp < maturityAt + GRACE_PERIOD`

The two-day grace period uses a half-open interval.

Before maturity:

- manual renewal is invalid;
- `DepositNotMatured` is expected.

At exact maturity:

- early withdrawal is invalid;
- maturity withdrawal is valid;
- manual renewal becomes valid.

One second before the grace-period end:

- manual renewal remains valid.

At the exact grace-period end:

- manual renewal is invalid;
- `ManualRenewalWindowClosed` is expected for manual renewal;
- permissionless `autoRenew(depositId)` is valid.

Before that boundary:

- `autoRenew` reverts with `AutoRenewalTooEarly`;
- the error reports the deposit ID, grace-end timestamp, and current
  timestamp.

After the grace-period end:

- manual renewal remains invalid;
- maturity withdrawal remains valid for the direct current owner while the
  deposit is still `Active`;
- `autoRenew` remains valid permissionlessly while the deposit is still
  `Active`;
- the first successfully mined terminal action changes the status;
- every later conflicting action is rejected.

Phase 9 tests cover the surrounding seconds, both exact boundaries, and
competing terminal-action ordering.

## 17.4 No Automatic State Transition

Time passing does not execute Solidity code.

The deposit remains in its stored status until a transaction succeeds.

## 17.5 Required Tests

Use Hardhat network helpers to test:

- one second before maturity;
- exact maturity;
- one second after maturity;
- one second before grace end;
- exact grace end;
- one second after grace end.

---

## 18. Financial Math and Rounding Security

## 18.1 Interest Formula

The planned formula is:

`interest = principal × aprBpsAtOpen × tenorSeconds ÷ (365 days × 10,000)`

## 18.2 Multiplication Before Division

Dividing principal too early may truncate the value to zero.

The implementation must multiply before dividing where safe.

## 18.3 Overflow Consideration

Solidity 0.8.x checks overflow, but checked arithmetic does not guarantee business-valid inputs.

The project must still define reasonable bounds for:

- APR;
- tenor;
- deposit amount.

## 18.4 Penalty Formula

The penalty is:

`penalty = principal × penaltyBpsAtOpen ÷ 10,000`

The implementation must ensure the configured penalty cannot exceed a valid project bound that would make `principal - penalty` invalid.

## 18.5 Rounding Ownership

Integer division rounds down.

SafeBank assigns rounding dust to `VaultManager`.

The project must not mint tokens to compensate.

## 18.6 Required Tests

Tests must verify:

- known numerical examples;
- minimum meaningful amounts;
- non-divisible values;
- six-decimal inputs;
- rounded-down interest;
- exact balances of owner, SavingCore, VaultManager, and fee receiver;
- token conservation.

---

## 19. ERC20 Token Behavior

## 19.1 MockUSDC Scope

MockUSDC is a six-decimal test token with public minting for demonstration.

It is not production-safe.

## 19.2 Approval Risk

Users may accidentally grant unlimited approval.

The frontend should request the exact amount needed for one deposit by default.

The contract cannot stop a user from approving more through another interface, so this is partly a UX risk.

## 19.3 Transfer Failures

Deposit opening must safely handle:

- insufficient allowance;
- insufficient balance;
- token revert;
- false return value;
- unexpected token behavior.

## 19.4 SafeERC20

SafeBank uses `SafeERC20` for implemented ERC20 token interactions.

This improves compatibility but does not make every malicious ERC20 economically safe.

## 19.5 Fee-on-Transfer and Rebasing Tokens

The project is designed for MockUSDC.

It does not currently support:

- fee-on-transfer tokens;
- rebasing tokens;
- tokens whose balance changes independently;
- tokens with unusual callback behavior.

If a different token is introduced, the accounting model must be reviewed.

## 19.6 Required Tests

Tests must include:

- insufficient balance;
- insufficient allowance;
- transfer revert;
- false-return token mock if practical;
- rollback after failed transfer.

---

## 20. Vault Insolvency and Interest Shortfall

## 20.1 Base-Spec Risk

The original base specification may require maturity withdrawal to revert when the vault lacks interest.

That can prevent principal recovery even though SavingCore still holds the principal.

## 20.2 Bonus C1 Response

Phase 11 implements principal-first settlement for the specific case where
VaultManager reports insufficient liquidity through
`InsufficientVaultBalance`.

The maturity path now:

- returns principal from `SavingCore`;
- changes the deposit to terminal `Withdrawn` status;
- records the full unpaid calculated interest in
  `pendingInterest[depositId]`;
- snapshots the direct current NFT owner in
  `interestClaimant[depositId]`;
- emits `InterestDeferred`;
- permits a later full-value claim through
  `claimPendingInterest(depositId)`.

The implementation is full-or-defer:

- it does not attempt a partial interest payment;
- the claimant cannot choose a different recipient;
- an approved ERC721 operator does not inherit claim authority;
- transferring the historical NFT after settlement does not transfer the
  pending claim.

`claimPendingInterest` clears the pending amount before calling VaultManager.
If payout fails, EVM rollback restores the pending debt.

C1 does not guarantee immediate interest payment. It prevents insufficient
interest liquidity from being the sole reason depositor principal remains
locked.

Paused, unauthorized, malformed, empty-revert, and other non-liquidity
VaultManager failures continue to revert the complete maturity transaction.

## 20.3 Renewal Shortfall
Manual or auto-renew requires funded interest to create a new compounded principal.

If the vault lacks interest:

- renewal may revert;
- unpaid interest must not be added to principal;
- the old deposit remains active;
- the owner may choose another valid action.

## 20.4 Bonus C2 Response

Phase 12 implements aggregate reserved-interest accounting.

`SavingCore` records liabilities, while VaultManager:

- reads the aggregate from the authorized SavingCore;
- reports available liquidity;
- reports funding shortfall;
- blocks owner withdrawal above available liquidity.

C2 does not require full collateral before every deposit opens. A new deposit
may increase shortfall, but the liability remains visible and the owner cannot
withdraw reserved liquidity.

## 20.5 Residual Insolvency Risk

The vault may remain underfunded because:

- the administrator has not supplied enough liquidity;
- liabilities grew faster than funding;
- configuration was incorrect;
- expected deposits created large interest obligations.

The UI and AI Risk Assistant must display the shortfall rather than hiding it.

---

## 20.6 Phase 12 Withdrawal, Renewal, C1, and C2 Security Evidence

Phase 12 retains all validated withdrawal, renewal, and C1 controls and adds
C2 reserve and withdrawal-containment controls.

### 20.6.1 Lifecycle and Authorization

Every owner-restricted action uses the direct current NFT owner. Auto-renew
remains permissionless but cannot redirect the new certificate.

Only an `Active` deposit may reach a terminal state.

### 20.6.2 Reserve Creation and Isolation

A positive-interest deposit opening creates one aggregate reservation using
snapshotted principal, APR, and tenor.

Zero-rounded interest creates no reservation.

Later plan updates, plan disabling, and NFT transfers do not change an
existing deposit's expected-interest reserve.

### 20.6.3 Reserve Release, Consumption, and Deferral

- early withdrawal releases the full unused old-term reserve;
- funded maturity consumes the reserve;
- C1 deferral preserves it;
- successful pending claim consumes it;
- failed claim restores pending debt and reserve by EVM rollback.

### 20.6.4 Renewal Replacement

Manual and auto-renew atomically:

1. consume the old positive-interest reserve;
2. create the new term's positive expected-interest reserve;
3. obtain funded interest from VaultManager when required;
4. safely mint the renewed certificate.

Any later failure restores the complete old accounting state.

### 20.6.5 Vault Solvency Reads

VaultManager exposes:

- actual token balance;
- total reserved interest;
- available liquidity;
- funding shortfall.

Both subtraction directions are saturating.

Before SavingCore authorization, the reserve getter returns zero.

### 20.6.6 Administrator Withdrawal Protection

Owner withdrawal is limited to available liquidity.

Validated cases include:

- balance greater than reserve;
- balance equal to reserve;
- reserve greater than balance;
- exact available withdrawal;
- one unit above available;
- later funding;
- direct ERC20 transfer.

### 20.6.7 Invariant and Rollback Protection

`InsufficientReservedInterest` protects internal aggregate reductions.

A test-only harness reaches this otherwise inaccessible defensive branch. The
harness is excluded from production ABIs and architecture.

### 20.6.8 Verified Phase 12 Evidence

Verified results:

- 185 SavingCore tests;
- 55 VaultManager tests;
- 13 MockUSDC tests;
- 253 tests across the complete project;
- 100% statements, branches, functions, and lines for SavingCore;
- 100% statements, functions, and lines for VaultManager;
- production-contract coverage of 100% statements, 98.40% branches,
  100% functions, and 100% lines;
- complete project coverage of 99.11% statements, 97.17% branches,
  96.97% functions, and 96.98% lines;
- SavingCore deployed bytecode approximately `12.654 KiB`;
- SavingCore initcode approximately `13.905 KiB`;
- VaultManager deployed bytecode approximately `3.483 KiB`;
- VaultManager initcode approximately `3.897 KiB`.

Residual risks still include:

- compromised administrator ownership;
- incorrect one-time dependency configuration;
- insufficient bank funding;
- unsupported or malicious ERC20 behavior outside tested assumptions;
- timestamp and transaction-ordering limitations;
- frontend, RPC, wallet, deployment, and operational failures;
- absence of an independent professional audit.

Passing tests and full core line coverage reduce identified risk but do not
constitute an independent audit or a guarantee of security.

## 21. C1 Security Requirements

C1 was implemented and validated in Phase 11.

The implemented controls include:

- current-owner claimant snapshot at deferred maturity settlement;
- terminal deposit status;
- full-value pending debt;
- claimant-only later claim;
- debt clearing before interaction;
- EVM rollback after failed payout;
- double-settlement and double-claim rejection;
- NFT-transfer isolation after claimant snapshot.

## 21.1 Claimant Snapshot

At maturity settlement, the current NFT owner must be recorded as the claimant.

Later NFT transfers must not change this debt ownership.

## 21.2 State Transition

A deposit settled under C1 becomes terminal.

It must not later be renewed.

## 21.3 Payment Ordering

The final implementation must ensure:

- principal is paid once;
- pending interest is recorded once;
- a claim clears or marks the debt before a risky external interaction;
- a failed transfer rolls back the claim state.

## 21.4 Claim Authorization

Only the snapshotted claimant may claim.

## 21.5 Required Tests

Tests must cover:

- vault fully funded;
- vault underfunded;
- principal returned while interest deferred;
- correct claimant;
- NFT transfer after settlement;
- wrong claimant rejection;
- claim after funding;
- claim twice;
- claim while paused;
- payout failure rollback.

---

## 22. C2 Security Requirements

C2 was implemented and validated in Phase 12.

### 22.1 Reservation Creation

A new active deposit creates one reservation when expected interest is
positive. Zero-rounded interest creates none.

### 22.2 Reservation Release

Early withdrawal releases the complete old-term reservation.

### 22.3 Reservation Consumption

Funded maturity payout and successful pending-interest claim consume the
relevant reservation.

### 22.4 Deferred Interest

C1 deferred interest remains reserved until a successful later claim.

### 22.5 Renewal Transition

Manual and auto-renew atomically consume the old reservation and create the new
term's reservation.

### 22.6 Available Liquidity and Shortfall

Available liquidity is:

`max(vaultBalance - totalReservedInterest, 0)`

Funding shortfall is:

`max(totalReservedInterest - vaultBalance, 0)`

### 22.7 Administrator Withdrawal

Administrator withdrawal cannot exceed available liquidity.

### 22.8 Validated Tests

Tests cover:

- positive and zero reservation;
- open rollback;
- early release;
- funded maturity consumption;
- C1 deferral and claim;
- failed-claim rollback;
- manual and auto-renew replacement;
- failed-renew rollback;
- undercollateralization;
- exact and excessive withdrawal;
- reserve-underflow invariant.

## 22.1 Reservation Creation

A new active deposit creates one expected-interest reservation.

## 22.2 Reservation Release

Early withdrawal releases the reservation because no interest is owed.

## 22.3 Reservation Consumption

Maturity payout consumes the reservation.

## 22.4 Renewal Transition

Renewal:

- consumes the old reservation;
- creates a reservation for the new term.

## 22.5 Available Liquidity

Available liquidity is:

`max(vaultBalance - totalReservedInterest, 0)`

## 22.6 Administrator Withdrawal

Administrator withdrawal must not exceed available liquidity.

## 22.7 Required Tests

Tests must cover:

- reservation on open;
- release on early withdrawal;
- consumption at maturity;
- manual-renew transition;
- auto-renew transition;
- undercollateralized vault;
- zero available liquidity;
- exact available withdrawal;
- withdrawal one unit above available liquidity;
- release twice;
- consume twice;
- reserve accounting after reverted operations.

---

## 23. Pause Security

## 23.1 Purpose

Pause is an emergency containment tool.

It can reduce additional damage while the administrator investigates.

## 23.2 Planned Blocked Actions

When paused, the project intends to block:

- open deposit;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claim;
- interest payout.

## 23.3 Administrative Actions

The administrator may still need to:

- unpause;
- inspect balances and liabilities;
- perform narrowly defined emergency configuration.

No emergency action may arbitrarily seize user principal.

## 23.4 Limitations

Pause cannot:

- reverse completed transfers;
- recover a stolen admin key;
- automatically fund interest debt;
- correct a bad deployment;
- stop direct NFT transfers unless ERC721 transfer hooks are deliberately restricted;
- guarantee all users see the pause immediately.

## 23.5 Required Tests

Each blocked entry point must be tested individually.

One pause test on one function is not sufficient.

---

## 24. Administrator Key Compromise

## 24.1 Threat

A compromised administrator may attempt to:

- create abusive plans;
- change APR for future users;
- disable plans;
- withdraw vault liquidity;
- redirect penalties;
- pause the system;
- authorize a malicious SavingCore if replacement is possible.

## 24.2 On-Chain Mitigations

Planned mitigations include:

- `Ownable2Step`;
- C2 withdrawal limits;
- zero-address validation;
- events;
- restricted authorization configuration;
- separation of principal and interest;
- inability to rewrite existing deposit snapshots;
- no arbitrary administrator function for editing active deposits.

## 24.3 Operational Mitigations

Recommended operational practices include:

- use a dedicated testnet deployment wallet;
- do not reuse personal wallets;
- store secrets outside Git;
- use a hardware wallet or multisig in any production-like extension;
- monitor ownership and vault events;
- rotate compromised external API keys;
- pause only when the admin key remains trusted;
- prepare a documented incident response.

## 24.4 Residual Risk

The capstone currently uses a centralized administrator model.

It does not provide full decentralized governance.

---

## 25. Bot Liveness and Permissionless Auto-Renew

## 25.1 Threat

The bank-operated bot may:

- go offline;
- run late;
- submit a transaction with insufficient gas;
- use the wrong network;
- use a stale contract address;
- fail due to RPC outage.

## 25.2 Design Response

Auto-renew is permissionless.

Therefore:

- the owner can trigger it;
- another account can trigger it;
- bot failure does not transfer ownership;
- bot failure does not remove principal;
- the owner can still withdraw if the deposit remains active.

## 25.3 No Retroactive Multiple Terms

A bot being offline for one month does not automatically create multiple renewal periods or multiple interest payments.

Only successful transactions change state.

## 25.4 Bot Key Security

The bot must not use the administrator key unless strictly necessary.

Because auto-renew is permissionless, it should use a low-privilege operational wallet.

---

## 26. Front-Running and Transaction Ordering

## 26.1 Competing Terminal Transactions

After grace, two valid actions may compete:

- owner maturity withdrawal;
- permissionless auto-renew.

The first mined successful transaction determines the state.

## 26.2 NFT Transfer Race

A transfer may be mined before or after a withdrawal transaction.

Authorization is evaluated against the current on-chain owner at execution time.

A transaction prepared by the previous owner may revert if ownership changed first.

## 26.3 Approval Race

Changing an existing ERC20 allowance can create known approval-race concerns.

The frontend should prefer:

- exact-amount approval;
- clear current-allowance display;
- avoiding unnecessary allowance modification.

## 26.4 Accepted Limitation

SafeBank does not guarantee transaction ordering.

It guarantees that only one conflicting terminal transition succeeds.

---

## 27. Frontend Security

## 27.1 Private Keys

The frontend must never:

- request a private key;
- request a seed phrase;
- store private keys;
- sign on behalf of the user;
- transmit wallet secrets to a backend or AI service.

## 27.2 Network Validation

Before transaction preparation, the frontend must verify:

- expected chain ID;
- supported network;
- configured contract address;
- deployed bytecode presence where practical.

## 27.3 Contract Validation

The frontend should display:

- shortened and expandable contract address;
- current network;
- links to a block explorer;
- a warning when configuration is missing or mismatched.

## 27.4 Approval UX

The frontend should:

- request exact approval;
- show token and spender;
- show amount;
- distinguish approval from deposit opening;
- avoid default unlimited approval.

## 27.5 Transaction Confirmation

Before asking the wallet to sign, display:

- action name;
- plan;
- principal;
- expected interest;
- expected penalty where relevant;
- recipient;
- maturity;
- network;
- contract address.

## 27.6 Transaction Lifecycle

The frontend must handle:

- waiting for wallet;
- user rejection;
- submitted;
- confirming;
- success;
- revert;
- RPC failure;
- replaced transaction;
- dropped transaction where detectable.

## 27.7 Untrusted Content

The frontend must not inject untrusted contract, event, or AI content using unsafe HTML.

Avoid `dangerouslySetInnerHTML` for untrusted values.

## 27.8 Admin Route Guard

Admin route guards only improve UX.

Solidity access control is authoritative.

## 27.9 Test Token Warning

The frontend must clearly state:

- MockUSDC is a test token;
- it has no real monetary value;
- SafeBank is an educational capstone.

---

## 28. Assistant Security

## 28.1 Implemented Boundary

The Banking and Risk Assistants are deterministic, read-only explanation
engines.

They may:

- explain verified plan and deposit context;
- explain maturity, renewal, penalty, and pending-interest rules;
- explain vault balance, reserve, liquidity, shortfall, pause state, ownership,
  and contract relationships;
- provide cautions and suggested next review steps.

They may not:

- request or hold private keys or seed phrases;
- connect a wallet;
- obtain a signer;
- access transaction hooks or write clients;
- sign or submit transactions;
- approve, deposit, withdraw, renew, claim, fund, pause, or change plans;
- fabricate an authoritative balance, APR, maturity, claimant, or liability;
- claim guaranteed return, complete safety, or professional audit assurance.

## 28.2 Structured Context

Assistant factual input comes from dashboard data already produced by verified
frontend read layers.

Context builders:

- format bigint values deterministically;
- create JSON-serializable objects;
- exclude provider, signer, contract, and transaction objects.

The assistant does not perform an additional contract read or network request.

## 28.3 Input Safety

Input handling:

- normalizes whitespace;
- rejects empty questions;
- limits questions to 500 characters;
- removes or rejects control characters;
- rejects external URLs;
- revalidates input at the engine boundary.

## 28.4 Output Safety

Assistant output:

- is rendered as ordinary React text;
- is not injected as raw HTML;
- contains fact, explanation, caution, and next-step sections;
- uses safe localized fallback text when processing fails;
- supports cancellation and stale-response protection.

## 28.5 External-Network Boundary

The assistant engines do not call OpenAI, Gemini, another LLM, or an external
AI API.

The Spline iframe is the only Phase 18 external visual dependency. It renders
the robot launcher but does not receive assistant questions or structured
SafeBank context from the assistant engine.

## 28.6 Failure Isolation

If the assistant or Spline scene fails:

- contract data remains visible;
- user and administrator financial functions remain available;
- deterministic transaction validation remains available;
- no contract state changes;
- no wallet action occurs.

## 28.7 Validation Evidence

The Phase 18 checkpoint reports:

- 65 passing frontend test files;
- 256 passing frontend tests;
- successful lint, TypeScript validation, and production build;
- no assistant signer, transaction, or write-layer access;
- no external-network calls from assistant engines;
- tested validation, loading, fallback, cancellation, and plain-text rendering.

## 29. Secret Management

## 29.1 Current Environment Variables

The project currently defines:

- `REPORT_GAS`;
- `TESTNET_PRIVATE_KEY`;
- `MAINNET_PRIVATE_KEY`;
- `ETHERSCAN_API_KEY`.

## 29.2 Repository Rules

The repository must not contain:

- `.env`;
- private keys;
- seed phrases;
- API keys;
- generated wallet files;
- copied terminal output containing secrets.

## 29.3 Frontend Rules

Frontend environment variables bundled into browser code are public.

No secret may be placed in client-exposed variables.

## 29.4 Deployment Rules

When deploying:

- the user enters secrets locally;
- commands may check whether a variable exists;
- commands must not print the full secret;
- logs should show only masked presence when needed;
- deployment output may show public addresses and transaction hashes.

## 29.5 Git Checks

Before commits, the project should inspect:

- `git status`;
- `git diff`;
- staged changes;
- unexpected key-like strings;
- whether `.env` is tracked.

---

## 30. Deployment Security

## 30.1 Implemented Local Network Guard

Every Phase 13 deploy and seed script accepts only:

- `hardhat`;
- `localhost`.

The runtime chain ID must equal `31337`.

A network-name or chain-ID mismatch causes the script to fail before the
deployment is treated as valid.

This guard prevents accidental use of the Phase 13 local seed workflow on
Sepolia, mainnet, or another configured network.

## 30.2 Deterministic Role Separation

The local role model separates:

- deployer and administrator;
- fee receiver;
- demo user one;
- demo user two;
- permissionless keeper.

The administrator and fee receiver are different accounts.

The keeper is intentionally low privilege because permissionless auto-renew
does not require the administrator key.

These are local development accounts only.

## 30.3 Dependency and Bytecode Verification

The workflow verifies:

- nonempty deployed bytecode for all three contracts;
- MockUSDC metadata and six decimals;
- VaultManager token, owner, pending owner, fee receiver, and pause state;
- SavingCore token, vault, owner, pending owner, pause state, and Personal
  Variant constants;
- one-time SavingCore authorization;
- canonical plan contents;
- demo balances;
- vault balance;
- C2 reserve, available-liquidity, and shortfall formulas.

A mismatched dependency or unexpected authorization causes failure.

## 30.4 Authorization Ordering

VaultManager reports zero reserved interest before SavingCore authorization.

Therefore, Phase 13 treats one-time authorization as a required deployment
step before operational seed verification completes.

The seed verifies authorization before accepting the deployment as ready.

## 30.5 Idempotent Seed Controls

Persistent localhost reruns:

- reuse matching deployments;
- skip duplicate authorization;
- create the canonical plan only when no plan exists;
- mint only balance deltas below deterministic user targets;
- fund only the delta below the exact vault target;
- fail when the vault balance exceeds the expected target.

The workflow does not silently overwrite drift.

The base seed creates no deposits.

## 30.6 Deployment Record and ABI Policy

Generated local deployment records remain ignored:

- `deployments/hardhat/`;
- `deployments/localhost/`.

They may contain useful local metadata but are not stable public deployment
configuration.

The ABI exporter retains exactly:

- MockUSDC;
- VaultManager;
- SavingCore.

Test mocks and internal interfaces are excluded from production ABI output.

## 30.7 Verification Script

`scripts/verify-local-deployment.ts` is read-only.

It checks current deployment records and on-chain state without sending a
transaction.

It emits a structured JSON summary containing public local addresses, roles,
plan and deposit counters, user balances, and C2 metrics.

## 30.8 Non-Upgradeable Model

SafeBank uses ordinary non-upgradeable deployments.

A deployed bug requires a new contract deployment and configuration rather than
an in-place upgrade.

## 30.9 Public Testnet Status

Phase 14 deployed SafeBank to Ethereum Sepolia, chain ID `11155111`.

The dedicated public workflow requires:

- exactly one configured signer;
- expected deployer
  `0xA998526b0A5F23680f50fa3677f5c6576Dba89d9`;
- nonzero SepoliaETH balance;
- exact constructor dependencies;
- expected ownership and fee receiver;
- zero pending owner;
- unpaused contracts;
- correct one-time SavingCore authorization;
- correct Personal Variant and canonical plan;
- empty initial public operational state.

Five public receipts succeeded: three deployments, authorization, and
canonical-plan creation.

The public deployment intentionally created no demo mint, vault funding, or
deposit.

A rerun reused the existing contracts and sent no transaction.

Public records and compact metadata were audited for expected addresses,
transaction hashes, blocks, constructor arguments, ABI, bytecode, and
secret-related fields.

All three production contracts were source-verified on Etherscan. Verification
establishes source-to-bytecode transparency; it does not replace a professional
audit.

Residual public-deployment risks include administrator-key compromise,
insufficient future vault funding, RPC or explorer outage, frontend or future
product-layer misconfiguration, non-upgradeable redeployment cost, and absence
of multisig administration.

## 31. Event and Audit Security

## 31.1 Purpose

Events support:

- user transaction history;
- administrator audit;
- monitoring;
- incident investigation;
- frontend status updates;
- reserve and pending-interest analysis.

## 31.2 Sensitive Events

The project should emit events for:

- plan creation and update;
- plan enable and disable;
- deposit opening;
- withdrawal;
- renewal;
- vault funding;
- vault withdrawal;
- fee receiver change;
- pause and unpause;
- SavingCore authorization;
- interest payout;
- interest deferral;
- pending-interest claim;
- reserve creation and release.

## 31.3 Event Limitations

Events are not authorization.

Events do not replace storage for critical state.

A frontend should verify final contract state rather than trusting one event alone.

---

## 32. Denial-of-Service Considerations

Potential denial-of-service conditions include:

- paused system;
- underfunded vault;
- malicious or broken token;
- lost administrator key;
- invalid authorized SavingCore;
- gas-heavy loops;
- unbounded enumeration;
- frontend RPC outage;
- bot outage.

Planned design responses include:

- avoid unbounded loops in financial functions;
- prefer direct mappings;
- keep auto-renew permissionless;
- preserve maturity withdrawal after grace;
- preserve the implemented C1 principal-recovery guarantees;
- maintain frontend RPC error states;
- avoid dependence on AI for transactions.

The choice between `ERC721` and `ERC721Enumerable` must consider enumeration gas cost.

---

## 33. Input Validation

The final implementation must validate at least:

- zero token address;
- zero vault address;
- zero fee receiver;
- zero SavingCore authorization;
- zero amount;
- invalid plan ID;
- invalid deposit ID;
- disabled plan;
- invalid APR;
- invalid tenor;
- invalid penalty;
- min greater than max;
- amount below min;
- amount above max;
- non-owner action;
- non-admin action;
- wrong timestamp window;
- non-active status;
- insufficient vault liquidity;
- withdrawal over available liquidity;
- no pending interest;
- wrong claimant.

Validation should use custom errors where practical to:

- reduce gas;
- make tests precise;
- improve frontend error mapping.

Exact custom-error names remain to be designed.

---

## 34. Safe Coding Practices

The planned Solidity coding practices include:

- explicit visibility;
- immutable addresses where appropriate;
- constants for basis-point denominator and day length;
- no unexplained magic numbers;
- custom errors;
- NatSpec documentation;
- checks-effects-interactions;
- `SafeERC20`;
- `ReentrancyGuard`;
- `Ownable2Step`;
- `Pausable`;
- explicit status enum;
- small internal calculation functions;
- no silent ignored return values;
- event emission after successful actions;
- no unrestricted arbitrary token withdrawal;
- no arbitrary active-deposit editing;
- no `tx.origin` authorization;
- no private-key logic;
- no unnecessary inline assembly;
- no unchecked arithmetic without documented proof.

---

## 35. Security Test Plan

Security testing is added incrementally with each implementation phase. Phase 6 includes deposit validation, exact maturity boundaries, direct current-owner authorization, approved-operator rejection, snapshot integrity, underfunded and paused-vault rollback, double-withdraw prevention, and callback reentrancy tests.

## 35.1 Access-Control Tests

Test:

- non-owner plan creation;
- non-owner APR update;
- non-owner plan enable and disable;
- non-owner pause and unpause;
- non-owner vault withdrawal;
- arbitrary caller payout request;
- wrong SavingCore authorization.

## 35.2 Deposit-Validation Tests

Test:

- invalid plan;
- disabled plan;
- zero amount;
- below min;
- above max;
- insufficient allowance;
- insufficient balance;
- token transfer failure.

## 35.3 Ownership Tests

Test:

- original depositor ownership;
- NFT transfer;
- current owner action;
- old owner rejection;
- unrelated account rejection;
- renewed NFT recipient.

## 35.4 State-Machine Tests

Test:

- double maturity withdrawal;
- double early withdrawal;
- double manual renewal;
- double auto-renew;
- withdraw after manual renewal;
- withdraw after auto-renew;
- renew after withdrawal;
- invalid deposit.

## 35.5 Boundary Tests

Test:

- one second before maturity;
- exact maturity;
- one second after maturity;
- one second before grace end;
- exact grace end;
- one second after grace end;
- withdrawal after grace before auto-renew.

## 35.6 Financial Tests

Test:

- exact APR;
- exact penalty;
- APR snapshot;
- penalty snapshot;
- six-decimal amounts;
- rounding dust;
- token conservation;
- future plan update isolation.

## 35.7 Vault Tests

Test:

- fund;
- authorized payout;
- unauthorized payout;
- administrator withdrawal;
- insufficient interest;
- zero address;
- fee receiver update;
- pause behavior.

## 35.8 Reentrancy Tests

Test malicious attempts against:

- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claim;
- vault payout.

## 35.9 C1 Tests

Test:

- funded maturity;
- underfunded maturity;
- principal-first settlement;
- claimant snapshot;
- transfer after settlement;
- later claim;
- claim twice;
- wrong claimant;
- claim during pause;
- failed payout rollback.

## 35.10 C2 Tests

Test:

- reserve creation;
- reserve release;
- reserve consumption;
- renewal reserve transition;
- undercollateralization;
- available liquidity;
- exact allowed withdrawal;
- over-withdrawal;
- repeated release;
- accounting after revert.

## 35.11 Frontend Security Tests

Later frontend tests should cover:

- unsupported network;
- missing contract;
- wrong contract address;
- rejected wallet request;
- reverted transaction;
- replaced transaction;
- stale ownership;
- approval confirmation;
- NFT-transfer warning;
- test-token warning;
- admin-route bypass does not affect Solidity authorization.

## 35.12 AI Security Tests

Later AI tests should cover:

- missing AI provider;
- malformed response;
- no contract data;
- prompt injection attempt;
- refusal to process secrets;
- deterministic fallback;
- no automatic transaction submission.

---

## 36. Coverage Interpretation

The final capstone requires coverage above 90%.

The internal targets are:

- statements above 95%;
- lines above 95%;
- functions near 100%;
- branches above 90%.

Coverage is not equivalent to security.

A test may execute a line without proving the absence of an exploit.

The Phase 0 coverage table showed 100% only because there were no Solidity contracts.

That report must never be presented as real project coverage.

Coverage must be measured again after implementation.

---

## 37. Manual Security Review Checklist

Before each contract-related commit, review:

- Are all privileged functions protected?
- Are all critical addresses validated?
- Is the deposit existence check explicit?
- Is status checked before settlement?
- Is current NFT ownership checked?
- Are exact time boundaries correct?
- Are state effects applied before external interactions?
- Can an external failure leave partial state?
- Can a deposit be processed twice?
- Can the vault pay an arbitrary recipient?
- Can the administrator access user principal?
- Can plan updates alter old deposits?
- Can renewal create unfunded principal?
- Does pause cover every intended operation?
- Are events emitted only after successful state changes?
- Do token balances reconcile?
- Are C1 claimant and C2 reserve transitions correct?
- Are secrets absent from changes?

---

## 38. Incident Response Considerations

SafeBank is an educational project, but it should still define an incident-response approach.

## 38.1 Detection

Potential warning signs include:

- unexpected vault withdrawal;
- unauthorized ownership event;
- unexplained reserve mismatch;
- repeated failed payouts;
- contract address mismatch;
- unusual pause action;
- compromised deployment wallet;
- frontend serving wrong addresses.

## 38.2 Immediate Response

Possible actions include:

1. stop frontend transaction prompts;
2. verify the deployed contract and network;
3. inspect on-chain events;
4. pause affected operations when the trusted administrator can safely do so;
5. stop the auto-renew bot;
6. preserve transaction hashes and logs;
7. warn demo users;
8. rotate compromised off-chain API keys;
9. prepare a corrected deployment if required.

## 38.3 Limitations

Because contracts are non-upgradeable:

- deployed code cannot be patched in place;
- some incidents may require redeployment;
- user migration may require a separately designed process;
- pause cannot reverse prior transactions.

## 38.4 Post-Incident Review

Document:

- root cause;
- affected asset;
- attack path;
- failed control;
- corrective code change;
- new regression test;
- documentation update;
- redeployment details.

---

## 39. Residual Risks

Even after planned controls, residual risks remain.

### 39.1 Centralized Administrator

A privileged administrator remains a governance and key-management risk.

### 39.2 Underfunded Interest

C1 protects principal but does not guarantee immediate interest availability.

### 39.3 Permissionless Transaction Ordering

A bot may auto-renew before an owner's competing withdrawal transaction is mined.

### 39.4 Timestamp Approximation

Block time is not an exact legal clock.

### 39.5 Mock Token Limitations

MockUSDC does not represent production USDC behavior, legal claims, or real value.

### 39.6 Non-Upgradeable Deployment

A serious bug requires redeployment rather than an in-place upgrade.

### 39.7 Frontend Compromise

A compromised frontend may display false information or prepare malicious transactions.

The wallet confirmation and verified contract address remain important.

### 39.8 AI Error

AI may misunderstand a question or return incorrect text.

It must remain advisory.

### 39.9 User Key Compromise

The contracts cannot recover funds or rights lost through a compromised user wallet under the current design.

### 39.10 Unreviewed Dependency Risk

Hardhat and related tooling currently report audit warnings.

These warnings must be assessed without force-upgrading incompatible packages.

---

## 40. Known Limitations

The current design does not yet include:

- multisig administration;
- timelocked admin operations;
- decentralized governance;
- formal verification;
- third-party audit;
- production-grade oracle integration;
- real USDC support;
- KYC or regulatory controls;
- key recovery;
- cross-chain protection;
- upgradeable emergency patching;
- guaranteed auto-renew execution;
- guaranteed immediate interest payment;
- production incident monitoring.

These limitations must be stated honestly in the final documentation.

---

## 41. Security Non-Goals

SafeBank does not attempt to:

- prove mathematical absence of all bugs;
- secure a real banking institution;
- guarantee legal repayment;
- protect users who reveal their seed phrase;
- recover compromised wallet accounts;
- support every ERC20 token;
- hide on-chain financial data;
- prevent all transaction front-running;
- guarantee bot uptime;
- make AI authoritative;
- replace a professional external audit.

---

## 42. Security Decision Status

Resolved and implemented through Phase 13:

1. Basic `ERC721` is used without `ERC721Enumerable`.
2. APR, tenor, and penalty validation bounds are fixed.
3. VaultManager uses one-time authorization of a deployed SavingCore-compatible contract.
4. SavingCore authorization cannot be replaced.
5. SavingCore and VaultManager use independent pause states.
6. Deposit certificates use safe minting.
7. Deposit opening and maturity withdrawal use `SafeERC20` and `nonReentrant`.
8. Current custom errors and constructor dependencies are defined.
9. Only the direct current NFT owner may execute maturity withdrawal.
10. Approved ERC721 operators cannot execute maturity withdrawal.
11. Exact maturity and post-grace withdrawal behavior is enforced.
12. Maturity settlement uses immutable deposit snapshots.
13. Failed VaultManager payouts atomically restore status and token balances.
14. Completed deposit NFTs remain historical certificates.
15. Manual renewal is valid only within the exact half-open grace interval.
16. Only the direct current certificate owner may manually renew.
17. Approved ERC721 operators cannot manually renew.
18. Old-term renewal interest uses immutable old-deposit snapshots.
19. The selected enabled plan supplies the renewed deposit terms.
20. Positive renewal interest must be physically funded by VaultManager.
21. Zero-rounded renewal interest skips the VaultManager payout.
22. Successful renewal changes the old status to `ManualRenewed`.
23. Successful renewal retains the old NFT and safely mints a new NFT.
24. Renewal failure restores old state, token balances, and NFT state.
25. ERC20 and ERC721 renewal callbacks are protected by `nonReentrant`.
26. `autoRenew(depositId)` is permissionless.
27. Auto-renew is rejected before the grace-period end with
    `AutoRenewalTooEarly`.
28. Auto-renew is valid at the exact grace-period end and later while the
    old deposit remains `Active`.
29. The new certificate is minted to the current owner of the old
    certificate, not to the transaction caller.
30. Auto-renew preserves the old plan ID, tenor, APR, and penalty
    snapshots.
31. Current plan APR, enabled state, minimum, and maximum cannot alter an
    existing deposit's auto-renew execution.
32. Delayed auto-renew creates exactly one new term and pays exactly one
    old term of interest.
33. The new term starts at the successful execution timestamp.
34. Positive interest must be fully transferred from VaultManager before
    it remains part of the new principal.
35. Zero-rounded interest skips the VaultManager payout.
36. Successful auto-renew changes the old status to `AutoRenewed` and
    creates one new `Active` deposit.
37. Underfunding, authorization failure, paused positive-interest payout,
    and failed safe mint revert the complete transaction.
38. ERC20 and ERC721 auto-renew callbacks are protected by
    `nonReentrant`.
39. After grace, maturity withdrawal and auto-renew follow
    first-successfully-mined terminal-action ordering.
40. SavingCore records one aggregate reserve for positive expected and pending
    interest liabilities.
41. Early withdrawal releases the old reservation.
42. Funded maturity and successful pending claims consume reserve.
43. C1 deferred interest remains reserved until paid.
44. Manual and auto-renew atomically replace old and new reserves.
45. VaultManager reads reserve only from the one-time authorized SavingCore.
46. Available liquidity and funding shortfall use saturating subtraction.
47. Owner withdrawal cannot exceed available liquidity.
48. Reserve reductions are protected by an explicit underflow invariant.

Still unresolved or deferred:

1. Rich NFT metadata and external token-URI presentation.
2. Final emergency-administrator policy beyond current owner and pause controls.
3. Multisig recommendations for production use.
4. Frontend framework and wallet library.
5. AI provider and server-side secret handling.

Deferred security decisions must be finalized before their related implementation phases.

---

## 43. Phase 12 Security Status

Completed and validated locally:

- access control, dependency validation, and independent pause controls;
- SafeERC20 token movement and callback reentrancy protection;
- immutable plan and deposit snapshots;
- exact lifecycle boundaries and terminal-action exclusion;
- maturity, early withdrawal, manual renewal, and auto-renew;
- C1 principal-first settlement and claimant-only pending claims;
- C2 aggregate reserve creation, release, consumption, and renewal
  replacement;
- C2 deferred-interest reserve preservation;
- C2 undercollateralization visibility;
- C2 available-liquidity withdrawal limits;
- reserve-underflow protection;
- atomic rollback across token, vault, and safe-mint failures;
- 185 SavingCore tests;
- 55 VaultManager tests;
- 253 full-suite tests;
- 100% statements, branches, functions, and lines for SavingCore;
- 100% statements, functions, and lines for VaultManager;
- core production contracts at 100% statements, functions, and lines.

Not completed:

- deployment verification;
- frontend security implementation;
- AI security implementation;
- professional external audit.

This is a security model and implementation record, not an audit report.

## 44. Final Security Position

SafeBank is designed around the following security priorities:

1. isolate user principal from bank-funded interest;
2. enforce current NFT ownership;
3. permit only one terminal deposit transition;
4. preserve snapshotted financial terms;
5. use defense-in-depth around external calls;
6. restrict administrative actions on-chain;
7. define exact timestamp boundaries;
8. return principal before deferring interest after C1;
9. prevent withdrawal of reserved liquidity under the implemented C2 model;
10. keep frontend and AI outside the security boundary;
11. protect secrets and deployment configuration;
12. validate every claim through code and tests.

The project will only describe a control as implemented after the corresponding code has been written, tested, reviewed, committed, and verified in its designated phase.

## 43. Phase 13 Local Deployment Security Evidence

Validated evidence includes:

- successful ephemeral Hardhat deployment and seed;
- successful persistent localhost reset deployment;
- successful persistent localhost rerun with reused contracts;
- one-time authorization skipped safely on rerun;
- no duplicate plan, user funding, or vault funding;
- two successful read-only verification runs;
- three contracts with nonempty bytecode;
- exact constructor relationships and owner configuration;
- fee receiver distinct from the administrator;
- chain ID `31337`;
- canonical plan ID `1`;
- deterministic demo balances;
- vault target `25,000` mUSDC;
- zero initial reserve and shortfall;
- five deployment regression tests;
- 258 complete project tests;
- production coverage of 100% statements, 98.40% branches, 100% functions,
  and 100% lines;
- exactly three retained production ABI files;
- ignored local deployment records;
- cleaned temporary local-node logs;
- no Sepolia transaction, address, or verification claim.

Residual deployment risks include:

- misuse of deterministic local keys outside local development;
- a future public deployment with incorrect secrets or network selection;
- incorrect external RPC responses;
- administrator-key compromise;
- non-upgradeable redeployment cost;
- absence of an independent professional audit.

The Phase 13 workflow reduces local configuration risk but does not replace
public-testnet review or professional deployment operations.

## 45. Phase 14 Sepolia Deployment Security Evidence

Observed results:

- chain ID `11155111`;
- deployer, owner, and fee receiver
  `0xA998526b0A5F23680f50fa3677f5c6576Dba89d9`;
- one configured signer;
- five successful receipts;
- nonempty bytecode for all three contracts;
- correct token, vault, owner, fee receiver, and authorization relationships;
- zero pending owner;
- both production contracts unpaused;
- correct 2-day grace period, 180-day tenor, 200-bps APR, and 750-bps penalty;
- canonical plan ID `1`;
- zero deposits, vault balance, reserve, available liquidity, and shortfall;
- no demo mint, funding, or default deposits;
- idempotent rerun with nonce and balance unchanged;
- deployment-record and public-metadata audits passed;
- Etherscan verification succeeded for all three contracts.

Passing deployment checks and source verification reduce identified
configuration risk. They do not guarantee security.

## 46. Phase 18 Assistant Security Evidence

Observed Phase 18 evidence:

- Banking and Risk contexts are structured and serializable;
- no provider, signer, contract instance, or write client is placed in context;
- assistant source does not import transaction hooks or write modules;
- assistant source does not call `fetch`, Axios, XMLHttpRequest, or WebSocket;
- user input is bounded and normalized;
- external URLs are rejected;
- output is rendered as plain text;
- in-flight work is cancelled when the panel unmounts;
- stale responses are ignored;
- failure produces localized safe fallback content;
- the Spline dependency is isolated to visual launcher rendering;
- 65 frontend test files and 256 frontend tests pass;
- lint, typecheck, build, and whitespace validation pass.

These controls reduce assistant-related risk but do not make assistant
explanations authoritative. Contract state and confirmed receipts remain the
source of truth.
