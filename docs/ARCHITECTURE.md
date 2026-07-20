# SafeBank Architecture

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank / Online Banking System |
| Document | System Architecture |
| Current phase | Phase 7 — Early withdrawal with penalty |
| Implementation status | Smart contracts through Phase 7 are implemented and validated locally; renewal, bonuses, frontend, AI, and deployment remain pending |
| Smart contract model | Non-upgradeable |
| Target environments | Hardhat local network and Ethereum Sepolia testnet |
| Test token | MockUSDC with 6 decimals |
| Student ID | 3122560090 |

This document records both the implemented architecture and the planned direction for later SafeBank phases.

As of Phase 7, MockUSDC, VaultManager, SavingCore plan management, deposit opening, principal custody, financial-term snapshots, ERC721 certificate issuance, base maturity withdrawal, and early withdrawal with penalty are implemented and validated locally.

Sections covering renewal, Bonus C1, Bonus C2, frontend, AI, and deployment remain design specifications and must not be treated as implemented, audited, deployed, or production-ready.

---

## 2. Project Overview

SafeBank is a blockchain-based fixed-term savings system.

A depositor transfers MockUSDC principal into `SavingCore` and receives an ERC721 certificate representing the economic rights associated with the deposit.

Depending on the deposit state and blockchain timestamp, the current NFT owner may:

- withdraw principal and interest at maturity;
- withdraw early and pay a penalty;
- manually renew during the grace period;
- allow a permissionless caller to trigger auto-renew after the grace period;
- claim deferred interest after Bonus C1 is implemented.

The bank administrator manages:

- saving plans;
- interest liquidity;
- vault withdrawals;
- fee receiver configuration;
- pause and unpause operations;
- future solvency information and reserve accounting.

The most important architectural rule is:

> User principal is held by `SavingCore`, while bank-funded interest liquidity is held by `VaultManager`.

Interest must never be paid by consuming principal belonging to other depositors.

---

## 3. Scope Classification

SafeBank distinguishes four categories of project scope.

### 3.1 Mandatory Capstone Requirements

The mandatory scope includes:

- `MockUSDC`;
- `VaultManager`;
- `SavingCore`;
- saving plan management;
- deposit opening;
- APR snapshot;
- penalty snapshot;
- ERC721 deposit certificates;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renewal;
- pause and unpause;
- vault-funded interest payouts;
- required events;
- contract tests;
- test coverage above 90%;
- React frontend demonstration;
- README;
- seven design answers;
- demonstration video;
- GitHub submission.

### 3.2 SafeBank Design Decisions

SafeBank has additionally decided that:

- the current NFT owner holds the deposit's economic rights;
- completed deposit NFTs are retained as historical certificates;
- maturity and grace-period boundaries use exact timestamp rules;
- maturity withdrawal remains possible after the grace period when auto-renew has not executed;
- manual renewal cannot target a disabled plan;
- auto-renew is permissionless;
- pausing also blocks new deposits;
- rounding dust remains in `VaultManager`;
- the architecture is currently non-upgradeable.

### 3.3 Bonus Scope

SafeBank has selected two bonuses:

- C1 — Principal-First Settlement;
- C2 — Solvency Guard.

These bonuses will only be implemented after the mandatory base flows are complete and tested.

### 3.4 Product and AI Extensions

The extension scope includes:

- User Banking App;
- Admin Portal;
- AI Banking Assistant;
- AI Risk Assistant;
- responsive layouts;
- transaction lifecycle UX;
- solvency visualizations;
- deterministic financial calculators.

These extensions must not weaken or bypass on-chain authorization.

---

## 4. Personal Variant

SafeBank uses the personal variant derived from student ID `3122560090`.

The final two digits are:

- `A = 0`;
- `B = 9`.

| Parameter | Formula | Required result |
|---|---|---|
| Grace period | `(A mod 3) + 2 days` | 2 days |
| Default APR | `200 + A × 25 bps` | 200 bps = 2.00% per year |
| Early withdrawal penalty | `300 + B × 50 bps` | 750 bps = 7.50% |
| Default tenor | `B` is odd | 180 days |
| MockUSDC decimals | Fixed requirement | 6 decimals |

Token amount conversions must use six decimals.

Examples:

- `1 mUSDC = 1,000,000` smallest units;
- `1,000 mUSDC = 1,000,000,000` smallest units;
- ethers scripts and tests must use `parseUnits(amount, 6)`;
- `parseEther` must not be used for MockUSDC amounts.

These values must remain synchronized across:

- smart contracts;
- tests;
- deploy scripts;
- seed scripts;
- frontend calculations;
- README;
- design answers;
- demo video;
- oral defense answers.

---

## 5. Actors

### 5.1 Depositor

A depositor may:

- obtain test MockUSDC;
- approve `SavingCore`;
- open a deposit;
- receive an NFT certificate;
- transfer the certificate;
- inspect deposit data;
- withdraw early;
- withdraw at maturity;
- manually renew during the grace period;
- claim pending interest after C1 is implemented.

### 5.2 Current NFT Owner

The current NFT owner is the account returned by `ownerOf(depositId)`.

The current NFT owner, not necessarily the original depositor, has the economic rights to an active deposit.

A certificate transfer therefore transfers the right to:

- receive remaining principal;
- receive maturity interest;
- execute maturity withdrawal;
- execute early withdrawal;
- execute manual renewal.

The original depositor loses those rights after transferring the NFT.

### 5.3 Bank Administrator

The bank administrator is a privileged actor expected to manage:

- saving plans;
- vault funding;
- allowable vault withdrawals;
- fee receiver configuration;
- pause and unpause actions;
- authorized system configuration.

The administrator is trusted to operate the system but must still be constrained by:

- on-chain ownership checks;
- accounting rules;
- event emissions;
- liquidity restrictions;
- pause behavior;
- state validation.

### 5.4 Auto-Renew Caller

The auto-renew caller is untrusted and permissionless.

The caller may be:

- the NFT owner;
- a bank-operated bot;
- an independent automation service;
- any externally owned account.

The caller must never receive the new deposit NFT merely because it submitted the transaction.

The new NFT must always be minted to the current owner of the old certificate.

### 5.5 Frontend User

The frontend user interacts through a browser wallet.

The frontend:

- reads contract state;
- prepares transaction requests;
- presents deterministic calculations;
- communicates transaction status;
- displays warnings and confirmations.

The frontend is not a security boundary and cannot replace Solidity authorization.

### 5.6 AI Assistant

The planned AI assistants may:

- explain plans;
- summarize risks;
- compare deterministic values;
- explain transaction failures;
- issue warnings;
- recommend actions for user review.

They must not:

- hold private keys;
- request seed phrases;
- sign transactions;
- send transactions;
- fabricate balances, APRs, maturities, or liabilities;
- override contract state.

---

## 6. System Boundaries

The SafeBank system contains on-chain and off-chain components.

### 6.1 On-Chain Boundary

The planned on-chain components are:

- `MockUSDC`;
- `SavingCore`;
- `VaultManager`;
- ERC721 certificates issued by `SavingCore`.

On-chain state is the source of truth for:

- saving plan configuration;
- deposit information;
- deposit status;
- NFT ownership;
- principal custody;
- interest payouts;
- pause state;
- pending interest;
- reserved interest;
- vault liquidity.

### 6.2 Off-Chain Boundary

The planned off-chain components include:

- deployment scripts;
- configuration scripts;
- demo seed scripts;
- auto-renew bot;
- User Banking App;
- Admin Portal;
- AI Banking Assistant;
- AI Risk Assistant;
- RPC providers;
- blockchain explorers.

Off-chain components may request or display actions, but they cannot bypass contract validation.

### 6.3 External Boundaries

External dependencies include:

- user wallets;
- Ethereum-compatible networks;
- RPC providers;
- block explorers;
- browser environments;
- optional AI providers.

These components may be unavailable, delayed, compromised, misconfigured, or display stale data.

SafeBank must treat contract state as authoritative.

---

## 7. High-Level Architecture

The planned contract relationship is:

~~~mermaid
flowchart LR
    User[Depositor or NFT Owner]
    Admin[Bank Administrator]
    Bot[Permissionless Auto-Renew Caller]
    UI[User Banking App]
    AdminUI[Admin Portal]
    AI[AI Assistants]

    Token[MockUSDC]
    Core[SavingCore]
    Vault[VaultManager]
    NFT[ERC721 Deposit Certificate]

    UI --> User
    AdminUI --> Admin
    AI -. reads verified data .-> UI
    AI -. reads verified data .-> AdminUI

    User -->|approve and open deposit| Core
    User -->|withdraw or renew| Core
    Admin -->|manage plans| Core
    Admin -->|fund and manage vault| Vault
    Bot -->|trigger auto-renew| Core

    Core -->|transfer principal| Token
    Core -->|mint certificate| NFT
    Core -->|request interest payout| Vault
    Vault -->|interest liquidity| Token
    Core -->|principal custody| Token
~~~

The diagram is conceptual.

The implemented SavingCore constructor receives the token address, VaultManager address, and initial owner. VaultManager uses a separate one-time SavingCore authorization step.

---

## 8. Smart Contract Responsibilities

## 8.1 MockUSDC

`MockUSDC` is a demonstration ERC20 token.

Planned responsibilities:

- expose ERC20-compatible transfers and approvals;
- use exactly 6 decimals;
- allow public minting for local and testnet demonstration;
- provide predictable test balances.

`MockUSDC` is not a real stablecoin.

It has no real financial value and must not be used in production.

The public mint function is intentionally insecure for real-world finance but acceptable for the limited testing purpose of this capstone.

## 8.2 SavingCore

`SavingCore` is the central deposit management contract.

Planned responsibilities:

- hold user principal;
- manage saving plans;
- validate deposit amounts;
- open deposits;
- snapshot APR and penalty;
- calculate maturity timestamps;
- mint ERC721 certificates;
- manage deposit state;
- process maturity withdrawal;
- process early withdrawal;
- process manual renewal;
- process permissionless auto-renewal;
- request interest payouts from `VaultManager`;
- manage pending interest after C1;
- coordinate reserved interest after C2;
- emit deposit and plan events.

`SavingCore` must not use another user's principal to pay interest.

## 8.3 VaultManager

`VaultManager` is the bank-funded interest liquidity contract.

Planned responsibilities:

- hold interest liquidity funded by the bank;
- expose funding operations;
- expose controlled bank withdrawal operations;
- store or expose the early-withdrawal fee receiver;
- allow only the authorized `SavingCore` to request interest payouts;
- support pause and unpause behavior;
- track reserved interest after C2;
- expose available liquidity after C2;
- prevent withdrawal beyond available liquidity after C2;
- emit events for administrative and payout operations.

`VaultManager` does not hold user principal by architectural design.

## 8.4 ERC721 Deposit Certificate

The deposit certificate represents economic rights to a deposit.

Planned properties:

- one NFT per deposit;
- token ID corresponds to the deposit ID;
- transferable by the current owner;
- ownership checked when executing owner-only deposit actions;
- retained after the deposit terminates;
- historical status determined through the associated deposit record.

The NFT is not burned after withdrawal or renewal.

Deposit status prevents an old certificate from being reused.

The project uses basic OpenZeppelin `ERC721` without `ERC721Enumerable`, as finalized in ADR-015.

---

## 9. Separation of Principal and Interest

SafeBank separates two different financial pools.

### 9.1 Principal Pool

The principal pool is held by `SavingCore`.

It includes:

- principal transferred by users when opening deposits;
- interest transferred from the vault into a newly renewed deposit after a successful renewal.

The principal pool backs active deposit principal obligations.

### 9.2 Interest Pool

The interest pool is held by `VaultManager`.

It includes:

- MockUSDC funded by the bank;
- rounding dust remaining after integer division;
- liquidity reserved for current and future interest liabilities after C2.

### 9.3 Early Withdrawal Penalty

When an early withdrawal succeeds:

- the user receives `principal - penalty`;
- the penalty is transferred to the configured fee receiver;
- no interest is paid;
- the deposit becomes terminal.

### 9.4 Forbidden Financial Behavior

The architecture must prevent:

- paying interest from another user's principal;
- allowing arbitrary callers to withdraw vault funds;
- processing one deposit twice;
- treating frontend calculations as authoritative;
- creating unfunded compounded principal during renewal;
- mixing principal accounting with interest-liquidity accounting.

---

## 10. Saving Plan Model

Each saving plan must contain at least:

| Field | Meaning |
|---|---|
| `tenorDays` | Length of one deposit term in days |
| `aprBps` | Annual percentage rate in basis points |
| `minDeposit` | Minimum allowed principal |
| `maxDeposit` | Maximum allowed principal |
| `earlyWithdrawPenaltyBps` | Early withdrawal penalty in basis points |
| `enabled` | Whether new deposits may use the plan |

### 10.1 Plan Rules

The following rules apply:

- one basis point equals 0.01%;
- 200 bps equals 2.00%;
- 750 bps equals 7.50%;
- `minDeposit = 0` means no lower limit;
- `maxDeposit = 0` means no upper limit;
- a disabled plan cannot accept new deposits;
- updating a plan APR affects only future deposits;
- existing deposits continue using their snapshots;
- an invalid plan ID must revert;
- invalid tenor and APR values must revert;
- when both min and max are nonzero, min cannot exceed max;
- an amount below min must revert;
- an amount above max must revert.

### 10.2 Planned Plan Administration

The mandatory administrative interface is expected to include:

- `createPlan(...)`;
- `updatePlan(planId, newAprBps)`;
- `enablePlan(planId)`;
- `disablePlan(planId)`.

The implemented plan interface and validation bounds are defined by SavingCore and recorded in the accepted design decisions.

---

## 11. Deposit Model

Each deposit must store at least:

| Field | Meaning |
|---|---|
| `planId` | Plan used when the deposit was created |
| `principal` | Principal represented by the certificate |
| `startedAt` | Term start timestamp |
| `maturityAt` | Term maturity timestamp |
| `tenorDays` | Snapshotted tenor |
| `aprBpsAtOpen` | Snapshotted APR |
| `penaltyBpsAtOpen` | Snapshotted early withdrawal penalty |
| `status` | Deposit lifecycle state |

### 11.1 Deposit Status

The mandatory base statuses are:

- `Active`;
- `Withdrawn`;
- `ManualRenewed`;
- `AutoRenewed`.

### 11.2 Snapshot Behavior

When a deposit is opened:

- APR is copied from the selected plan;
- penalty is copied from the selected plan;
- tenor is stored for that term;
- future plan changes do not affect the deposit.

This prevents retroactive changes to a user's agreed financial conditions.

### 11.3 Deposit Identifier

Every deposit receives a unique `depositId`.

The associated NFT token ID is expected to match the deposit ID.

Plan IDs, deposit IDs, and ERC721 token IDs begin at `1`; identifier `0` is invalid.

---

## 12. Deposit State Machine

The deposit state machine begins with `Active`.

Only an active deposit may be processed.

~~~mermaid
stateDiagram-v2
    [*] --> Active: openDeposit

    Active --> Withdrawn: withdrawAtMaturity
    Active --> Withdrawn: earlyWithdraw
    Active --> ManualRenewed: renewDeposit
    Active --> AutoRenewed: autoRenewDeposit

    Withdrawn --> [*]
    ManualRenewed --> [*]
    AutoRenewed --> [*]
~~~

A terminal old deposit cannot return to `Active`.

Renewal creates a new active deposit with a new NFT.

The old NFT remains as historical evidence but no longer represents an actionable deposit.

### 12.1 State-Machine Invariant

For each old deposit, only one of the following may happen:

- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renewal.

After the first successful state transition, all later processing attempts must revert.

---

## 13. Financial Calculations

## 13.1 Interest Calculation

Simple interest for one term is:

`interest = principal × aprBpsAtOpen × tenorSeconds ÷ (365 days × 10,000)`

Where:

`tenorSeconds = tenorDays × 86,400`

The denominator is:

`365 × 24 × 60 × 60 × 10,000`

The implementation must multiply before dividing to reduce precision loss.

It must not divide the principal first because Solidity integer division may round the intermediate result to zero.

Interest does not compound inside a single deposit term.

Compounding occurs only when renewal successfully creates a new deposit whose principal equals:

`old principal + old term interest`

## 13.2 Early Withdrawal Penalty

The penalty is:

`penalty = principal × penaltyBpsAtOpen ÷ 10,000`

The user receives:

`userReceive = principal - penalty`

An early withdrawal receives no interest.

## 13.3 Integer Rounding

Solidity integer division rounds down.

SafeBank has decided that:

- the user receives the rounded-down interest;
- rounding dust remains in `VaultManager`;
- the token supply is not modified to compensate for dust;
- tests must verify token conservation and exact balance movements.

---

## 14. Open Deposit Flow

The planned open-deposit flow is:

1. The user selects an enabled plan.
2. The frontend reads plan details from the contract.
3. The frontend calculates an estimate for display only.
4. The user approves exactly the required MockUSDC amount.
5. The user calls `openDeposit(planId, amount)`.
6. `SavingCore` verifies that the system is not paused.
7. `SavingCore` verifies that the plan exists.
8. `SavingCore` verifies that the plan is enabled.
9. `SavingCore` validates the amount against min and max.
10. `SavingCore` transfers principal from the user.
11. `SavingCore` snapshots tenor, APR, and penalty.
12. `SavingCore` calculates `maturityAt`.
13. `SavingCore` creates an active deposit.
14. `SavingCore` mints an NFT certificate to the user.
15. `SavingCore` emits `DepositOpened`.
16. After C2, the expected interest liability is reserved.

~~~mermaid
sequenceDiagram
    participant User
    participant Token as MockUSDC
    participant Core as SavingCore
    participant Vault as VaultManager

    User->>Token: approve(SavingCore, amount)
    User->>Core: openDeposit(planId, amount)
    Core->>Core: validate pause, plan, min and max
    Core->>Token: transferFrom(user, SavingCore, amount)
    Core->>Core: snapshot APR, penalty and tenor
    Core->>Core: create Active deposit
    Core->>Core: mint ERC721 certificate
    Core-->>User: DepositOpened event
    Core-->>Vault: reserve expected interest after C2
~~~

If any required validation or transfer fails, the transaction must revert atomically.

---

## 15. Maturity Withdrawal Flow

The Phase 6 base maturity-withdrawal flow is implemented through `withdrawAtMaturity(depositId)`.

A maturity withdrawal is allowed when:

`block.timestamp >= maturityAt`

The implemented flow is:

1. `whenNotPaused` verifies that SavingCore is active.
2. `nonReentrant` prevents nested withdrawal execution.
3. SavingCore verifies that the deposit exists.
4. SavingCore verifies that the deposit status is `Active`.
5. SavingCore resolves the direct current owner with `ownerOf(depositId)`.
6. SavingCore requires the caller to equal that owner; ERC721 approval alone is insufficient.
7. SavingCore verifies that the maturity timestamp has been reached.
8. SavingCore calculates simple interest from the snapshotted principal, APR, and tenor using floor rounding.
9. SavingCore changes the deposit status to `Withdrawn`.
10. SavingCore returns principal to the current NFT owner.
11. If interest is positive, SavingCore requests payout through the authorized `VaultManager`.
12. SavingCore emits `Withdrawn(depositId, owner, principal, interest, false)`.

The ERC721 certificate is not burned and remains available as a historical certificate.

The function follows checks-effects-interactions. If VaultManager is paused, unauthorized, or underfunded, the payout call reverts and EVM atomicity restores the deposit status and all affected token balances.

A zero-rounded interest amount skips `VaultManager.payInterest` because VaultManager rejects zero-value payouts.

The Phase 6 base behavior intentionally permits an underfunded vault to revert the entire maturity transaction. Bonus C1 will later change this behavior so insufficient interest does not lock principal.

---

## 16. Early Withdrawal Flow

An early withdrawal is allowed when:

`block.timestamp < maturityAt`

The implemented Phase 7 flow is:

1. Verify the system is not paused.
2. Verify the deposit exists.
3. Verify the deposit is `Active`.
4. Verify the caller is the current NFT owner.
5. Verify maturity has not been reached.
6. Calculate the snapshotted penalty.
7. Calculate `principal - penalty`.
8. Mark the deposit as `Withdrawn`.
9. Transfer the remaining principal to the NFT owner.
10. Transfer the penalty to the fee receiver.
11. Release the deposit's reserved interest after C2.
12. Emit `Withdrawn` with `isEarly = true`.

No interest is paid for an early withdrawal.

At exactly `maturityAt`, this flow must revert because the deposit is no longer early.

### 16.1 Phase 7 Implementation Evidence

The implemented `earlyWithdraw(depositId)` flow has been validated with:

- direct current-NFT-owner authorization;
- rejection of the original owner after certificate transfer;
- rejection of unrelated callers;
- rejection of approved ERC721 operators that are not the direct owner;
- eligibility one second before maturity;
- rejection at exactly `maturityAt`;
- penalty calculation from `penaltyBpsAtOpen`;
- current fee receiver resolution through `vaultManager.feeReceiver()`;
- no interest request to `VaultManager`;
- zero-penalty and 10,000-bps-penalty boundaries;
- integer floor rounding with exact principal conservation;
- existing-deposit isolation from plan APR updates and plan disabling;
- SavingCore pause enforcement;
- independence from the VaultManager pause state;
- atomic rollback when the later penalty transfer fails;
- direct and cross-function callback reentrancy protection;
- exclusion between maturity and early terminal actions;
- retained ERC721 historical certificates.

The implemented external-call order is:

1. transfer nonzero user net principal;
2. transfer nonzero penalty;
3. emit the reused `Withdrawn` event.

Because both transfers occur in one EVM transaction, failure of either required transfer reverts all earlier balance and state changes.

The later C2 implementation may add reserved-interest release accounting. That future accounting is not part of the current Phase 7 contract.
---

## 17. Manual Renewal Flow

Manual renewal is allowed when:

`block.timestamp >= maturityAt`

and:

`block.timestamp < maturityAt + gracePeriod`

The grace period is fixed at two days for this project.

The planned flow is:

1. Verify the system is not paused.
2. Verify the old deposit exists.
3. Verify the old deposit is `Active`.
4. Verify the caller is the current NFT owner.
5. Verify the timestamp is within the manual-renewal window.
6. Verify the new plan exists.
7. Verify the new plan is enabled.
8. Calculate the old term's snapshotted interest.
9. Request the interest from `VaultManager`.
10. Add the funded interest to the old principal.
11. Mark the old deposit as `ManualRenewed`.
12. Create a new active deposit.
13. Snapshot the new plan's tenor, APR, and penalty.
14. Mint a new certificate to the current owner.
15. Consume the old reserve and create a new reserve after C2.
16. Emit `Renewed`.

The old certificate remains historical.

If the vault cannot fund the interest:

- manual renewal may revert;
- the project must not create unfunded compounded principal;
- the old active deposit remains available for another valid action.

---

## 18. Auto-Renew Flow

Auto-renew is allowed when:

`block.timestamp >= maturityAt + gracePeriod`

The function is permissionless.

The planned flow is:

1. Verify the system is not paused.
2. Verify the old deposit exists.
3. Verify the old deposit is `Active`.
4. Verify the auto-renew timestamp has been reached.
5. Read the current owner of the old NFT.
6. Calculate the old term's snapshotted interest.
7. Request interest funding from `VaultManager`.
8. Add the funded interest to the old principal.
9. Mark the old deposit as `AutoRenewed`.
10. Create a new active deposit.
11. Use the old deposit's tenor.
12. Preserve the old deposit's APR snapshot.
13. Apply the finalized penalty-snapshot decision.
14. Mint the new certificate to the current NFT owner.
15. Consume the old reserve and create a new reserve after C2.
16. Emit `Renewed`.

The caller does not receive ownership rights unless the caller is already the NFT owner.

If the vault lacks the required interest:

- auto-renew may revert;
- the old deposit remains active;
- the owner may still perform maturity withdrawal if no other transaction has already changed the state.

The current design direction is to preserve the old penalty snapshot, but this must be formally recorded in `DESIGN_DECISIONS.md` before implementation.

---

## 19. Exact Time Boundaries

SafeBank uses explicit timestamp boundaries.

### 19.1 Before Maturity

When:

`block.timestamp < maturityAt`

The allowed owner action is early withdrawal.

Maturity withdrawal and manual renewal are not yet valid.

### 19.2 At Exact Maturity

When:

`block.timestamp == maturityAt`

The deposit is considered mature.

Therefore:

- early withdrawal is no longer allowed;
- maturity withdrawal is allowed;
- manual renewal begins to be allowed.

### 19.3 During the Grace Period

When:

`maturityAt <= block.timestamp < maturityAt + gracePeriod`

The current owner may:

- withdraw at maturity;
- manually renew.

Auto-renew is not yet allowed.

### 19.4 At Exact Grace-Period End

When:

`block.timestamp == maturityAt + gracePeriod`

Manual renewal is no longer allowed.

Auto-renew becomes allowed.

Maturity withdrawal remains allowed if the deposit is still active.

### 19.5 After the Grace Period

If no auto-renew transaction has executed:

- the deposit remains active;
- the owner may withdraw at maturity;
- any address may trigger auto-renew;
- whichever valid transaction is mined first determines the final state;
- the status machine prevents the second transaction from executing successfully.

Blockchain time does not automatically execute state transitions.

A transaction is always required.

---

## 20. Disabled Plan Behavior

When a plan is disabled:

- new deposits cannot use it;
- existing deposits remain valid;
- existing deposits may be withdrawn early before maturity;
- existing deposits may be withdrawn at maturity;
- manual renewal cannot target the disabled plan;
- auto-renew remains possible because it uses stored snapshots rather than current plan availability.

Disabling a plan does not confiscate or invalidate active user deposits.

---

## 21. Pause Behavior

The pause mechanism is intended for emergency risk reduction.

When paused, the planned system must block:

- `openDeposit`;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renewal;
- pending-interest claims;
- interest payout requests.

The administrator may still:

- unpause the system;
- perform explicitly permitted emergency operations;
- inspect contract state.

Pause does not automatically:

- recover stolen keys;
- reverse completed transactions;
- modify deposit ownership;
- repay pending liabilities;
- solve vault insolvency.

Pause is a damage-containment mechanism, not a complete security solution.

`SavingCore` and `VaultManager` use independent pause states controlled by their respective owners, as finalized in ADR-020.

---

## 22. Required Events

The contracts must emit at least:

- `PlanCreated(planId, tenorDays, aprBps)`;
- `PlanUpdated(planId, newAprBps)`;
- `DepositOpened(depositId, owner, planId, principal, maturityAt, aprBpsAtOpen)`;
- `Withdrawn(depositId, owner, principal, interest, isEarly)`;
- `Renewed(oldDepositId, newDepositId, newPrincipal, newPlanId)`.

Additional planned events may include:

- `PlanEnabled`;
- `PlanDisabled`;
- `VaultFunded`;
- `VaultWithdrawn`;
- `FeeReceiverUpdated`;
- `SystemPaused`;
- `SystemUnpaused`;
- `InterestPaid`;
- `InterestDeferred`;
- `PendingInterestClaimed`;
- `InterestReserved`;
- `ReservedInterestReleased`;
- `SavingCoreAuthorized`.

Every additional event must have a clear monitoring, accounting, security, or UX purpose.

---

## 23. Bonus C1 — Principal-First Settlement

C1 is selected but remains unimplemented as of Phase 7.

### 23.1 Problem

The base specification may revert maturity withdrawal when the vault lacks interest.

That behavior can indirectly lock user principal even though the principal remains inside `SavingCore`.

### 23.2 Planned Solution

At maturity:

- if the vault can pay interest, principal and interest are both paid;
- if the vault cannot pay interest, principal is returned immediately;
- unpaid interest becomes a pending claim;
- the claimant is snapshotted at settlement time;
- the claimant may claim after the vault is funded.

Planned storage includes:

- `pendingInterest[depositId]`;
- `interestClaimant[depositId]`.

The planned claim function is:

- `claimPendingInterest(depositId)`.

### 23.3 C1 Invariants

C1 must ensure that:

- principal cannot be paid twice;
- pending interest cannot be claimed twice;
- the claimant is the NFT owner at settlement time;
- transferring the NFT after settlement does not change the claimant;
- a settled deposit cannot renew;
- recording pending interest does not create additional principal.

### 23.4 C1 Scope Limitation

C1 applies to maturity withdrawal.

Manual and auto-renew may still revert when the vault cannot fund the interest needed for compounding.

---

## 24. Bonus C2 — Solvency Guard

C2 is selected but remains unimplemented as of Phase 7.

### 24.1 Problem

Without reserve accounting, an administrator may withdraw vault funds that are economically expected to cover active-deposit interest.

### 24.2 Planned Solution

The target architecture tracks:

`totalReservedInterest`

Expected reserve transitions are:

- opening a deposit increases reserved interest;
- early withdrawal releases the unused reserve;
- maturity settlement consumes the old reserve;
- manual renewal consumes the old reserve and creates a new reserve;
- auto-renew consumes the old reserve and creates a new reserve.

Available liquidity is:

`availableLiquidity = max(vaultBalance - totalReservedInterest, 0)`

The administrator may withdraw no more than available liquidity.

### 24.3 Undercollateralization Decision

SafeBank does not necessarily reject new deposits when the vault is undercollateralized.

The reasons are:

- C1 protects principal recovery;
- the system can expose funding shortfall transparently;
- the administrator cannot worsen the shortfall by withdrawing reserved funds;
- the AI Risk Assistant can warn about insolvency risk.

This design accepts the possibility of delayed interest payment while prioritizing principal separation and transparent liabilities.

---

## 25. Contract Dependency Model

The planned dependency relationship is:

~~~mermaid
flowchart TD
    Token[MockUSDC ERC20]
    Vault[VaultManager]
    Core[SavingCore and ERC721]
    User[Depositor or NFT Owner]
    Admin[Bank Administrator]
    Bot[Auto-Renew Caller]

    User -->|approve, deposit, withdraw, renew| Core
    Admin -->|plan administration| Core
    Admin -->|fund, withdraw, configure| Vault
    Bot -->|permissionless trigger| Core

    Core -->|SafeERC20 principal operations| Token
    Vault -->|SafeERC20 interest operations| Token
    Core -->|authorized payout request| Vault
~~~

`SavingCore` must know:

- the MockUSDC token address;
- the `VaultManager` address.

`VaultManager` must know:

- the MockUSDC token address;
- the authorized `SavingCore` address;
- the fee receiver address.

The exact authorization handshake remains an open implementation decision.

Potential approaches include:

- constructor-time immutable authorization;
- one-time post-deployment authorization;
- controlled replacement using `Ownable2Step`, validation, and events.

The selected approach must minimize configuration risk.

---

## 26. Planned Deployment Relationship

The expected deployment sequence is:

1. Deploy `MockUSDC`.
2. Deploy `VaultManager` with required configuration.
3. Deploy `SavingCore` with token and vault dependencies.
4. Authorize `SavingCore` in `VaultManager`.
5. Verify the dependency addresses.
6. Create the default personal-variant plan.
7. Fund demonstration accounts.
8. Fund the vault.
9. Export addresses for scripts and frontend.
10. Verify contracts on Sepolia during the deployment phase.

No contract has been deployed at the time this document is written.

Constructor signatures and exact configuration functions are not yet finalized.

---

## 27. Planned Security Building Blocks

The project expects to use OpenZeppelin components where appropriate.

Planned controls include:

- `Ownable2Step`;
- `Pausable`;
- `ReentrancyGuard`;
- `SafeERC20`;
- ERC721 ownership checks;
- custom errors;
- checks-effects-interactions;
- explicit status validation;
- zero-address validation;
- amount validation;
- plan existence validation;
- timestamp boundary validation;
- event emission for sensitive actions.

These are planned defense-in-depth measures.

Their actual presence and effectiveness must later be confirmed through code review and tests.

---

## 28. Core Architectural Invariants

The implementation and tests must preserve the following invariants.

### 28.1 Principal Custody Invariant

Active-deposit principal obligations must be backed by tokens held in `SavingCore`.

### 28.2 Interest Custody Invariant

Bank-funded interest liquidity must remain in `VaultManager` until a valid payout or allowed withdrawal occurs.

### 28.3 Separation Invariant

Interest must not be paid by consuming principal belonging to unrelated active deposits.

### 28.4 Single-Execution Invariant

An old deposit can transition from `Active` to exactly one terminal status.

### 28.5 Ownership Invariant

Owner-only economic actions must authorize the current NFT owner at transaction execution time.

### 28.6 Snapshot Invariant

An active deposit's stored APR and penalty cannot be retroactively modified by plan updates.

### 28.7 Renewal Funding Invariant

A renewed principal must not include interest that the vault failed to fund.

### 28.8 Auto-Renew Ownership Invariant

The permissionless caller must not receive the renewed certificate unless it is already the current owner.

### 28.9 Historical Certificate Invariant

Keeping the old NFT must not allow the old deposit to be processed again.

### 28.10 Pause Invariant

No blocked user financial operation may bypass the intended pause checks.

### 28.11 C1 Claim Invariant

After C1, deferred interest can be claimed once by the snapshotted claimant.

### 28.12 C2 Reserve Invariant

After C2, reserve releases and consumption must not underflow or be applied twice.

### 28.13 Vault Withdrawal Invariant

After C2, administrator withdrawals cannot exceed available liquidity.

### 28.14 Conservation Invariant

Every successful financial flow must reconcile exact token balance changes, including integer rounding.

---

## 29. Trust Assumptions

The architecture currently assumes:

- OpenZeppelin contracts behave according to their documented interfaces;
- MockUSDC behaves as a standard ERC20 test token;
- the administrator is privileged but may make mistakes or become compromised;
- user wallets may reject or fail transactions;
- permissionless auto-renew callers are untrusted;
- blockchain timestamps may vary slightly within validator limits;
- transactions may be front-run or mined in an unexpected order;
- the frontend may display stale RPC data;
- AI output may be unavailable or incorrect;
- contract state is the source of truth;
- local and Sepolia tokens have no real financial value.

These assumptions must be reflected in security tests and UI warnings.

---

## 30. Non-Goals

The current SafeBank capstone does not aim to provide:

- a production-ready real bank;
- custody of real USDC;
- legal deposit insurance;
- guaranteed returns;
- fiat on-ramp or off-ramp;
- identity verification or KYC;
- regulatory compliance certification;
- cross-chain deposits;
- lending or borrowing;
- variable-rate interest within one term;
- continuous automatic execution without transactions;
- upgradeable proxy architecture;
- private-key custody by the application;
- transaction signing by AI;
- formal verification as a completed project assurance;
- a claim that the system cannot be hacked.

---

## 31. Known Limitations

The intended architecture has known limitations:

- public MockUSDC minting is unsuitable for production;
- administrator privileges create governance risk;
- a compromised owner key may affect plans and vault controls;
- auto-renew depends on an external transaction;
- blockchain timestamps are not wall-clock guarantees;
- underfunded interest may be delayed;
- C1 adds debt accounting complexity;
- C2 adds reserve-accounting complexity;
- integer division creates rounding dust;
- NFT transfer transfers economic rights and may surprise users;
- pause temporarily blocks legitimate users;
- non-upgradeable contracts cannot be patched in place;
- incorrect deployment configuration may make the system unusable;
- the frontend cannot guarantee transaction success;
- AI explanations cannot replace on-chain validation.

---

## 32. Frontend Architectural Relationship

The future frontend will have two visibly separate applications or route groups.

### 32.1 User Banking App

The user interface will support:

- wallet connection;
- network validation;
- plan discovery;
- deterministic interest estimates;
- exact-amount approval;
- deposit opening;
- active-deposit viewing;
- certificate ownership viewing;
- early withdrawal;
- maturity withdrawal;
- manual renewal;
- pending-interest claims;
- Etherscan links;
- transaction lifecycle states.

### 32.2 Admin Portal

The admin interface will support:

- plan management;
- vault funding;
- allowable vault withdrawal;
- fee receiver management;
- pause and unpause;
- solvency metrics;
- audit events;
- risk warnings.

Frontend route protection is only a UX feature.

The contracts must enforce the real authorization.

---

## 33. AI Architectural Relationship

The planned AI layer is read-only and advisory.

### 33.1 AI Banking Assistant

It may explain:

- plan terms;
- estimated interest;
- penalties;
- maturity;
- renewal;
- pending interest;
- wallet and transaction errors.

### 33.2 AI Risk Assistant

It may analyze:

- vault balance;
- total reserved interest;
- available liquidity;
- solvency ratio;
- funding shortfall;
- upcoming maturities.

### 33.3 Deterministic Data Requirement

All financial numbers shown by AI must originate from:

- contract state;
- verified event data;
- deterministic project formulas.

The AI layer must never become the source of truth.

The application must remain usable when the AI provider is unavailable.

---

## 34. Architectural Decision Status

Resolved and implemented through Phase 7:

1. Basic OpenZeppelin `ERC721` is used without `ERC721Enumerable`.
2. Plan and deposit storage structures are defined in `SavingCore`.
3. Current custom errors are defined in the implemented contracts.
4. APR, tenor, and penalty validation bounds are fixed.
5. Plan IDs, deposit IDs, and NFT token IDs begin at `1`.
6. `tokenId == depositId`.
7. VaultManager uses one-time authorization of a deployed SavingCore-compatible contract.
8. The authorized SavingCore address cannot be replaced.
9. SavingCore and VaultManager use independent pause states.
10. Constructor dependencies and ownership parameters are defined.
11. Basic inherited ERC721 metadata is used without a custom `tokenURI`.
12. Maturity withdrawal is valid at and after `maturityAt` while the deposit remains active.
13. Only the direct current NFT owner may execute maturity withdrawal.
14. Approved ERC721 operators do not inherit maturity-withdrawal authority.
15. Maturity interest uses snapshotted deposit terms and floor rounding.
16. Completed deposit NFTs are retained as historical certificates.
17. Base underfunded-vault behavior is an atomic revert until Bonus C1 is implemented.

Still deferred:

1. Rich NFT metadata and external token-URI presentation.
2. Final auto-renew penalty-snapshot behavior.
3. Final frontend framework.
4. Final AI provider.
5. Deployment-address configuration format.

Deferred decisions must be finalized before their related implementation begins and must not be represented as completed code.

---

## 35. Architecture Test Implications

Future tests must verify that the implementation matches this architecture.

At minimum, tests must cover:

- MockUSDC uses 6 decimals;
- personal-variant constants are correct;
- plan validation;
- APR snapshot;
- penalty snapshot;
- principal transfer into `SavingCore`;
- interest payout from `VaultManager`;
- exact maturity boundary;
- exact grace-period boundary;
- NFT transfer and current-owner rights;
- old-owner rejection;
- double-withdraw rejection;
- double-renew rejection;
- disabled-plan behavior;
- permissionless auto-renew;
- renewed NFT recipient;
- pause coverage;
- insufficient vault behavior;
- C1 principal-first behavior;
- C1 claim-once behavior;
- C2 reserve transitions;
- C2 vault withdrawal limits;
- rounding and token conservation;
- reentrancy resistance;
- transaction rollback after external-call failure.

Coverage from the empty Phase 0 project is not evidence of contract coverage.

Coverage must be measured again after contracts and tests exist.

---

## 36. Architecture Evolution Rules

Future phases must follow these rules:

- mandatory base flows are implemented before bonuses;
- bonuses are implemented before frontend dependence on bonus APIs;
- frontend work begins after contract APIs are sufficiently stable;
- AI work begins after deterministic contract data is available;
- architecture changes must be documented;
- security-sensitive changes require tests;
- no phase may be described as complete before its checkpoint;
- no contract may be called secure solely because it uses OpenZeppelin;
- no dependency may be force-installed to hide compatibility conflicts;
- secrets must remain outside Git;
- Sepolia deployment details must not be invented before deployment.

---

## 37. Phase Status

Completed:

- Phase 0 project initialization;
- npm and Hardhat configuration;
- Git initialization and GitHub synchronization;
- environment-variable cleanup;
- architecture, security, UI/UX, and decision documentation.

Implemented and validated locally through Phase 7:

- six-decimal `MockUSDC`;
- base `VaultManager`;
- SavingCore foundation and saving-plan management;
- two-step ownership and independent pause controls;
- deposit opening and principal custody;
- immutable APR, tenor, and penalty snapshots;
- ERC721 deposit certificates;
- current NFT owner economic rights;
- base maturity withdrawal;
- snapshotted simple-interest calculation;
- principal payout from SavingCore;
- interest payout from VaultManager;
- maturity withdrawal at exact maturity and after grace while active;
- early withdrawal only before maturity;
- exact-maturity rejection for the early path;
- zero-interest early settlement;
- snapshotted early-withdrawal penalty calculation;
- net-principal payout to the direct current NFT owner;
- penalty payout to the current fee receiver;
- disabled-plan settlement isolation;
- zero, maximum, and floor-rounded penalty handling;
- historical NFT retention;
- atomic rollback for failed maturity and early settlement calls;
- direct and cross-function reentrancy protection;
- exclusion between competing terminal actions;
- project-owned ABI export;
- `120` SavingCore tests;
- `180` tests across the complete project;
- 100% statements, branches, functions, and lines coverage for SavingCore;
- all `82 / 82` SavingCore branch paths;
- SavingCore deployed bytecode of approximately `9.406 KiB`;
- SavingCore initcode of approximately `10.637 KiB`.

Not implemented:

- rich NFT metadata or custom `tokenURI`;
- manual renewal;
- permissionless auto-renewal;
- pending-interest accounting;
- reserved-interest accounting;
- deploy scripts;
- local deployment workflow;
- Sepolia deployment;
- Etherscan verification;
- User Banking App;
- Admin Portal;
- AI assistants;
- Bonus C1;
- Bonus C2.

This document is a living architecture record updated through Phase 7.

Sections covering renewal, C1, C2, deployment, frontend, and AI remain specifications until their implementations are validated.

---
## 38. Summary

SafeBank uses a three-contract model:

- `MockUSDC` supplies a six-decimal demonstration asset;
- `SavingCore` holds principal and manages deposits and certificates;
- `VaultManager` holds bank-funded interest liquidity.

The architecture prioritizes:

- separation of principal and interest;
- snapshot-based deposit terms;
- NFT-based economic ownership;
- explicit lifecycle transitions;
- exact timestamp boundaries;
- permissionless but ownership-safe auto-renewal;
- defense-in-depth;
- future principal-first settlement;
- future solvency reserve accounting;
- deterministic frontend and AI data.

Implementation must be validated by code review, tests, coverage, deployment checks, and final documentation before SafeBank can be considered complete.
