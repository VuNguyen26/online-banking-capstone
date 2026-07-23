<h1 align="center">SafeBank</h1>

<p align="center">
  <strong>Blockchain Term Deposit System</strong>
</p>

<p align="center">
  A fixed-term savings protocol with transferable ERC721 certificates,<br>
  separate principal and interest custody, principal-first settlement,<br>
  and reserve-aware solvency controls.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.28-363636?style=flat-square&logo=solidity&logoColor=white" alt="Solidity 0.8.28">
  <img src="https://img.shields.io/badge/Hardhat-2.28.6-C9A800?style=flat-square" alt="Hardhat 2.28.6">
  <img src="https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="Strict TypeScript">
  <img src="https://img.shields.io/badge/Network-Sepolia-5B5BD6?style=flat-square&logo=ethereum&logoColor=white" alt="Ethereum Sepolia">
</p>

<p align="center">
  <a href="#compile-and-test-contracts"><img src="https://img.shields.io/badge/Contract_tests-258_passing-2E7D32?style=flat-square" alt="258 contract tests passing"></a>
  <a href="#run-the-frontend"><img src="https://img.shields.io/badge/Frontend_tests-262_passing-2E7D32?style=flat-square" alt="262 frontend tests passing"></a>
  <a href="#compile-and-test-contracts"><img src="https://img.shields.io/badge/Production_coverage-98.40%25_branches-1565C0?style=flat-square" alt="98.40 percent production branch coverage"></a>
  <a href="#sepolia-deployment"><img src="https://img.shields.io/badge/Etherscan-3_contracts_verified-1565C0?style=flat-square" alt="Three contracts verified on Etherscan"></a>
</p>

<p align="center">
  <a href="#overview">Overview</a>
  &middot;
  <a href="#personal-variant">Personal Variant</a>
  &middot;
  <a href="#architecture">Architecture</a>
  &middot;
  <a href="#design-answers">Design Answers</a>
  &middot;
  <a href="#sepolia-deployment">Sepolia Deployment</a>
  &middot;
  <a href="#compile-and-test-contracts">Testing</a>
  &middot;
  <a href="#documentation">Documentation</a>
</p>

---

## Overview

SafeBank is an educational blockchain-based fixed-term savings application developed for the **Blockchain Programming Final Project - Online Banking System**.

Users deposit six-decimal MockUSDC into `SavingCore`, receive a transferable ERC721 deposit certificate, and later withdraw or renew according to the deposit's on-chain state. Bank-funded interest is held separately in `VaultManager`.

> [!NOTE]
> MockUSDC is freely mintable test currency with no real-world monetary value. SafeBank is not a production banking service and has not received an independent professional security audit.

## Personal Variant

Student ID: `3122560090`

The final two digits are:

- `A = 0`;
- `B = 9`.

| Parameter | Assignment formula | SafeBank value |
|---|---|---:|
| Grace period | `(A mod 3) + 2 days` | `2 days` |
| Default plan APR | `200 + A × 25 bps` | `200 bps = 2.00%` |
| Early-withdrawal penalty | `300 + B × 50 bps` | `750 bps = 7.50%` |
| Default plan tenor | `B` odd → `180 days` | `180 days` |
| MockUSDC decimals | Fixed assignment requirement | `6` |

All MockUSDC calculations use six-decimal smallest units:

- `1 mUSDC = 1,000,000` units;
- `1,000 mUSDC = 1,000,000,000` units;
- scripts, tests, and frontend calculations use `parseUnits(value, 6)`;
- `parseEther` is not used for MockUSDC amounts.

## Validation Snapshot

| Area | Last validated result |
|---|---|
| Smart-contract suite | `258` tests passing |
| Deployment regression | `5` tests passing |
| Production-contract coverage | `100%` statements, `98.40%` branches, `100%` functions, `100%` lines |
| Complete-project coverage | `99.11%` statements, `97.17%` branches, `96.97%` functions, `96.98%` lines |
| Frontend suite | `65` test files and `262` tests passing |
| Frontend quality gates | `0` Oxlint warnings or errors; TypeScript and production build passing |
| Sepolia deployment | Three production contracts deployed and verified on Etherscan |
| Repository audit | Documentation reconciled, repository audited, and tracked source clean |

Implemented product scope includes:

- all mandatory smart-contract flows;
- Bonus C1 - Principal-First Settlement;
- Bonus C2 - Solvency Guard;
- deterministic local deployment and demo seed;
- guarded Sepolia deployment and state verification;
- React User Banking App and Admin Portal;
- Vietnamese and English interfaces;
- deterministic Banking and Risk Assistants;
- responsive loading, empty, error, confirmation, and transaction states.

Remaining final-submission work:

- demonstration video;
- final submission packaging.

Rich NFT metadata and a custom `tokenURI` are intentionally not implemented.

## Implemented Scope

### Mandatory Capstone Scope

SafeBank implements:

- six-decimal permissionless-mint `MockUSDC`;
- separate principal and interest custody;
- administrator-managed saving plans;
- immutable APR, penalty, and tenor snapshots per deposit;
- ERC721 deposit certificates;
- maturity withdrawal;
- early withdrawal with snapshotted penalty;
- manual renewal during the two-day grace period;
- permissionless auto-renew after the grace period;
- pause and unpause controls;
- required lifecycle events;
- Hardhat test coverage above 90%;
- React demonstration frontend;
- all seven required Design Answers.

### Selected Bonus Challenges

SafeBank implements both selected bonus challenges:

- **C1 — Principal-First Settlement:** principal can be returned at maturity even when the interest vault cannot pay the complete calculated interest. The full unpaid amount becomes a claimant-specific pending liability.
- **C2 — Solvency Guard:** expected and pending interest are reserved, exposed through solvency metrics, and excluded from administrator-withdrawable vault liquidity.

### Product Extensions

The project additionally implements:

- Vietnamese and English User Banking App;
- Admin Portal in the same React application;
- explicit transaction confirmation workflows;
- deterministic Banking Assistant;
- deterministic Risk Assistant;
- responsive Spline robot assistant launcher;
- local and Sepolia deployment verification utilities.

The assistants are local deterministic explanation engines. They do not call an external LLM, connect a wallet, obtain a signer, or submit transactions.

## Architecture

SafeBank uses three production contracts.

| Contract | Responsibility |
|---|---|
| `MockUSDC` | Six-decimal ERC20 test token with public minting |
| `SavingCore` | Saving plans, principal custody, deposit lifecycle, ERC721 certificates, C1 pending interest, and C2 liability accounting |
| `VaultManager` | Bank-funded interest liquidity, fee receiver, interest payouts, administrator withdrawals, and solvency reads |

The primary custody invariant is:

> [!IMPORTANT]
> **Primary custody invariant:** `SavingCore` holds user principal. `VaultManager` holds bank-funded interest liquidity.

Interest is never funded from another depositor's principal.

The contracts are non-upgradeable. This avoids proxy administration, initializer, storage-layout, and upgrade-governance complexity for the Capstone.

~~~mermaid
flowchart LR
    User[Depositor or NFT Owner]
    Admin[Bank Administrator]
    Keeper[Permissionless Keeper]
    UI[React Frontend]

    Token[MockUSDC]
    Core[SavingCore]
    Vault[VaultManager]
    NFT[ERC721 Certificate]

    UI --> User
    UI --> Admin

    User -->|approve and open deposit| Core
    User -->|withdraw or manually renew| Core
    Keeper -->|trigger auto-renew| Core
    Admin -->|manage plans| Core
    Admin -->|fund and manage vault| Vault

    Core -->|principal custody| Token
    Core -->|mint certificate| NFT
    Core -->|request interest| Vault
    Vault -->|bank-funded interest| Token
~~~

## Core Contracts

### MockUSDC

`MockUSDC` is a demonstration ERC20 token with:

- token name `Mock USD Coin`;
- symbol `mUSDC`;
- exactly 6 decimals;
- public permissionless minting;
- no backing, redemption, tax, blacklist, or real-world value.

Public minting is appropriate only for testing and demonstrations.

### SavingCore

`SavingCore` is responsible for:

- saving-plan creation and management;
- principal custody;
- plan validation;
- deposit creation;
- APR, penalty, and tenor snapshots;
- ERC721 certificate minting;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- permissionless auto-renew;
- pending-interest accounting;
- pending-interest claims;
- aggregate reserved-interest accounting;
- lifecycle and financial events.

The ERC721 collection is:

- name: `SafeBank Deposit Certificate`;
- symbol: `SBDC`.

For every deposit:

~~~text
tokenId == depositId
~~~

Plan IDs and deposit IDs begin at `1`. Identifier `0` is invalid.

### VaultManager

`VaultManager` is responsible for:

- bank-funded interest custody;
- vault funding;
- owner withdrawals;
- fee-receiver configuration;
- one-time SavingCore authorization;
- interest payouts;
- independent pause and unpause;
- reserved-interest reads;
- available-liquidity calculation;
- funding-shortfall calculation.

`VaultManager` does not hold user principal.

## Saving Plan Model

Each plan stores:

| Field | Meaning |
|---|---|
| `tenorDays` | Length of the deposit term |
| `aprBps` | Annual rate in basis points |
| `minDeposit` | Optional minimum principal |
| `maxDeposit` | Optional maximum principal |
| `earlyWithdrawPenaltyBps` | Early-withdrawal penalty |
| `enabled` | Whether new deposits may use the plan |

After plan creation:

- APR may be updated for future deposits;
- enabled state may change;
- tenor, deposit limits, and penalty remain immutable;
- existing deposits continue using their stored snapshots.

A disabled plan cannot accept a new deposit and cannot be selected for manual renewal.

## Deposit Lifecycle

A deposit stores:

- selected plan ID;
- principal;
- start timestamp;
- maturity timestamp;
- tenor snapshot;
- APR snapshot;
- early-withdrawal penalty snapshot;
- lifecycle status.

The base statuses are:

- `Active`;
- `Withdrawn`;
- `ManualRenewed`;
- `AutoRenewed`.

An active deposit may reach exactly one terminal transition:

- `Active → Withdrawn` through maturity withdrawal;
- `Active → Withdrawn` through early withdrawal;
- `Active → ManualRenewed`;
- `Active → AutoRenewed`.

Renewal creates a new active deposit and a new ERC721 certificate. The old certificate remains as historical evidence, while the terminal status of its deposit prevents reuse.

## Ownership Model

For active owner-restricted actions, economic rights follow the direct current NFT owner:

~~~solidity
address currentOwner = ownerOf(depositId);
~~~

The current owner may:

- withdraw early;
- withdraw at maturity;
- manually renew.

The original depositor loses those rights after transferring the certificate.

ERC721 token approval or operator approval alone does not grant the right to withdraw or manually renew because the contract compares `msg.sender` directly with `ownerOf(depositId)`.

Permissionless auto-renew is different: any address may trigger it, but the renewed NFT is always minted to the current owner of the old certificate.

A pending C1 interest claim is also different. Its claimant is snapshotted at maturity settlement and does not move with a later transfer of the historical NFT.

## Financial Calculations

### Simple Interest

SafeBank uses simple interest for one term:

~~~text
interest =
    principal × aprBpsAtOpen × tenorSeconds
    ÷ (365 days × 10,000)
~~~

Where:

~~~text
tenorSeconds = tenorDays × 86,400
~~~

The implementation uses `Math.mulDiv`:

~~~solidity
return Math.mulDiv(
    principal,
    aprBps * tenorSeconds,
    365 days * BPS_DENOMINATOR
);
~~~

Solidity integer division rounds down.

Interest does not compound inside a deposit term. Compounding occurs only when a renewal successfully creates a new deposit whose principal is:

~~~text
newPrincipal = oldPrincipal + fundedInterest
~~~

For positive interest, the tokens must physically move from `VaultManager` into `SavingCore`. The project never creates unfunded compounded principal.

### Early-Withdrawal Penalty

The penalty is:

~~~text
penalty =
    principal × penaltyBpsAtOpen ÷ 10,000
~~~

The user receives:

~~~text
userReceive = principal - penalty
~~~

Early withdrawal pays zero interest. The current fee receiver receives the penalty.

## Exact Time Boundaries

SafeBank uses explicit, non-overlapping timestamp rules.

| Time | Valid behavior |
|---|---|
| `timestamp < maturityAt` | Early withdrawal |
| `timestamp == maturityAt` | Maturity withdrawal and manual renewal begin |
| `maturityAt <= timestamp < graceEndsAt` | Maturity withdrawal or manual renewal |
| `timestamp == graceEndsAt` | Manual renewal is closed; auto-renew becomes valid |
| `timestamp > graceEndsAt` | Maturity withdrawal or permissionless auto-renew while the deposit remains active |

Where:

~~~text
graceEndsAt = maturityAt + GRACE_PERIOD
~~~

Time passing alone never executes Solidity code. A transaction must be mined to change a deposit's stored state.

After the grace period, maturity withdrawal and auto-renew may both be valid while the old deposit remains `Active`. The first successfully mined transaction changes the status, and the later conflicting transaction reverts.

## Withdrawal and Renewal Behavior

### Maturity Withdrawal

`withdrawAtMaturity(depositId)` requires:

- an existing deposit;
- status `Active`;
- caller equal to the current NFT owner;
- `block.timestamp >= maturityAt`;
- unpaused `SavingCore`.

Principal is returned from `SavingCore`.

Interest is requested from `VaultManager`.

If the complete interest amount is available, the current owner receives principal and interest immediately.

If the vault reports the exact `InsufficientVaultBalance` error, C1 returns principal and records the complete interest amount as pending.

### Early Withdrawal

`earlyWithdraw(depositId)` requires:

- an existing deposit;
- status `Active`;
- caller equal to the current NFT owner;
- `block.timestamp < maturityAt`;
- unpaused `SavingCore`.

The user receives principal minus the snapshotted penalty. The fee receiver receives the penalty, and no interest is paid.

The deposit becomes terminal with status `Withdrawn`.

### Manual Renewal

`manualRenew(depositId, newPlanId)` is valid only when:

~~~text
maturityAt <= block.timestamp < maturityAt + GRACE_PERIOD
~~~

It also requires:

- direct current NFT ownership;
- an active old deposit;
- an existing enabled target plan;
- compounded principal within the selected plan's limits;
- complete funding of any positive old-term interest.

The selected plan's current tenor, APR, and penalty become the new deposit snapshots.

The old NFT remains historical. A new NFT is minted to the current owner.

### Permissionless Auto-Renew

`autoRenew(depositId)` becomes valid when:

~~~text
block.timestamp >= maturityAt + GRACE_PERIOD
~~~

Any address may trigger it.

Auto-renew preserves the old deposit's:

- plan ID;
- tenor snapshot;
- APR snapshot;
- penalty snapshot.

It does not read the current plan APR, enabled state, minimum, or maximum.

One delayed auto-renew transaction creates exactly one new term. It does not create retroactive multiple terms, and the new term starts at the successful transaction timestamp.

## Bonus C1 — Principal-First Settlement

> [!IMPORTANT]
> **Settlement guarantee:** User principal remains recoverable when the bank-funded interest vault cannot pay the complete interest amount.

The base assignment requires maturity withdrawal to revert when the vault cannot pay interest. That behavior can indirectly lock the user's own principal even though `SavingCore` still holds it.

SafeBank instead uses principal-first settlement:

1. mark the active deposit as terminal;
2. return principal from `SavingCore`;
3. attempt the complete interest payout through `VaultManager`;
4. recognize only `VaultManager.InsufficientVaultBalance`;
5. restore the interest reserve after that exact liquidity failure;
6. record the complete amount in `pendingInterest[depositId]`;
7. record the current NFT owner in `interestClaimant[depositId]`;
8. allow that fixed claimant to claim later.

The fallback is full-or-defer. SafeBank does not make a partial interest payment.

Paused, unauthorized, malformed, empty-revert, and unexpected vault failures still revert the complete transaction instead of being treated as normal underfunding.

`claimPendingInterest(depositId)`:

- requires a positive pending amount;
- requires the caller to equal the snapshotted claimant;
- clears pending state before the external payout;
- consumes the matching reserve;
- relies on EVM rollback to restore both if payout fails;
- rejects a second successful claim.

## Bonus C2 — Solvency Guard

> [!IMPORTANT]
> **Solvency boundary:** Reserved interest is excluded from administrator-withdrawable liquidity, while any remaining funding shortfall stays visible on-chain.

`SavingCore.totalReservedInterest` tracks:

- expected positive interest for active deposits;
- unpaid C1 pending interest.

Reserve lifecycle:

- deposit opening: reserve expected positive interest;
- early withdrawal: release unused expected interest;
- funded maturity settlement: consume the reserve;
- C1 deferred settlement: preserve the unpaid reserve;
- successful pending claim: consume the reserve;
- manual renewal: replace the old reserve with the selected new-plan reserve;
- auto-renew: replace the old reserve with the new snapshot-based reserve.

`VaultManager` calculates:

~~~text
availableLiquidity =
    max(vaultBalance - totalReservedInterest, 0)
~~~

~~~text
fundingShortfall =
    max(totalReservedInterest - vaultBalance, 0)
~~~

The administrator cannot withdraw more than `availableLiquidity`.

SafeBank permits an otherwise valid deposit to open while the vault is undercollateralized. The liability remains visible, the administrator cannot worsen the shortfall through withdrawal, and C1 protects principal recovery if interest remains unavailable at maturity.

C2 provides liability visibility and withdrawal containment. It does not guarantee that every interest obligation is immediately funded.

## Frontend

The frontend is one React, TypeScript, and Vite application.

Architecture:

- local `ApplicationView` state switches between User Banking App and Admin Portal;
- both areas use a shared `ApplicationShell`;
- no React Router;
- no Redux or Zustand;
- ethers `JsonRpcProvider` performs public Sepolia reads;
- ethers `BrowserProvider` and a user-approved signer perform writes;
- contract storage and confirmed receipts remain authoritative.

### User Banking App

Implemented user features:

- connect an EIP-1193 browser wallet;
- detect and switch to Ethereum Sepolia;
- read public SafeBank state without a connected wallet;
- view protocol, plan, account, and vault metrics;
- mint test mUSDC;
- approve the exact deposit amount;
- open a deposit;
- view owned ERC721 certificates;
- withdraw early;
- withdraw at maturity;
- manually renew;
- trigger permissionless auto-renew;
- view and claim pending interest;
- use Vietnamese or English;
- open the deterministic Banking Assistant.

### Admin Portal

Implemented administrator features:

- view SavingCore and VaultManager ownership;
- view pending ownership transfers;
- view independent pause states;
- view contract relationships;
- inspect fee receiver;
- create saving plans;
- update plan APR;
- enable or disable plans;
- fund VaultManager;
- withdraw only available liquidity;
- change fee receiver;
- independently pause or unpause both contracts;
- inspect deposits by ID without editing them;
- view solvency and funding-shortfall metrics;
- open the deterministic Risk Assistant.

Frontend access checks improve UX only. Solidity ownership checks remain authoritative.

### Transaction Safety

The frontend:

- requests exact-amount token approval;
- separates approval from deposit opening;
- validates wallet connection and Sepolia chain before writes;
- shows loading, wallet, submitted, confirming, success, and error states;
- uses explicit confirmations for financial and administrator actions;
- refreshes authoritative contract state after confirmed transactions;
- never stores deployment private keys or wallet secrets.

## Deterministic Assistants

SafeBank includes:

- Banking Assistant in the User Banking App;
- Risk Assistant in the Admin Portal.

The assistants:

- receive serializable context created from dashboard data already read by the application;
- normalize control characters and whitespace;
- reject empty questions;
- reject questions longer than 500 characters;
- reject external URLs;
- return four structured sections:
  1. fact;
  2. explanation;
  3. caution;
  4. next step;
- support Vietnamese and English;
- render ordinary React text;
- support cancellation and stale-response protection;
- do not call OpenAI, Gemini, Anthropic, or another external AI API;
- do not import signer or transaction clients;
- cannot approve, deposit, withdraw, renew, claim, fund, pause, or modify plans.

The external Spline scene is only a visual launcher. It is not a financial data source, authorization layer, or part of the deterministic reasoning engine.

## Security Controls

SafeBank applies defense-in-depth through:

- separation of principal and interest custody;
- current-owner authorization;
- `Ownable2Step`;
- independent pause states;
- immutable deposit snapshots;
- active-only lifecycle transitions;
- checks-effects-interactions;
- `ReentrancyGuard`;
- `SafeERC20`;
- safe ERC721 minting;
- exact timestamp boundaries;
- C1 principal-first settlement;
- C2 reserve accounting;
- exact-amount frontend approval;
- explicit wallet and network checks;
- deterministic assistant boundaries.

Important residual risks include:

- compromised administrator ownership;
- insufficient bank funding;
- transaction-ordering competition after grace;
- unsupported or malicious ERC20 behavior;
- RPC or wallet failures;
- user misunderstanding of NFT transfer rights;
- absence of an independent professional audit.

## Required Events

The contracts emit the required assignment events:

- `PlanCreated`;
- `PlanUpdated`;
- `DepositOpened`;
- `Withdrawn`;
- `Renewed`.

Additional events support administration, accounting, and monitoring, including:

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
- inherited pause and ownership events.

## Design Answers

### 1. Transferable certificate

> [!NOTE]
> **Assignment question:** The deposit NFT can be transferred. If Alice sells her NFT to Bob before maturity, who can withdraw - Alice or Bob? Is this behavior good or dangerous? Show the exact line in your code that decides this.

Bob can withdraw because SafeBank assigns active-deposit economic rights to the direct current ERC721 owner, not permanently to the original depositor. The deciding line appears in each owner-restricted action, including `SavingCore.sol:618`, where the contract executes `address currentOwner = ownerOf(depositId);`, followed by a direct comparison between `msg.sender` and `currentOwner`. This behavior gives the certificate real transferable value, but it is dangerous if a user thinks the NFT is only a collectible because transferring it also transfers the right to principal and interest. Tests such as `"transfers withdrawal rights to the current NFT owner"`, `"transfers early-withdrawal rights with the NFT"`, and `"transfers manual-renewal rights and the renewed NFT to the current owner"` prove that the new owner gains the rights and the previous owner loses them.

### 2. Empty vault

> [!NOTE]
> **Assignment question:** A user reaches maturity but the vault does not have enough money for the interest. The spec says "revert". What problem does this create for the user, and what alternative design could you offer (for example: pay principal only, or wait in a queue)? Which one did you choose to follow, and why?

Reverting the complete maturity transaction can lock the user's own principal even though that principal is still safely held by `SavingCore`; the bank can therefore delay principal recovery merely by failing to fund interest. SafeBank implements Bonus C1 and returns principal first, then defers the complete unpaid interest in `pendingInterest[depositId]` while snapshotting the current NFT owner in `interestClaimant[depositId]`. Only the exact `VaultManager.InsufficientVaultBalance` selector activates this fallback, while pause, authorization, malformed-revert, and unexpected failures still revert atomically. I chose full-value deferral instead of partial interest because it keeps accounting and claim authorization deterministic, and the test `"returns principal and defers full interest when the vault is underfunded"` proves the selected behavior.

### 3. Dead bot

> [!NOTE]
> **Assignment question:** The auto-renew bot goes offline for one month. What happens to deposits that passed the grace period? Does the user lose anything? Propose one change that protects the user in this case.

Nothing happens automatically because Solidity does not execute code merely because time passes; the old deposit remains `Active` until a valid transaction succeeds. The user does not lose principal and may still call maturity withdrawal after the grace period while the deposit remains active. SafeBank protects liveness by making `autoRenew(depositId)` permissionless, so the owner, another keeper, or any account can trigger it without receiving the renewed NFT or financial rights. A delayed call creates exactly one new term using one old-term interest calculation and starts the new term at the actual execution timestamp, as verified by the delayed-execution tests; an operational deployment can further protect availability by running multiple independent low-privilege keepers.

### 4. Rounding dust

> [!NOTE]
> **Assignment question:** The interest formula uses integer division, so some tiny amount is always lost to rounding. In your design, who keeps this dust - the user or the vault? Can the rounding ever cause a revert or a wrong balance? Prove your answer with one of your test cases.

SafeBank uses floor rounding, so the user receives the largest whole-token-unit interest amount not greater than the mathematical result, and the remaining dust stays in `VaultManager`. The internal `_calculateInterest` function uses `Math.mulDiv`, which performs multiplication and division safely and deterministically without creating an overpayment. Floor rounding does not cause a wrong balance because only the computed integer amount is transferred, and a zero-rounded result skips the zero-value vault payout. The test `"keeps integer-rounding dust inside VaultManager"` funds the vault with the calculated interest plus one smallest unit, settles the deposit, and verifies that exactly `1` unit remains in the vault.

### 5. Boundary times

> [!NOTE]
> **Assignment question:** At the exact second of maturityAt, is a withdrawal "early" or "at maturity"? At the exact end of the grace period, can the user still manually renew? Show the comparison operators (>= or >) you used, and explain each choice.

At exactly `maturityAt`, the deposit is mature: `withdrawAtMaturity` rejects only when `block.timestamp < deposit.maturityAt`, while `earlyWithdraw` rejects when `block.timestamp >= deposit.maturityAt`. Manual renewal uses the half-open interval `maturityAt <= timestamp < graceEndsAt`; the contract rejects it with `if (block.timestamp >= graceEndsAt)`. Auto-renew uses the complementary condition and rejects only while `block.timestamp < graceEndsAt`, so it becomes valid at the exact grace-period end. This gives one non-overlapping transition point, proven by tests for exact maturity, one second before grace end, exact grace end, and exact-end auto-renew.

### 6. Disabled plan with active deposits

> [!NOTE]
> **Assignment question:** The admin disables a plan while many deposits from that plan are still active. What can those users still do? Can they still manually renew INTO the disabled plan? Justify your rule.

Disabling a plan does not change existing deposit snapshots or invalidate active certificates. Existing owners may still withdraw early, withdraw at maturity, or participate in snapshot-based auto-renew because those actions use the stored deposit terms rather than replacing them with current plan configuration. They cannot open a new deposit with the disabled plan, and they cannot manually renew into it because `manualRenew` contains `if (!newPlan.enabled) { revert PlanNotEnabled(newPlanId); }`. This rule protects existing contractual rights while ensuring an administrator can stop the plan from being actively selected for new business.

### 7. Attack thinking

> [!NOTE]
> **Assignment question:** Describe one realistic attack on your system (for example: reentrancy on withdraw, double withdraw, or a fake token) and show the exact mechanism in your code that stops it.

A realistic attack is token-callback reentrancy during withdrawal: a malicious ERC20 attempts to call a SafeBank financial function again while the original transfer is still executing. SafeBank protects the financial entry points with `nonReentrant`, including `withdrawAtMaturity`, `earlyWithdraw`, `manualRenew`, `autoRenew`, and `claimPendingInterest`; it also changes lifecycle or pending state before external interactions. The active-only status check prevents a second terminal action, while EVM atomicity restores all earlier state if a later required interaction fails. Tests including `"blocks token callback reentrancy while completing the original withdrawal"`, `"blocks token callback reentrancy while completing the original early withdrawal"`, and the renewal and pending-claim reentrancy suites verify that the nested call fails with `ReentrancyGuardReentrantCall` while the original valid operation remains consistent.

## Sepolia Deployment

SafeBank is deployed on Ethereum Sepolia.

| Item | Value |
|---|---|
| Network | Ethereum Sepolia |
| Chain ID | `11155111` |
| Confirmation policy | `2` confirmations |
| Deployer and initial administrator | `0xA998526b0A5F23680f50fa3677f5c6576Dba89d9` |
| Initial fee receiver | `0xA998526b0A5F23680f50fa3677f5c6576Dba89d9` |
| MockUSDC | `0xcf779EC5D80573D3254054a17c5B4f0117491662` |
| VaultManager | `0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7` |
| SavingCore | `0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443` |
| Canonical plan | Plan ID `1` |
| Etherscan verification | Successful for all three contracts |

Canonical plan ID `1`:

| Field | Value |
|---|---:|
| Tenor | `180 days` |
| APR | `200 bps = 2.00%` |
| Minimum deposit | `100 mUSDC` |
| Maximum deposit | `10,000 mUSDC` |
| Early-withdrawal penalty | `750 bps = 7.50%` |
| Enabled | `true` |

Tracked deployment evidence is stored in:

- `deployments/sepolia/`;
- `data/deployments/sepolia.json`.

The verified initial public state contains:

- plan count `1`;
- deposit count `0`;
- vault balance `0`;
- total reserved interest `0`;
- available liquidity `0`;
- funding shortfall `0`;
- both contracts unpaused;
- no demo balances;
- no vault funding;
- no default deposits.

Etherscan source verification confirms source-to-bytecode matching for the recorded compiler configuration and constructor arguments. It is not a professional security audit.

## Requirements

Validated development environment:

- Node.js `v22.18.0`;
- npm `11.5.2`;
- Hardhat `2.28.6`;
- Solidity `0.8.28`;
- ethers `6.17.0`;
- OpenZeppelin Contracts `5.3.0`.

The repository uses npm lockfiles with lockfile version `3`.

## Install Dependencies

Install root dependencies:

~~~bash
npm install
~~~

Install frontend dependencies:

~~~bash
cd frontend
npm install
cd ..
~~~

Do not commit local environment files, private keys, seed phrases, or API keys.

## Compile and Test Contracts

Compile contracts:

~~~bash
npm run compile
~~~

Run the complete Hardhat suite:

~~~bash
npm test
~~~

Run focused suites:

~~~bash
npx hardhat test test/MockUSDC.test.ts
npx hardhat test test/VaultManager.test.ts
npx hardhat test test/SavingCore.test.ts
npm run test:deployment
~~~

Generate Solidity coverage:

~~~bash
npm run coverage
~~~

Root TypeScript files are validated through the Hardhat compile, test, deployment, and verification workflows that execute them. The repository does not expose a standalone root `typecheck` script because standalone `tsc` does not preserve Hardhat's generated contract typing context. The React application has its own dedicated `npm run typecheck` command inside `frontend/`.
Last validated contract checkpoint:

- `258` passing tests;
- production-contract coverage:
  - `100%` statements;
  - `98.40%` branches;
  - `100%` functions;
  - `100%` lines;
- complete-project coverage:
  - `99.11%` statements;
  - `97.17%` branches;
  - `96.97%` functions;
  - `96.98%` lines.

## Local Deployment

### Ephemeral Hardhat Deployment

Deploy and seed an ephemeral Hardhat network:

~~~bash
npm run deploy:ephemeral
~~~

### Persistent Localhost Deployment

Start a local node in terminal 1:

~~~bash
npm run node:local
~~~

Reset-deploy and seed in terminal 2:

~~~bash
npm run deploy:local:reset
~~~

Verify the deployed state:

~~~bash
npm run verify:local
~~~

Rerun the idempotent deployment and seed reconciliation:

~~~bash
npm run deploy:local
~~~

The deterministic local seed creates:

- canonical plan ID `1`;
- demo-user target balances of `5,000` and `10,000` mUSDC;
- VaultManager target balance of `25,000` mUSDC;
- no default deposits.

Local deployment scripts enforce chain ID `31337` and reject nonlocal networks.

## Run the Frontend

Enter the frontend directory:

~~~bash
cd frontend
~~~

Start development mode:

~~~bash
npm run dev
~~~

Run frontend validation:

~~~bash
npm test
npm run lint
npm run typecheck
npm run build
~~~

Preview the production build:

~~~bash
npm run preview
~~~

Contract artifacts are synchronized automatically before development, testing, typechecking, and production builds.

Last validated frontend checkpoint:

- `65` passing test files;
- `262` passing tests;
- zero Oxlint warnings or errors;
- successful TypeScript validation;
- successful Vite production build.

## Available Root Commands

| Command | Purpose |
|---|---|
| `npm install` | Install root dependencies |
| `npm run compile` | Compile Solidity and export production ABIs |
| `npm test` | Run the complete Hardhat test suite |
| `npm run coverage` | Generate Solidity coverage |
| `npm run clean` | Remove Hardhat-generated output |
| `npm run size` | Report contract sizes |
| `npm run node:local` | Start a persistent local node without automatic deployment |
| `npm run deploy:ephemeral` | Deploy and seed an ephemeral Hardhat network |
| `npm run deploy:local:reset` | Reset-deploy and seed localhost |
| `npm run deploy:local` | Reconcile localhost deployment and seed idempotently |
| `npm run verify:local` | Verify the localhost deployment |
| `npm run test:deployment` | Run deployment regression tests |
| `npm run deploy:sepolia` | Run the guarded Sepolia deployment workflow |
| `npm run verify:sepolia:state` | Verify tracked Sepolia state |

## Project Structure

~~~text
online-banking-capstone/
├── contracts/
│   ├── MockUSDC.sol
│   ├── SavingCore.sol
│   ├── VaultManager.sol
│   └── mocks/
├── deploy/
│   ├── 00_deploy_mock_usdc.ts
│   ├── 01_deploy_vault_manager.ts
│   ├── 02_deploy_saving_core.ts
│   ├── 03_authorize_saving_core.ts
│   ├── 04_seed_demo.ts
│   └── 10_deploy_sepolia.ts
├── deployments/
│   └── sepolia/
├── data/
│   ├── abi/
│   └── deployments/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN_DECISIONS.md
│   ├── SECURITY.md
│   └── UI_UX_PLAN.md
├── frontend/
│   ├── scripts/
│   ├── src/
│   │   ├── ai/
│   │   ├── components/
│   │   ├── config/
│   │   ├── contracts/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── lib/
│   │   └── providers/
│   └── README.md
├── scripts/
│   ├── preflight-sepolia-deployment.ts
│   ├── verify-local-deployment.ts
│   └── verify-sepolia-deployment.ts
├── test/
│   ├── Deployment.test.ts
│   ├── MockUSDC.test.ts
│   ├── SavingCore.test.ts
│   └── VaultManager.test.ts
├── hardhat.config.ts
├── package.json
└── README.md
~~~

## Documentation

Detailed project documentation:

- [System Architecture](docs/ARCHITECTURE.md)
- [Security Model](docs/SECURITY.md)
- [UI/UX Plan and Implementation Record](docs/UI_UX_PLAN.md)
- [Architecture and Product Decisions](docs/DESIGN_DECISIONS.md)
- [Frontend Guide](frontend/README.md)

These documents record both the original design reasoning and the implemented system through the current project checkpoint.

## Known Limitations

- MockUSDC is a permissionless-mint test token and has no monetary value.
- The contracts are non-upgradeable.
- The administrator model remains centralized.
- C2 exposes and contains interest underfunding but does not guarantee immediate full collateralization.
- C1 pending interest may remain unpaid until the vault receives sufficient funding.
- Auto-renew requires an actual transaction.
- Competing maturity withdrawal and auto-renew transactions are resolved by blockchain ordering.
- Only MockUSDC-like conventional ERC20 behavior is supported.
- Rich NFT metadata and a custom `tokenURI` are not implemented.
- The Spline launcher depends on an external visual host.
- The application targets Ethereum Sepolia and is not production banking software.
- Automated tests and Etherscan source verification do not replace an independent audit.

## Submission Checklist

- [x] Required smart contracts
- [x] Personal Variant values
- [x] Required saving flows
- [x] ERC721 certificates
- [x] Required events
- [x] Test coverage above 90%
- [x] React frontend
- [x] Seven Design Answers
- [x] Bonus C1 implementation and tests
- [x] Bonus C2 implementation and tests
- [x] Local deployment workflow
- [x] Sepolia deployment
- [x] Etherscan source verification
- [x] Final documentation reconciliation
- [x] Final repository audit
- [ ] Demonstration video
- [ ] Final submission packaging