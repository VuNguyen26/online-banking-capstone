# SafeBank Architecture

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank / Online Banking System |
| Document | System Architecture |
| Current phase | Phase 15 — User Banking App |
| Implementation status | Mandatory contracts, Bonus C1, Bonus C2, deterministic local deployment, the verified Sepolia deployment, and the User Banking App are implemented and validated; the Admin Portal, AI assistants, demo video, rich metadata, and final submission remain pending |
| Smart contract model | Non-upgradeable |
| Validated local environments | Ephemeral Hardhat network and persistent localhost, chain ID 31337 |
| Validated public environment | Ethereum Sepolia, chain ID 11155111 |
| Test token | MockUSDC with 6 decimals |
| Student ID | 3122560090 |

This document records the implemented architecture and the planned direction
for later SafeBank product phases.

Phase 14 deployed MockUSDC, VaultManager, and SavingCore to Sepolia, completed
one-time authorization, created canonical plan ID `1`, verified receipts and
public state, demonstrated idempotent reuse, retained public deployment
records, created compact metadata, and verified all three sources on Etherscan.

The public deployment contains no initial demo mint, vault funding, or deposit.
The Phase 15 User Banking App consumes the tracked Sepolia deployment without
changing the contract security model. The Admin Portal, AI assistants, rich
NFT metadata, demo video, final submission, and production-readiness claims
remain outside the current implementation.

## 2. Project Overview

SafeBank is a blockchain-based fixed-term savings system.

A depositor transfers MockUSDC principal into `SavingCore` and receives an ERC721 certificate representing the economic rights associated with the deposit.

Depending on the deposit state and blockchain timestamp, the current NFT owner may:

- withdraw principal and interest at maturity;
- withdraw early and pay a penalty;
- manually renew during the grace period;
- allow a permissionless caller to trigger auto-renew after the grace period;
- claim deferred interest after principal-first maturity settlement.

The bank administrator manages:

- saving plans;
- interest liquidity;
- vault withdrawals;
- fee receiver configuration;
- pause and unpause operations;
- implemented solvency information and reserve accounting.

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

SafeBank selected and implemented two bonuses:

- C1 — Principal-First Settlement, implemented and validated locally in
  Phase 11;
- C2 — Solvency Guard, implemented and validated locally in Phase 12.

C2 uses SavingCore as the liability source of truth and VaultManager as the
liquidity and administrator-withdrawal enforcement point.

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
- claim pending interest when recorded as the snapshotted claimant.

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

The implemented contract relationship is:

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
- maintain aggregate reserved-interest lifecycle accounting;
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
- read aggregate reserved interest from the authorized SavingCore;
- expose available liquidity and funding shortfall;
- prevent owner withdrawal beyond available liquidity;
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
- liquidity economically allocated to active expected interest and unpaid pending interest.

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
    Active --> ManualRenewed: manualRenew
    Active --> AutoRenewed: autoRenew

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
16. Reserve the positive expected interest liability in SavingCore.

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
    Core->>Core: record expected interest reserve
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

The function follows checks-effects-interactions.

A zero-rounded interest amount skips `VaultManager.payInterest` because VaultManager rejects zero-value payouts.

For positive interest, Phase 11 distinguishes liquidity shortfall from every
other VaultManager failure:

- if `payInterest` succeeds, principal and interest are paid immediately;
- if VaultManager reverts with
  `InsufficientVaultBalance(available, required)`, principal remains paid,
  the deposit becomes terminal, the full calculated interest is stored in
  `pendingInterest[depositId]`, and the current NFT owner is stored in
  `interestClaimant[depositId]`;
- paused, unauthorized, malformed, empty-revert, and other unexpected failures
  are rethrown, causing EVM atomicity to restore the deposit status, principal,
  pending-interest state, claimant state, and token balances.

The deferred-interest path is full-or-defer. It does not make a partial
interest payment.

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
11. Release the deposit's reserved interest.
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

Phase 12 releases the full snapshotted expected-interest reserve before early-withdrawal transfers; EVM rollback restores the reserve if a later transfer fails.
---

## 17. Manual Renewal Flow

Manual renewal is implemented through:

`manualRenew(uint256 depositId, uint256 newPlanId)`

The function returns the identifier of the newly created deposit.

Manual renewal is valid only during the half-open interval:

`maturityAt <= block.timestamp < maturityAt + GRACE_PERIOD`

The project grace period is fixed at two days.

The implemented manual-renewal flow is:

1. Verify that `SavingCore` is not paused.
2. Verify that the old deposit exists.
3. Verify that the old deposit remains `Active`.
4. Resolve the direct current owner of the old ERC721 certificate.
5. Verify that the caller is that direct current owner.
6. Revert with `DepositNotMatured` before `maturityAt`.
7. Revert with `ManualRenewalWindowClosed` at or after
   `maturityAt + GRACE_PERIOD`.
8. Verify that the selected new plan exists.
9. Verify that the selected new plan is enabled.
10. Calculate old-term interest from the immutable old-deposit snapshots.
11. Calculate `newPrincipal = oldPrincipal + oldInterest`.
12. Validate the compounded principal against the selected plan's current
    minimum and maximum limits.
13. Allocate the next sequential deposit and NFT identifier.
14. Mark the old deposit as `ManualRenewed`.
15. Create a new `Active` deposit.
16. Snapshot the selected plan's current tenor, APR, and penalty.
17. Start the new term at the renewal transaction timestamp.
18. Calculate the new maturity from the selected tenor.
19. For positive interest, transfer that interest from `VaultManager` into
    `SavingCore`.
20. Skip the VaultManager payout when interest rounds down to zero.
21. Safely mint a new certificate to the current old-certificate owner.
22. Emit `Renewed`.

The old certificate remains as historical evidence and is not burned.

The new certificate follows the existing identifier invariant:

`newTokenId == newDepositId`

### 17.1 Interest and Token Movement

Positive old-term interest is physically transferred through:

`vaultManager.payInterest(address(this), interest)`

The recipient is `SavingCore`, not the user, because the interest becomes
part of the principal of the new active deposit.

After a successful positive-interest renewal:

- the user's MockUSDC balance is unchanged;
- total MockUSDC supply is unchanged;
- the VaultManager balance decreases by the old-term interest;
- the SavingCore balance increases by the same amount;
- the new deposit principal equals old principal plus funded interest.

A zero-rounded interest amount skips `VaultManager.payInterest`.

Therefore, zero-interest renewal may succeed:

- without VaultManager liquidity;
- while only VaultManager is paused;
- without emitting `InterestPaid`.

The system never creates unfunded compounded principal.

### 17.2 Plan and Snapshot Semantics

Old-term interest always uses:

- old principal;
- old APR snapshot;
- old tenor snapshot.

Updating or disabling the old plan does not change the existing deposit's:

- principal;
- APR;
- tenor;
- penalty snapshot;
- maturity;
- old-term interest;
- manual-renewal eligibility.

The selected plan controls only the new deposit.

The selected new plan must be enabled when renewal executes.

This produces the following rules:

- renewal into a different enabled plan is allowed;
- renewal into the same enabled plan is allowed;
- disabling the old plan does not block renewal into another enabled plan;
- a disabled plan cannot be selected as the new plan;
- selected-plan limits apply to compounded `newPrincipal`.

The new active deposit snapshots:

- selected plan ID;
- selected tenor;
- selected APR;
- selected early-withdrawal penalty;
- renewal transaction timestamp;
- new maturity timestamp.

### 17.3 Ownership and Lifecycle

Only the direct current owner of the old certificate may renew.

ERC721 approvals and operator approvals do not grant renewal authority.

Transferring the certificate transfers the remaining renewal right.

After successful renewal:

- the old deposit status becomes `ManualRenewed`;
- the new deposit status is `Active`;
- the old NFT remains owned by the current owner;
- a new NFT is minted to the same owner;
- the old deposit cannot be renewed again;
- the old deposit cannot be withdrawn early;
- the old deposit cannot be withdrawn at maturity.

A deposit already settled through early withdrawal or maturity withdrawal
cannot be renewed.

Manual renewal emits:

`Renewed(oldDepositId, newDepositId, newPrincipal, newPlanId)`

Manual renewal does not emit:

- `DepositOpened`;
- `Withdrawn`.

Positive-interest renewal additionally produces:

- `VaultManager.InterestPaid`;
- ERC721 `Transfer` for the new NFT mint.

### 17.4 Atomicity and Reentrancy

`manualRenew` uses:

- `whenNotPaused`;
- `nonReentrant`;
- checks-effects-interactions ordering.

The implementation updates state before external calls:

1. mark the old deposit `ManualRenewed`;
2. store the new deposit;
3. transfer positive interest from VaultManager;
4. safely mint the new ERC721 certificate;
5. emit `Renewed`.

EVM atomicity restores all earlier changes if a required later interaction
fails.

Validated rollback scenarios include:

- underfunded VaultManager;
- unauthorized SavingCore;
- paused VaultManager during positive-interest renewal;
- failed ERC721 safe mint.

A failed renewal restores:

- old deposit status;
- deposit count;
- absence of the new deposit;
- absence of the new NFT;
- old NFT ownership;
- SavingCore token balance;
- VaultManager token balance;
- total token supply.

Two callback surfaces are protected:

- ERC20 callback while VaultManager transfers interest;
- ERC721 `onERC721Received` callback while the new NFT is minted.

Nested renewal attempts revert with `ReentrancyGuardReentrantCall`, while the
original valid renewal completes.

### 17.5 Manual-Renewal Implementation Evidence

Manual renewal has been validated with:

- success at exact maturity;
- success one second before the grace-period end;
- rejection one second before maturity;
- rejection at the exact grace-period end;
- rejection after the grace-period end;
- current-owner authorization;
- transferred-owner authorization;
- unrelated-caller rejection;
- approved-operator rejection;
- invalid old-deposit rejection;
- invalid selected-plan rejection;
- disabled selected-plan rejection;
- same-plan renewal;
- selected-plan minimum and maximum enforcement;
- old-plan update and disable isolation;
- selected-plan snapshot validation;
- positive-interest compounding;
- zero-rounded-interest renewal;
- SavingCore pause enforcement;
- positive-interest VaultManager pause enforcement;
- zero-interest VaultManager bypass;
- underfunded-vault rollback;
- unauthorized-vault rollback;
- failed safe-mint rollback;
- ERC20 callback reentrancy protection;
- ERC721 callback reentrancy protection;
- old-certificate retention;
- new-certificate ownership;
- user balance conservation;
- total-supply conservation;
- lifecycle exclusion between renewal and both withdrawal paths;
- `tokenId == depositId` for the renewed deposit.

Permissionless auto-renewal is implemented and validated in Phase 9.

## 18. Auto-Renew Flow

Permissionless auto-renewal is implemented through:

`autoRenew(uint256 depositId)`

The function returns the identifier of the newly created deposit.

Auto-renew becomes valid when:

`block.timestamp >= maturityAt + GRACE_PERIOD`

At one second before the grace-period end, the function reverts with
`AutoRenewalTooEarly`.

At the exact grace-period end, the function is valid.

The implemented flow is:

1. Verify that `SavingCore` is not paused.
2. Verify that the old deposit exists.
3. Verify that the old deposit remains `Active`.
4. Calculate `graceEndsAt = maturityAt + GRACE_PERIOD`.
5. Revert with `AutoRenewalTooEarly` when the timestamp is earlier than
   `graceEndsAt`.
6. Resolve the current owner of the old ERC721 certificate.
7. Read the old deposit's plan ID, principal, tenor, APR, and penalty
   snapshots.
8. Calculate interest for exactly one old term.
9. Calculate `newPrincipal = oldPrincipal + oldInterest`.
10. Start the new term at the successful auto-renew transaction timestamp.
11. Calculate the new maturity using the old tenor snapshot.
12. Allocate the next sequential deposit and NFT identifier.
13. Mark the old deposit as `AutoRenewed`.
14. Create one new `Active` deposit.
15. Preserve the old plan ID, tenor, APR, and penalty snapshots.
16. For positive interest, transfer the complete interest amount from
    `VaultManager` into `SavingCore`.
17. Skip the VaultManager payout when interest rounds down to zero.
18. Safely mint the new certificate to the current owner of the old
    certificate.
19. Emit `Renewed(oldDepositId, newDepositId, newPrincipal, oldPlanId)`.

Auto-renew does not emit:

- `DepositOpened`;
- `Withdrawn`.

### 18.1 Permissionless Execution and Ownership

Any address may call `autoRenew`.

The caller may be:

- the current certificate owner;
- an unrelated account;
- a low-privilege automation wallet;
- another smart contract.

The caller does not gain economic rights merely because it submits the
transaction.

The new NFT is always minted to the current owner returned by
`ownerOf(oldDepositId)`.

Transferring the old certificate before execution changes the recipient of the
new certificate.

ERC721 approval is irrelevant to permissionless triggering and does not allow
the caller to redirect the recipient.

### 18.2 Snapshot and Plan Semantics

The new deposit preserves the old deposit's:

- plan ID;
- tenor snapshot;
- APR snapshot;
- early-withdrawal penalty snapshot.

Auto-renew does not read the current plan's:

- APR;
- enabled state;
- minimum deposit;
- maximum deposit.

Therefore:

- changing the original plan APR does not alter auto-renew terms;
- disabling the original plan does not block auto-renew;
- compounded principal may exceed the original plan maximum;
- current plan limits are not reapplied;
- no administrator action can retroactively replace the old snapshots.

### 18.3 Delayed Execution

Passing time does not execute auto-renew automatically.

If the function is called several terms after eligibility:

- exactly one new deposit is created;
- exactly one old term of interest is calculated;
- no retroactive multi-term catch-up occurs;
- the new term begins at the actual execution timestamp;
- the new maturity is one preserved tenor after that timestamp.

### 18.4 Interest Funding

Positive old-term interest is physically transferred through:

`vaultManager.payInterest(address(this), interest)`

The recipient is `SavingCore` because the interest becomes part of the new
active deposit principal.

After successful positive-interest auto-renew:

- the user wallet balance is unchanged;
- total MockUSDC supply is unchanged;
- VaultManager balance decreases by the interest;
- SavingCore balance increases by the same amount;
- new principal equals old principal plus funded interest.

If interest rounds down to zero:

- `VaultManager.payInterest` is not called;
- no `InterestPaid` event is emitted;
- new principal equals old principal;
- auto-renew may succeed while only VaultManager is paused.

The system never creates unfunded compounded principal.

### 18.5 Atomicity and Reentrancy

`autoRenew` uses:

- `whenNotPaused`;
- `nonReentrant`;
- checks-effects-interactions ordering.

The implementation updates lifecycle state before external calls.

EVM atomicity restores all earlier changes when a required later interaction
fails.

Validated rollback scenarios include:

- underfunded VaultManager;
- paused VaultManager during positive-interest execution;
- unauthorized SavingCore;
- failed ERC721 safe mint.

A failed transaction restores:

- old deposit status;
- deposit count;
- absence of the new deposit;
- absence of the new NFT;
- old NFT ownership;
- SavingCore token balance;
- VaultManager token balance;
- total token supply.

Validated callback surfaces include:

- ERC20 callback while VaultManager transfers interest;
- ERC721 `onERC721Received` callback during the new NFT mint.

Nested auto-renew attempts revert with
`ReentrancyGuardReentrantCall`, while the original valid transaction may
complete.

### 18.6 Lifecycle Ordering

After the grace-period end, both of these may be valid while the old deposit
remains `Active`:

- maturity withdrawal by the current owner;
- permissionless auto-renew by any caller.

The first successfully mined transaction changes the old deposit to a terminal
status.

If maturity withdrawal succeeds first, later auto-renew reverts because the
deposit is no longer active.

If auto-renew succeeds first, later maturity withdrawal, early withdrawal, or
renewal attempts revert because the old status is `AutoRenewed`.

### 18.7 Phase 9 Implementation Evidence

Permissionless auto-renew has been validated with:

- rejection one second before the grace-period end;
- success at the exact grace-period end;
- unrelated permissionless caller execution;
- current-owner-safe NFT receipt;
- certificate transfer before auto-renew;
- old-plan APR update and disable isolation;
- preservation of tenor, APR, and penalty snapshots;
- original-plan limit bypass;
- one-term-only delayed execution;
- no retroactive catch-up;
- positive-interest funded compounding;
- zero-rounded-interest execution;
- SavingCore pause enforcement;
- positive-interest VaultManager pause enforcement;
- zero-interest VaultManager bypass;
- underfunded-vault rollback;
- unauthorized-vault rollback;
- failed safe-mint rollback;
- ERC20 callback reentrancy protection;
- ERC721 callback reentrancy protection;
- repeated auto-renew rejection;
- withdrawal rejection after auto-renew;
- auto-renew rejection after maturity withdrawal;
- old-certificate retention;
- new-certificate ownership;
- user balance conservation;
- total-supply conservation;
- `tokenId == depositId` for the renewed deposit.
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

C1 is implemented and validated locally as of Phase 11.

### 23.1 Problem

Reverting the complete maturity transaction when VaultManager lacks sufficient
interest liquidity can indirectly lock depositor principal even though that
principal remains fully held by `SavingCore`.

### 23.2 Implemented Settlement Behavior

At maturity:

- the deposit must exist and remain `Active`;
- only the direct current ERC721 owner may settle it;
- principal is transferred from `SavingCore` to that current owner;
- calculated interest continues to use the immutable deposit snapshots;
- fully funded interest is paid immediately through VaultManager;
- zero-rounded interest skips VaultManager;
- an exact VaultManager `InsufficientVaultBalance` error defers the full
  calculated interest;
- the deposit becomes terminal with status `Withdrawn`;
- `Withdrawn.interest` equals interest paid immediately in that transaction,
  so it is zero for a deferred settlement;
- `InterestDeferred` records the deposit, claimant, and deferred amount.

Implemented storage:

- `pendingInterest[depositId]`;
- `interestClaimant[depositId]`.

Implemented later-claim function:

- `claimPendingInterest(depositId)`.

### 23.3 Claimant Snapshot

The claimant is the direct current NFT owner at the moment maturity settlement
succeeds.

After that snapshot:

- transferring the historical NFT does not transfer the pending claim;
- an approved ERC721 operator does not gain claim authority;
- an unrelated account cannot claim;
- the historical `interestClaimant` value remains stored after payment.

### 23.4 Claim Execution

`claimPendingInterest`:

1. verifies that the deposit exists;
2. requires a nonzero pending amount;
3. requires the caller to equal the snapshotted claimant;
4. clears `pendingInterest[depositId]` before external interaction;
5. requests the full amount from VaultManager;
6. emits `PendingInterestClaimed` after successful payout.

If VaultManager payout fails, EVM rollback restores the pending amount.

Partial claims and user-selected recipients are not supported.

### 23.5 C1 Invariants

The implementation ensures that:

- principal cannot be paid twice;
- pending interest cannot be claimed twice;
- only the snapshotted claimant may claim;
- post-settlement NFT transfer does not alter the claimant;
- the deposit remains terminal after principal-first settlement;
- a settled deposit cannot renew;
- pending-interest recording does not create principal;
- claim failure does not erase debt;
- callback reentrancy cannot produce a duplicate claim;
- manual renewal and auto-renew remain fully funded operations without a
  pending-interest fallback.

### 23.6 Phase 11 Validation Evidence

Validated behavior includes:

- fully funded maturity settlement;
- underfunded principal-first settlement;
- partially funded vault with full-value deferral and no partial payout;
- zero-rounded interest;
- transfer before settlement;
- transfer after settlement;
- approved-operator rejection;
- unrelated-caller rejection;
- successful later funding and claim;
- double-claim rejection;
- SavingCore pause;
- VaultManager pause and retry;
- underfunded claim rollback;
- unauthorized VaultManager failure rollback;
- empty-revert-data rollback;
- pending-interest payout callback reentrancy protection;
- `173` SavingCore tests;
- `233` complete project tests;
- 100% SavingCore statements, branches, functions, and lines.

---

## 24. Bonus C2 — Solvency Guard

C2 is implemented and validated locally as of Phase 12.

### 24.1 Problem

Without liability accounting, an administrator could withdraw vault funds that
are economically expected to cover active-deposit or pending-interest
obligations.

### 24.2 Implemented Accounting Model

`SavingCore` stores:

`totalReservedInterest`

The aggregate includes:

- expected positive interest for active deposits;
- unpaid C1 pending interest.

Reserve calculations use the deposit's snapshotted:

- principal;
- APR;
- tenor.

A zero-rounded expected-interest amount creates no reservation.

### 24.3 Implemented Lifecycle Transitions

- deposit opening: reserve one positive expected-interest amount;
- early withdrawal: release the old term's full unused reserve;
- funded maturity settlement: consume the old reserve;
- C1 deferred maturity settlement: keep the unpaid amount reserved;
- successful pending-interest claim: consume the remaining reserve;
- manual renewal: consume the old reserve and create the new selected-plan
  reserve atomically;
- auto-renew: consume the old reserve and create the new snapshot-based reserve
  atomically.

Every transition occurs in the same transaction as the related lifecycle
action. A later revert restores the previous reserve value.

### 24.4 Vault Read and Enforcement Model

After one-time SavingCore authorization, VaultManager reads:

`SavingCore.totalReservedInterest()`

Before authorization, `VaultManager.totalReservedInterest()` returns zero.

Available liquidity is:

`max(vaultBalance - totalReservedInterest, 0)`

Funding shortfall is:

`max(totalReservedInterest - vaultBalance, 0)`

`withdrawVault(amount)` rejects any amount above available liquidity.

Vault funding and direct token transfers change vault balance but do not mutate
liabilities.

### 24.5 Undercollateralization Decision

Opening a valid deposit is not blocked when current vault liquidity is below
the new aggregate reserve.

This preserves ADR-029:

- principal remains separated in SavingCore;
- liabilities remain visible;
- funding shortfall is explicit;
- administrator withdrawal cannot worsen the shortfall;
- C1 can return principal and defer interest if the shortfall remains at
  maturity.

C2 is a solvency-visibility and withdrawal-containment mechanism. It does not
guarantee that all interest is immediately funded.

### 24.6 Validation Evidence

Phase 12 validates:

- reservation and zero-rounded-interest behavior;
- APR and tenor snapshot isolation;
- open-deposit rollback;
- early release and repeated-action rejection;
- funded maturity consumption;
- deferred-interest reserve preservation;
- successful and failed pending claims;
- manual and auto-renew reserve replacement;
- renewal rollback;
- reserve-underflow invariant protection;
- balance above, equal to, and below reserve;
- exact available withdrawal;
- one-unit-over withdrawal rejection;
- funding and direct-transfer metric updates;
- 185 SavingCore tests;
- 55 VaultManager tests;
- 253 total tests;
- 100% statements, branches, functions, and lines for SavingCore;
- 100% statements, functions, and lines for VaultManager.

## 25. Contract Dependency Model

The implemented dependency relationship is:

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

VaultManager uses one-time post-deployment SavingCore authorization.

The authorization:

- is owner-only;
- rejects the zero address;
- rejects externally owned accounts;
- requires deployed bytecode;
- emits `SavingCoreAuthorized`;
- cannot be replaced in the current non-upgradeable architecture.

The same authorized address is used for interest payouts and as the source read
by VaultManager's solvency getters.

---

## 26. Implemented Local Deployment Relationship

Phase 13 implements the local deployment sequence:

1. Deploy `MockUSDC`.
2. Deploy `VaultManager`.
3. Deploy `SavingCore`.
4. Authorize the deployed `SavingCore` exactly once in `VaultManager`.
5. Verify all contract relationships and ownership state.
6. Create or verify the canonical plan.
7. Reconcile deterministic demo-user balances.
8. Reconcile the target vault balance.
9. Verify C2 reserve, available-liquidity, and funding-shortfall formulas.
10. Leave the base seed with no deposit certificates.

Exact constructor configuration:

- `MockUSDC()`;
- `VaultManager(tokenAddress, adminAddress, feeReceiverAddress)`;
- `SavingCore(tokenAddress, vaultManagerAddress, adminAddress)`.

The one-time authorization step occurs before the deployment is considered
ready and before operational seed verification completes.

### 26.1 Local Network Modes

The configured local modes are:

- `hardhat`:
  - chain ID `31337`;
  - ephemeral execution;
  - deployment records are not saved;
- `localhost`:
  - RPC URL `http://127.0.0.1:8545`;
  - chain ID `31337`;
  - deployment records are saved for reuse;
  - generated records remain ignored by Git.

Every Phase 13 deploy and seed script rejects:

- a network name other than `hardhat` or `localhost`;
- a chain ID other than `31337`.

### 26.2 Deterministic Local Roles

The default Hardhat accounts are mapped as:

| Role | Account index | Local address |
|---|---:|---|
| Deployer and administrator | 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Fee receiver | 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| Demo user one | 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| Demo user two | 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| Permissionless keeper | 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |

These addresses are deterministic only for the standard local Hardhat mnemonic.
They are not Sepolia addresses and must not be treated as portable public
configuration.

### 26.3 Canonical Demo Seed

The canonical plan is plan ID `1`:

- tenor: 180 days;
- APR: 200 bps;
- minimum deposit: 100 mUSDC;
- maximum deposit: 10,000 mUSDC;
- early-withdrawal penalty: 750 bps;
- enabled: true.

Deterministic balance targets:

- demo user one: 5,000 mUSDC;
- demo user two: 10,000 mUSDC;
- VaultManager: 25,000 mUSDC.

The base seed creates no deposits. Therefore its initial C2 state is:

- `totalReservedInterest = 0`;
- `availableLiquidity = 25,000 mUSDC`;
- `fundingShortfall = 0`.

### 26.4 Idempotency

The persistent localhost workflow is intentionally rerunnable:

- deployed contracts are reused when deployment records match;
- SavingCore authorization is skipped when the expected address is already
  authorized;
- the canonical plan is created only when no plan exists and is always
  verified;
- demo users are minted only the delta below their target balances;
- the vault is funded only the delta below its exact target;
- a vault balance above the target causes a failure instead of hiding drift.

### 26.5 Address and ABI Consumption

Phase 13 does not commit a separate local address file.

Local contract addresses come from the `hardhat-deploy` records or the
read-only verification output.

The retained ABI set is restricted to:

- MockUSDC;
- VaultManager;
- SavingCore.

Test mocks and the internal reserve interface are excluded from production ABI
output.

The local deployment relationship above remains the authoritative Phase 13
baseline. Phase 14 public deployment is documented separately below.

## 26.6 Implemented Sepolia Public Deployment

Phase 14 adds a separate public workflow without changing the Phase 13 local
deployment model.

Dedicated script:

`deploy/10_deploy_sepolia.ts`

Required public environment:

- network name `sepolia`;
- chain ID `11155111`;
- exactly one configured signer;
- deployer, owner, and fee receiver
  `0xA998526b0A5F23680f50fa3677f5c6576Dba89d9`;
- two confirmations for new deployment and setup transactions.

Public contract addresses:

| Contract | Address |
|---|---|
| MockUSDC | `0xcf779EC5D80573D3254054a17c5B4f0117491662` |
| VaultManager | `0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7` |
| SavingCore | `0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443` |

Public initialization:

1. deploy the three contracts with exact constructor relationships;
2. authorize SavingCore once;
3. create canonical plan ID `1`;
4. verify bytecode, metadata, ownership, pause states, Personal Variant,
   canonical plan, and C2 formulas;
5. create no demo mint, vault funding, or default deposit.

Tracked records:

- `deployments/sepolia/.chainId`;
- `deployments/sepolia/MockUSDC.json`;
- `deployments/sepolia/VaultManager.json`;
- `deployments/sepolia/SavingCore.json`;
- `data/deployments/sepolia.json`.

Generated `deployments/*/solcInputs/` remain ignored.

A validated rerun reused all contracts, skipped the correct authorization,
preserved plan ID `1`, kept nonce `5`, and sent no transaction.

All three contracts were successfully verified on Etherscan with exact
constructor arguments. Verified source improves transparency but does not
replace an independent security audit.

## 27. Implemented Security Building Blocks

The implemented defense-in-depth controls include:

- `Ownable2Step`;
- independent `Pausable` state;
- `ReentrancyGuard`;
- `SafeERC20`;
- safe ERC721 minting;
- direct current-owner authorization;
- immutable financial snapshots;
- exact timestamp and terminal-state validation;
- zero-address and deployed-bytecode dependency validation;
- one-time SavingCore authorization;
- aggregate reserve accounting and available-liquidity enforcement;
- network-name and chain-ID deployment guards;
- deterministic local role separation;
- post-deployment bytecode and relationship verification;
- fail-closed authorization and seed mismatch handling;
- idempotent persistent-local deployment behavior;
- production-only ABI export;
- ignored local deployment records and temporary outputs.

These controls reduce identified risks but do not constitute a professional
audit or make the capstone production-ready.

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

Reserve releases and consumption must not underflow or be applied twice.

### 28.13 Vault Withdrawal Invariant

Administrator withdrawals cannot exceed available liquidity.

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

The frontend product architecture separates the implemented User Banking App from the planned Admin Portal through visibly separate applications or route groups.

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

Resolved and implemented through Phase 13:

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
17. Maturity settlement uses principal-first full-or-defer behavior only for the exact VaultManager `InsufficientVaultBalance` error.
18. Manual renewal is valid only during
    `maturityAt <= now < maturityAt + GRACE_PERIOD`.
19. Manual renewal before maturity reuses `DepositNotMatured`.
20. Manual renewal at or after the grace-period end reverts with
    `ManualRenewalWindowClosed`.
21. Only the direct current old-certificate owner may manually renew.
22. Approved ERC721 operators do not gain manual-renewal authority.
23. Old-term renewal interest uses immutable old-deposit snapshots.
24. Disabling the old plan does not remove existing renewal rights.
25. The selected new plan must exist and be enabled.
26. Same-plan manual renewal is allowed while that plan is enabled.
27. Selected-plan limits apply to compounded new principal.
28. Positive renewal interest is transferred from VaultManager into
    SavingCore.
29. Zero-rounded renewal interest skips the VaultManager payout.
30. Successful renewal retains the old NFT and mints a new NFT.
31. Successful renewal changes the old status to `ManualRenewed`.
32. The new deposit snapshots the selected plan's current terms.
33. Failed payout or failed safe mint reverts the complete renewal.
34. Manual renewal is protected against ERC20 and ERC721 callback
    reentrancy.
35. `autoRenew(depositId)` is permissionless.
36. Auto-renew is valid at and after the exact grace-period end.
37. `AutoRenewalTooEarly` rejects execution before that boundary.
38. The new NFT is minted to the current owner of the old certificate,
    never to the caller merely because it submitted the transaction.
39. Auto-renew preserves the old plan ID, tenor, APR, and penalty
    snapshots.
40. Current plan APR, enabled state, minimum, and maximum are not
    reapplied during auto-renew.
41. One delayed auto-renew transaction creates exactly one new term and
    pays exactly one old term of interest.
42. The new term starts at the execution timestamp.
43. Positive interest must be funded by VaultManager before it remains
    part of the new principal.
44. Zero-rounded interest skips the VaultManager payout.
45. Successful execution changes the old status to `AutoRenewed`, creates
    one new `Active` deposit, and safely mints one new certificate.
46. Maturity withdrawal and auto-renew follow first-successfully-mined
    terminal-action ordering after grace.
47. Failed payout, authorization, pause, or safe-mint interactions revert
    the complete auto-renew transaction.
48. Auto-renew is protected against ERC20 and ERC721 callback reentrancy.
49. SavingCore records aggregate positive expected and pending interest.
50. Zero-rounded expected interest creates no reserve.
51. Early withdrawal releases the unused old-term reserve.
52. Funded maturity and successful pending claims consume reserve.
53. C1 deferred interest remains reserved until paid.
54. Manual and auto-renew atomically replace old and new reserves.
55. VaultManager reads reserve from the one-time authorized SavingCore.
56. Available liquidity and funding shortfall use saturating subtraction.
57. Owner withdrawal cannot exceed available liquidity.
58. Undercollateralized deposit opening remains permitted and visible.

Still deferred:

1. Rich NFT metadata and external token-URI presentation.
2. Final frontend framework.
3. Final AI provider.
4. Deployment-address configuration format.

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

## 37. Current Architecture Status

Implemented and validated through Phase 15:

- non-upgradeable MockUSDC, SavingCore, and VaultManager architecture;
- principal and interest custody separation;
- saving-plan administration and immutable deposit snapshots;
- ERC721 certificate issuance and current-owner economic rights;
- maturity withdrawal, early withdrawal, manual renewal, and permissionless
  auto-renewal;
- exact timestamp boundaries and first-mined terminal-action ordering;
- funded renewal compounding;
- C1 principal-first settlement and deferred-interest claims;
- C2 aggregate reserve lifecycle accounting;
- C2 available-liquidity and funding-shortfall calculations;
- C2 owner-withdrawal protection;
- atomic rollback and callback reentrancy protection;
- deterministic local deployment and seed architecture;
- local-only network and chain-ID guards;
- exact constructor and role configuration;
- one-time SavingCore authorization;
- ephemeral Hardhat and persistent localhost modes;
- idempotent persistent-local reconciliation;
- production-only ABI export;
- read-only local deployment verification;
- dedicated guarded Sepolia deployment and preflight;
- public receipt and state verification;
- canonical public plan ID `1`;
- tracked public deployment records and compact metadata;
- React, TypeScript, Vite, and ethers v6 User Banking App architecture;
- read-only public Sepolia access separated from wallet-authorized writes;
- wallet connection, Sepolia guards, exact-amount approval, deposit opening,
  certificate portfolio, lifecycle actions, and C1 claims;
- C2 interest-vault transparency in the user interface;
- Vietnamese and English localization with Vietnamese as the default;
- frontend regression, lint, typecheck, production-build, and preview-smoke
  validation;
- idempotent public deployment reuse;
- Etherscan verification for all three production contracts;
- 5 deployment workflow tests;
- 185 SavingCore tests, 55 VaultManager tests, 13 MockUSDC tests, and
  258 total tests;
- production coverage of 100% statements, 98.40% branches, 100% functions,
  and 100% lines;
- SavingCore deployed bytecode approximately `12.654 KiB`;
- SavingCore initcode approximately `13.905 KiB`;
- VaultManager deployed bytecode approximately `3.483 KiB`;
- VaultManager initcode approximately `3.897 KiB`.

Not implemented:

- rich NFT metadata or custom `tokenURI`;
- Admin Portal;
- AI assistants;
- demonstration video;
- final submission audit.

The Phase 15 User Banking App is implemented and validated against the tracked
public Sepolia deployment.

Local deterministic addresses are development artifacts, not public deployment
addresses.

Sections covering the Admin Portal and AI remain specifications until their
implementations are validated.

This document is a living architecture record updated through Phase 15.
