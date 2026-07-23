# SafeBank Design Decisions

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank — Blockchain Term Deposit System |
| Document | Final Implemented Design Decision Register |
| Current documentation phase | Phase 19 — Final Documentation |
| Smart-contract model | Non-upgradeable |
| Frontend model | One React single-page application |
| Public network | Ethereum Sepolia, chain ID `11155111` |
| Local network | Hardhat and localhost, chain ID `31337` |
| Student ID | `3122560090` |
| Selected bonuses | C1 and C2 |
| Assistant model | Deterministic local rule engines |

This document records the final design decisions implemented in the repository.

The decision identifiers in this document use the format:

~~~text
DD-01
DD-02
...
~~~

They are final-document references only. They are not Solidity identifiers and do not attempt to preserve every temporary phase-local numbering scheme used during development.

Each decision records:

- status;
- context;
- selected design;
- rationale;
- implementation consequence;
- tradeoff or residual risk.

## 2. Personal Variant Decision

### DD-01 — Use MSSV-derived parameters consistently

**Status:** Implemented and verified.

**Context**

The assignment derives product parameters from student ID `3122560090`.

The final digits are:

- `A = 0`;
- `B = 9`.

**Decision**

Use the following values everywhere:

| Parameter | Value |
|---|---:|
| Grace period | `2 days` |
| Default APR | `200 bps = 2.00%` |
| Early-withdrawal penalty | `750 bps = 7.50%` |
| Default tenor | `180 days` |
| MockUSDC decimals | `6` |

**Rationale**

Contracts, tests, deployment scripts, frontend calculations, and documentation must represent one coherent Personal Variant.

**Implementation consequence**

The same values appear in:

- contract constants and plan configuration;
- test fixtures;
- deterministic local seed;
- Sepolia canonical plan;
- frontend formatting;
- README Design Answers.

**Tradeoff**

Changing the student variant requires coordinated code, test, deployment, and documentation changes.

## 3. Token Decisions

### DD-02 — Use a six-decimal test token

**Status:** Implemented.

**Context**

The assignment requires a MockUSDC-style token with six decimals.

**Decision**

Implement `MockUSDC` as:

- name `Mock USD Coin`;
- symbol `mUSDC`;
- 6 decimals;
- publicly mintable;
- test-only.

**Rationale**

Six decimals mirror common stablecoin-style accounting and directly satisfy the assignment.

**Implementation consequence**

All amounts use six-decimal smallest units.

Examples:

~~~text
1 mUSDC = 1,000,000 units
100 mUSDC = 100,000,000 units
~~~

Tests and scripts use:

~~~text
parseUnits(value, 6)
~~~

**Tradeoff**

Public minting means MockUSDC has no scarcity, backing, redemption, or real-world value.

### DD-03 — Do not support arbitrary ERC20 economics

**Status:** Implemented scope decision.

**Context**

Fee-on-transfer, rebasing, reflective, or independently mutating ERC20 tokens complicate exact principal accounting.

**Decision**

Design SafeBank for the implemented conventional MockUSDC behavior.

**Rationale**

The Capstone requires one test token, not a universal token-adapter framework.

**Implementation consequence**

Token flows use `SafeERC20`, but the financial model assumes the transferred amount equals the requested amount.

**Tradeoff**

Replacing MockUSDC with another token requires a new accounting and security review.

## 4. Custody Decisions

### DD-04 — Separate principal from bank-funded interest

**Status:** Implemented.

**Context**

Combining depositor principal and bank interest liquidity would make accounting and administrative withdrawals harder to reason about.

**Decision**

Use:

- `SavingCore` for user principal;
- `VaultManager` for bank-funded interest.

**Rationale**

The split creates a clear custody invariant:

> User principal is not the bank's interest reserve.

**Implementation consequence**

- deposits transfer principal into SavingCore;
- maturity and early withdrawal return principal from SavingCore;
- interest is requested from VaultManager;
- VaultManager owner withdrawals cannot directly access principal.

**Tradeoff**

The architecture uses an additional contract and requires correct one-time relationship configuration.

### DD-05 — Keep VaultManager authorization one-time

**Status:** Implemented.

**Context**

A replaceable authorized SavingCore would let a privileged actor redirect vault interest payouts to another contract.

**Decision**

Allow VaultManager to authorize SavingCore once and reject later replacement.

**Rationale**

One-time authorization reduces the long-term administrative attack surface.

**Implementation consequence**

An incorrect authorization cannot be repaired in place.

**Tradeoff**

Misconfiguration or a critical SavingCore defect requires redeployment.

## 5. Upgradeability Decision

### DD-06 — Use non-upgradeable contracts

**Status:** Implemented.

**Context**

Upgradeable proxies add:

- initializer risk;
- storage-layout risk;
- proxy administration;
- upgrade governance;
- implementation replacement risk.

**Decision**

Deploy ordinary non-upgradeable contracts.

**Rationale**

The Capstone benefits more from transparent immutable code than from upgrade machinery.

**Implementation consequence**

The deployed bytecode and constructor configuration remain fixed.

**Tradeoff**

A critical defect cannot be patched in place and requires migration to a new deployment.

## 6. Administrative Decisions

### DD-07 — Use Ownable2Step for privileged ownership

**Status:** Implemented.

**Context**

A one-step ownership transfer may permanently assign control to an incorrect address.

**Decision**

Use OpenZeppelin `Ownable2Step` for SavingCore and VaultManager.

**Rationale**

The proposed new owner must explicitly accept ownership.

**Implementation consequence**

The frontend displays:

- current owner;
- pending owner.

**Tradeoff**

Ownership transfer requires an additional transaction.

### DD-08 — Keep SavingCore and VaultManager pause states independent

**Status:** Implemented.

**Context**

Deposit lifecycle operations and interest-vault operations have different failure modes.

**Decision**

Give each contract its own `Pausable` state.

**Rationale**

Operators can contain a problem in one subsystem without automatically treating both contracts as one unit.

**Implementation consequence**

The frontend displays both pause states separately.

**Tradeoff**

A complete operational pause requires two transactions and mixed states must be understood correctly.

### DD-09 — Allow vault funding while paused

**Status:** Implemented.

**Context**

A paused vault may still need liquidity restoration.

**Decision**

Do not block owner funding merely because VaultManager is paused.

**Rationale**

Funding is a recovery action, not a value-extraction action.

**Implementation consequence**

Interest payouts and owner withdrawals may remain blocked while liquidity can still be added.

**Tradeoff**

Operational documentation must clearly distinguish funding from payout or withdrawal.

### DD-10 — Use the current fee receiver at early settlement

**Status:** Implemented.

**Context**

The penalty rate is part of the deposit's financial promise, but the receiving operational address may need to change.

**Decision**

Snapshot the penalty rate, but resolve the current VaultManager fee receiver when early withdrawal occurs.

**Rationale**

Existing users retain the promised penalty percentage while operations can rotate the collection address.

**Implementation consequence**

Changing the fee receiver affects future unsettled early withdrawals.

**Tradeoff**

The eventual penalty recipient is not immutable at deposit opening.

## 7. Saving Plan Decisions

### DD-11 — Snapshot financial terms per deposit

**Status:** Implemented.

**Context**

Administrators may update or disable plans after deposits are opened.

**Decision**

Store in every deposit:

- plan ID;
- tenor snapshot;
- APR snapshot;
- penalty snapshot;
- principal;
- start and maturity timestamps.

**Rationale**

An existing depositor's promised term must not change after opening.

**Implementation consequence**

APR updates affect future deposits and selected manual renewals only.

**Tradeoff**

More storage is used per deposit.

### DD-12 — Keep most plan terms immutable after creation

**Status:** Implemented.

**Context**

Editing tenor, limits, or penalty in place would make plan history harder to interpret.

**Decision**

After creation:

- APR may change;
- enabled state may change;
- tenor remains immutable;
- minimum and maximum remain immutable;
- penalty remains immutable.

**Rationale**

Materially different product terms should use a new plan ID.

**Implementation consequence**

Plan history remains easier to audit.

**Tradeoff**

The administrator may need to create additional plans rather than editing one record.

### DD-13 — Disabled plans do not invalidate existing deposits

**Status:** Implemented.

**Context**

Disabling a product should stop new use without destroying existing contractual rights.

**Decision**

Existing deposits retain their stored snapshots and lifecycle rights.

**Rationale**

Administrative product availability must not retroactively alter active deposits.

**Implementation consequence**

Existing owners may still:

- withdraw early;
- withdraw at maturity;
- participate in snapshot-based auto-renew.

**Tradeoff**

A disabled plan may still appear in historical and auto-renew state.

### DD-14 — Manual renewal may select enabled plans only

**Status:** Implemented.

**Context**

Manual renewal is a new user-selected product decision.

**Decision**

Reject manual renewal into a disabled target plan.

**Rationale**

A disabled plan should not accept new elective business.

**Implementation consequence**

`manualRenew` verifies:

~~~solidity
if (!newPlan.enabled) {
    revert PlanNotEnabled(newPlanId);
}
~~~

**Tradeoff**

A user may need to choose another enabled plan or withdraw.

## 8. NFT Certificate Decisions

### DD-15 — Represent each deposit with an ERC721 certificate

**Status:** Implemented.

**Context**

The assignment requires a transferable deposit certificate.

**Decision**

Mint one ERC721 for each deposit.

Collection:

- name `SafeBank Deposit Certificate`;
- symbol `SBDC`.

Identity rule:

~~~text
tokenId == depositId
~~~

**Rationale**

One-to-one identity simplifies ownership and lifecycle lookup.

**Implementation consequence**

The certificate can be transferred using standard ERC721 behavior.

**Tradeoff**

Users must understand that transfer has financial consequences.

### DD-16 — Current direct NFT owner controls active economic rights

**Status:** Implemented.

**Context**

A transferable certificate must define who may withdraw or manually renew after transfer.

**Decision**

Owner-restricted actions resolve:

~~~solidity
address currentOwner = ownerOf(depositId);
~~~

The caller must equal `currentOwner`.

**Rationale**

Economic rights follow the current certificate owner.

**Implementation consequence**

After Alice transfers the certificate to Bob:

- Bob may withdraw;
- Bob may manually renew;
- Alice loses those rights.

**Tradeoff**

An accidental NFT transfer may also transfer principal and interest rights.

### DD-17 — ERC721 approval does not grant direct deposit authority

**Status:** Implemented.

**Context**

ERC721 operators are often approved for marketplace transfer convenience.

**Decision**

Do not treat token approval or operator approval as sufficient for withdrawal or manual renewal.

**Rationale**

Direct financial settlement should require the actual current owner.

**Implementation consequence**

The contract compares `msg.sender` with `ownerOf(depositId)` rather than using `_isAuthorized`.

**Tradeoff**

Approved custodial or marketplace operators cannot settle on behalf of the owner.

### DD-18 — Retain terminal NFTs as historical certificates

**Status:** Implemented.

**Context**

Burning a certificate would remove a useful visible record.

**Decision**

Do not burn the old NFT after withdrawal or renewal.

**Rationale**

The NFT remains evidence that a deposit once existed.

**Implementation consequence**

The old deposit status prevents all later financial reuse.

**Tradeoff**

Interfaces must not imply that possession of a historical NFT means the old deposit is still active.

### DD-19 — Do not implement rich NFT metadata

**Status:** Intentionally not implemented.

**Context**

A custom `tokenURI`, hosted artwork, or dynamic metadata would increase presentation scope.

**Decision**

Use base ERC721 behavior without a project-specific metadata system.

**Rationale**

Core custody, settlement, renewal, bonuses, frontend workflows, and testing have higher priority.

**Implementation consequence**

Deposit details are read from SavingCore and presented by the frontend.

**Tradeoff**

Wallets and marketplaces do not receive rich SafeBank certificate artwork or metadata.

### DD-20 — Do not use ERC721Enumerable

**Status:** Implemented scope decision.

**Context**

On-chain enumeration increases storage writes and contract complexity.

**Decision**

Use base ERC721 and perform owned-deposit discovery off-chain.

**Rationale**

The Capstone already exposes deposit IDs and ownership can be reconciled with `ownerOf`.

**Implementation consequence**

The frontend scans candidate deposit IDs and checks current ownership.

**Tradeoff**

Discovery cost moves to the client and RPC layer.

## 9. Lifecycle Decisions

### DD-21 — Permit exactly one successful terminal transition

**Status:** Implemented.

**Context**

Maturity withdrawal, early withdrawal, manual renewal, and auto-renew may compete for the same active deposit.

**Decision**

Every terminal function requires status `Active` and changes it before completion.

Valid transitions:

~~~text
Active -> Withdrawn
Active -> ManualRenewed
Active -> AutoRenewed
~~~

**Rationale**

A single old deposit must not be processed twice.

**Implementation consequence**

Later conflicting transactions revert.

**Tradeoff**

Users and keepers may still pay gas for a transaction that loses a race.

### DD-22 — Renewal creates a new deposit and new NFT

**Status:** Implemented.

**Context**

Reusing the old deposit record would overwrite history.

**Decision**

Manual and auto-renew:

- terminate the old deposit;
- allocate a new deposit ID;
- create a new active deposit;
- safely mint a new certificate.

**Rationale**

Each term remains independently inspectable.

**Implementation consequence**

A renewal chain consists of multiple linked historical certificates.

**Tradeoff**

Deposit and NFT counts increase with each renewal.

## 10. Time-Boundary Decisions

### DD-23 — Treat exact maturity as mature

**Status:** Implemented and tested.

**Context**

The system must classify the exact second `maturityAt`.

**Decision**

Early withdrawal is valid only when:

~~~text
block.timestamp < maturityAt
~~~

Maturity withdrawal is valid when:

~~~text
block.timestamp >= maturityAt
~~~

**Rationale**

The exact maturity timestamp must belong to one clear side of the boundary.

**Implementation consequence**

At exact maturity:

- early withdrawal is rejected;
- maturity withdrawal is allowed;
- manual renewal begins.

**Tradeoff**

Users cannot obtain the early-withdrawal path at the exact maturity second.

### DD-24 — Use a half-open manual-renewal window

**Status:** Implemented and tested.

**Context**

Manual renewal and auto-renew must not both start at an ambiguous boundary.

**Decision**

Manual renewal is valid during:

~~~text
maturityAt <= timestamp < graceEndsAt
~~~

Auto-renew becomes valid when:

~~~text
timestamp >= graceEndsAt
~~~

**Rationale**

The half-open interval creates a precise complementary boundary.

**Implementation consequence**

At exact grace end:

- manual renewal is closed;
- auto-renew is allowed.

**Tradeoff**

A manual-renewal transaction mined at the boundary may revert even if prepared earlier.

### DD-25 — Keep maturity withdrawal available after grace

**Status:** Implemented.

**Context**

A user should not lose the ability to exit merely because the manual-renewal window ended.

**Decision**

Allow maturity withdrawal at any timestamp at or after maturity while the deposit remains active.

**Rationale**

The owner retains an exit path even if the bot is offline.

**Implementation consequence**

After grace, maturity withdrawal and auto-renew may both be valid.

**Tradeoff**

Transaction ordering determines which action wins.

## 11. Interest and Rounding Decisions

### DD-26 — Use one-term simple interest

**Status:** Implemented.

**Context**

The Capstone specifies APR-based term interest.

**Decision**

Calculate:

~~~text
interest =
    principal × aprBps × tenorSeconds
    ÷ (365 days × 10,000)
~~~

Use `Math.mulDiv`.

**Rationale**

This matches the assignment and avoids floating-point arithmetic.

**Implementation consequence**

Interest is deterministic in smallest token units.

**Tradeoff**

The model does not represent continuously compounded or variable-rate interest.

### DD-27 — Round interest down

**Status:** Implemented and tested.

**Context**

Solidity integer division cannot represent fractional smallest token units.

**Decision**

Use floor rounding.

**Rationale**

The contract must never transfer more token units than the formula produces.

**Implementation consequence**

Rounding dust remains in VaultManager.

The test `"keeps integer-rounding dust inside VaultManager"` verifies this behavior.

**Tradeoff**

A user may receive slightly less than the real-number result by less than one smallest token unit.

### DD-28 — Skip zero-value interest payout calls

**Status:** Implemented.

**Context**

Very small positive mathematical interest may round to zero.

**Decision**

Do not call VaultManager for a zero calculated interest amount.

**Rationale**

A zero-value external call is unnecessary and may interact poorly with a paused vault.

**Implementation consequence**

Zero-interest settlement and renewal avoid a meaningless payout call.

**Tradeoff**

The distinction between mathematically positive and token-unit-zero interest must be documented.

## 12. Early-Withdrawal Decisions

### DD-29 — Pay no interest on early withdrawal

**Status:** Implemented.

**Context**

The assignment defines a penalty-based early exit.

**Decision**

Early withdrawal returns:

~~~text
principal - penalty
~~~

and pays zero interest.

**Rationale**

The user exits before completing the agreed term.

**Implementation consequence**

The expected-interest reserve is released.

**Tradeoff**

The user forfeits all accrued but unmatured interest.

### DD-30 — Snapshot the penalty rate

**Status:** Implemented.

**Context**

An administrator may create new plans or change product offerings later.

**Decision**

Store `penaltyBpsAtOpen` in the deposit.

**Rationale**

The penalty promise must not change retroactively.

**Implementation consequence**

Early withdrawal uses the deposit snapshot, not current plan configuration.

**Tradeoff**

A later more favorable plan penalty does not benefit an existing deposit.

## 13. Manual-Renewal Decisions

### DD-31 — Manual renewal uses current selected-plan terms

**Status:** Implemented.

**Context**

Manual renewal is an active user choice during grace.

**Decision**

Use the selected target plan's current:

- plan ID;
- tenor;
- APR;
- penalty;
- limits.

**Rationale**

The user is entering a new product term.

**Implementation consequence**

The renewed deposit receives fresh snapshots.

**Tradeoff**

The renewed terms may differ from the old deposit.

### DD-32 — Positive-interest manual renewal must be fully funded

**Status:** Implemented.

**Context**

Compounding without receiving the old-term interest would create unsupported principal.

**Decision**

Require VaultManager to transfer the complete positive old-term interest into SavingCore.

**Rationale**

The new principal must correspond to actual tokens held by SavingCore.

**Implementation consequence**

An underfunded or paused vault causes positive-interest manual renewal to revert.

**Tradeoff**

C1 principal-first deferral is not applied to renewal because renewal would otherwise create an unfunded deposit.

## 14. Auto-Renew Decisions

### DD-33 — Make auto-renew permissionless

**Status:** Implemented.

**Context**

A single authorized bot creates a liveness dependency.

**Decision**

Allow any address to call `autoRenew(depositId)` after grace.

**Rationale**

The owner, another keeper, or any account can restore progress when one bot is offline.

**Implementation consequence**

No privileged keeper key is required.

**Tradeoff**

A third party may auto-renew before the owner’s competing withdrawal transaction is mined.

### DD-34 — Mint the auto-renewed certificate to the current owner

**Status:** Implemented.

**Context**

A permissionless caller must not gain the deposit.

**Decision**

Resolve the current owner of the old certificate and mint the new certificate to that address.

**Rationale**

The caller provides liveness only.

**Implementation consequence**

The caller cannot redirect principal, interest, snapshots, or NFT recipient.

**Tradeoff**

A malicious caller may still influence timing by choosing when to submit the transaction.

### DD-35 — Auto-renew preserves old snapshots

**Status:** Implemented.

**Context**

Permissionless auto-renew must not make an unapproved product-selection decision for the owner.

**Decision**

Preserve:

- old plan ID;
- old tenor snapshot;
- old APR snapshot;
- old penalty snapshot.

Ignore current plan:

- enabled state;
- APR;
- minimum;
- maximum.

**Rationale**

Auto-renew continues the already accepted economic terms.

**Implementation consequence**

A disabled or changed plan does not alter snapshot-based auto-renew.

**Tradeoff**

The renewed term may use terms the administrator no longer offers to new users.

### DD-36 — One delayed call creates one term

**Status:** Implemented and tested.

**Context**

A bot may remain offline for weeks or months.

**Decision**

A later auto-renew transaction creates exactly one new term starting at the transaction timestamp.

**Rationale**

Retroactively creating many terms would require assumptions about compounding, funding, gas, and historical execution.

**Implementation consequence**

The owner does not receive automatic catch-up compounding.

**Tradeoff**

A delayed bot may reduce the number of completed renewal terms compared with continuous execution.

## 15. Bonus C1 Decisions

### DD-37 — Return principal before deferring underfunded interest

**Status:** Implemented.

**Context**

The base specification's full revert can indirectly lock principal when the vault lacks interest liquidity.

**Decision**

Implement C1 Principal-First Settlement.

At maturity:

1. return principal;
2. attempt full interest payout;
3. on exact vault-balance insufficiency, record the full interest as pending.

**Rationale**

The bank's failure to fund interest should not block recovery of principal already held by SavingCore.

**Implementation consequence**

The deposit becomes terminal and emits `InterestDeferred`.

**Tradeoff**

The unpaid interest may remain outstanding indefinitely.

### DD-38 — Defer the full interest amount, not a partial payment

**Status:** Implemented.

**Context**

Partial payout would require more complex remaining-debt accounting.

**Decision**

Use full-or-defer behavior.

**Rationale**

One pending value is simpler to authorize, reserve, test, and claim.

**Implementation consequence**

If the vault cannot pay the complete amount, no interest is paid during settlement.

**Tradeoff**

Available partial liquidity remains in VaultManager until a later complete claim succeeds.

### DD-39 — Catch only the exact insufficient-balance failure

**Status:** Implemented and tested.

**Context**

Broadly catching every VaultManager error could hide pause, authorization, or unexpected contract failures.

**Decision**

Activate C1 only when the revert selector is:

~~~text
VaultManager.InsufficientVaultBalance
~~~

Rethrow other failures.

**Rationale**

Only ordinary liquidity insufficiency should convert into deferred debt.

**Implementation consequence**

Paused and malformed failures revert the entire settlement.

**Tradeoff**

Any new legitimate liquidity error type would require deliberate code support.

### DD-40 — Snapshot a fixed pending-interest claimant

**Status:** Implemented.

**Context**

After principal settlement, the historical NFT may later transfer.

**Decision**

Store the current NFT owner at settlement in:

~~~text
interestClaimant[depositId]
~~~

**Rationale**

The receivable should belong to the person whose interest was unpaid during settlement.

**Implementation consequence**

A later NFT transfer does not transfer the pending claim.

**Tradeoff**

NFT ownership and pending-claim ownership may diverge.

### DD-41 — Clear pending debt before external claim payout

**Status:** Implemented.

**Context**

A malicious token callback could attempt to claim again.

**Decision**

Clear pending state and consume reserve before calling VaultManager.

**Rationale**

Checks-effects-interactions and `nonReentrant` jointly block duplicate execution.

**Implementation consequence**

A failed payout relies on EVM rollback to restore the debt and reserve.

**Tradeoff**

Correctness depends on transaction atomicity, which is an accepted EVM property.

## 16. Bonus C2 Decisions

### DD-42 — Keep aggregate reserved interest in SavingCore

**Status:** Implemented.

**Context**

SavingCore creates, settles, renews, and defers interest obligations.

**Decision**

Use:

~~~text
SavingCore.totalReservedInterest
~~~

as the authoritative aggregate liability.

**Rationale**

The lifecycle-owning contract has the context required to update liabilities atomically.

**Implementation consequence**

VaultManager reads the reserve from the authorized SavingCore.

**Tradeoff**

Vault solvency reads depend on the configured contract relationship.

### DD-43 — Reserve active expected interest and pending debt

**Status:** Implemented.

**Context**

Both active deposits and C1 pending claims represent interest obligations.

**Decision**

Include:

- positive expected interest for active deposits;
- unpaid pending interest.

**Rationale**

Available-liquidity calculations must consider both categories.

**Implementation consequence**

Deferred interest remains reserved until successfully claimed.

**Tradeoff**

Aggregate reserve does not identify individual liabilities without reading deposits and pending mappings.

### DD-44 — Permit undercollateralized deposit opening

**Status:** Implemented.

**Context**

A strict solvency check at opening would reject users whenever the bank had not pre-funded all expected interest.

**Decision**

Allow an otherwise valid deposit to open even when vault balance is below total reserve.

**Rationale**

The assignment's core product remains usable while C2 exposes the shortfall and C1 protects principal later.

**Implementation consequence**

`fundingShortfall` may become positive.

**Tradeoff**

Interest payment is not guaranteed at maturity.

### DD-45 — Limit administrator withdrawal to available liquidity

**Status:** Implemented.

**Context**

The owner must not withdraw tokens already reserved for expected or pending interest.

**Decision**

Calculate:

~~~text
availableLiquidity =
    max(vaultBalance - totalReservedInterest, 0)
~~~

Reject withdrawal above that value.

**Rationale**

C2 must contain administrator extraction.

**Implementation consequence**

When reserve exceeds balance, available liquidity is zero.

**Tradeoff**

Reserved liquidity may remain unused until liabilities are settled or released.

### DD-46 — Expose funding shortfall explicitly

**Status:** Implemented.

**Context**

A saturating available-liquidity result of zero does not show the size of underfunding.

**Decision**

Expose:

~~~text
fundingShortfall =
    max(totalReservedInterest - vaultBalance, 0)
~~~

**Rationale**

Users and administrators need visible liability information.

**Implementation consequence**

The Admin Portal and assistants can explain the shortfall.

**Tradeoff**

The metric is informational and does not automatically add funds.

## 17. Reentrancy and Failure Decisions

### DD-47 — Protect financial entry points with ReentrancyGuard

**Status:** Implemented and tested.

**Context**

ERC20 transfers and ERC721 safe minting may invoke external code.

**Decision**

Use `nonReentrant` on state-changing financial flows.

**Rationale**

Nested execution must not process the same or related state twice.

**Implementation consequence**

Malicious callback tests verify rejection of reentry.

**Tradeoff**

Protected functions cannot safely call one another through external reentry.

### DD-48 — Use SafeERC20

**Status:** Implemented.

**Context**

ERC20 implementations differ in return behavior.

**Decision**

Use OpenZeppelin `SafeERC20`.

**Rationale**

False-return, no-return, and reverting tokens require consistent handling.

**Implementation consequence**

Failed token interactions revert atomically.

**Tradeoff**

SafeERC20 cannot make unsupported token economics compatible with SafeBank accounting.

### DD-49 — Use safe ERC721 minting

**Status:** Implemented and tested.

**Context**

Minting to a contract that cannot receive ERC721 may trap the certificate.

**Decision**

Use safe minting for deposit and renewed certificates.

**Rationale**

Receiver compatibility must be checked.

**Implementation consequence**

Receiver rejection reverts the whole opening or renewal.

**Tradeoff**

Receiver callbacks add an external-call surface, mitigated by `nonReentrant`.

## 18. Frontend Architecture Decisions

### DD-50 — Use one SPA with local User/Admin view state

**Status:** Implemented.

**Context**

The product has two closely related demonstration areas and does not require deep-link routing for the Capstone.

**Decision**

Use local:

~~~text
ApplicationView = user | admin
~~~

in `App.tsx`.

**Rationale**

This keeps navigation simple and avoids unnecessary routing architecture.

**Implementation consequence**

There is no React Router.

**Tradeoff**

Browser refresh returns to the default view and there are no deep-link URLs.

### DD-51 — Use no Redux or Zustand

**Status:** Implemented scope decision.

**Context**

Application state is limited to focused providers and component state.

**Decision**

Use React context, hooks, and local state.

**Rationale**

An external global-state framework would add complexity without solving a demonstrated need.

**Implementation consequence**

Wallet, language, user data, and admin data use dedicated providers.

**Tradeoff**

A much larger future product might require a different state architecture.

### DD-52 — Separate public reads from signer writes

**Status:** Implemented.

**Context**

Users should see public data before connecting a wallet.

**Decision**

Use:

- `JsonRpcProvider` for public reads;
- `BrowserProvider` and connected signer for writes.

**Rationale**

Wallet access is required only for user-authorized state changes.

**Implementation consequence**

Dashboard loading can begin without an account.

**Tradeoff**

Public RPC state may differ briefly from the user's wallet provider due to propagation delay.

### DD-53 — Validate wallet and Sepolia before writes

**Status:** Implemented.

**Context**

Preparing a transaction without an account or on the wrong chain creates confusing failures.

**Decision**

Before returning a signer, verify:

- browser wallet exists;
- account is connected;
- chain ID is Sepolia.

**Rationale**

Fail early with a clear UI message.

**Implementation consequence**

Wrong-network writes are blocked before contract preparation.

**Tradeoff**

Users must explicitly switch networks.

### DD-54 — Use exact-amount approval

**Status:** Implemented.

**Context**

Unlimited approval increases exposure if a spender is compromised.

**Decision**

Request the exact amount required for deposit opening or vault funding.

**Rationale**

The allowance should match the immediate action.

**Implementation consequence**

Approval and financial action are separate transactions.

**Tradeoff**

Repeated actions may require repeated approvals.

### DD-55 — Require explicit action confirmation

**Status:** Implemented.

**Context**

Financial and administrator actions may be irreversible.

**Decision**

Display an in-app review before opening the wallet.

**Rationale**

Users should understand the action and consequence before signing.

**Implementation consequence**

Confirmations cover user and administrator workflows.

**Tradeoff**

The workflow requires an additional interaction step.

### DD-56 — Treat confirmed receipts as success

**Status:** Implemented.

**Context**

Transaction submission is not final execution.

**Decision**

Do not show final success until the receipt confirms.

**Rationale**

A submitted transaction may revert or be replaced.

**Implementation consequence**

The UI distinguishes wallet, submitted, confirming, success, and error states.

**Tradeoff**

Users wait longer before seeing final success.

## 19. Language and UX Decisions

### DD-57 — Use Vietnamese as the default language

**Status:** Implemented.

**Context**

The primary intended demonstration language is Vietnamese.

**Decision**

Default the application to Vietnamese and provide English as a secondary language.

**Rationale**

The main user experience should match the project audience.

**Implementation consequence**

Language selection is persisted locally and document metadata is updated.

**Tradeoff**

Translations must remain synchronized as features change.

### DD-58 — Implement explicit loading, empty, and error states

**Status:** Implemented.

**Context**

Blank or fabricated zero-value UI can misrepresent unavailable blockchain data.

**Decision**

Represent loading, empty, error, retry, and ready states separately.

**Rationale**

The interface must distinguish no data from failed data.

**Implementation consequence**

Reusable state panels are used in User and Admin areas.

**Tradeoff**

More UI state and test coverage are required.

### DD-59 — Keep frontend authorization advisory

**Status:** Implemented.

**Context**

Client code can be modified or bypassed.

**Decision**

Use frontend owner and claimant checks for UX only.

**Rationale**

Only Solidity can enforce financial and administrator authority.

**Implementation consequence**

All protected contract functions independently validate callers.

**Tradeoff**

The frontend may occasionally display stale action availability until refreshed.

## 20. Assistant Decisions

### DD-60 — Use deterministic local assistants

**Status:** Implemented.

**Context**

A general external LLM would introduce:

- nondeterministic output;
- provider availability;
- API secrets;
- data disclosure concerns;
- hallucination risk;
- cost and rate limits.

**Decision**

Implement local deterministic Banking and Risk Assistants.

**Rationale**

The Capstone benefits from explainable, testable, repository-contained behavior.

**Implementation consequence**

Assistant answers are produced from coded intents and verified application context.

**Tradeoff**

The assistants support bounded SafeBank questions rather than unrestricted conversation.

### DD-61 — Keep assistants strictly read-only

**Status:** Implemented and tested.

**Context**

An assistant must not silently become a transaction agent.

**Decision**

Assistants do not:

- connect a wallet;
- obtain a signer;
- import transaction clients;
- sign transactions;
- submit transactions;
- modify contract state.

**Rationale**

Explanation and financial authority must remain separate.

**Implementation consequence**

Assistant suggestions require the user to use normal application controls.

**Tradeoff**

The assistant cannot complete an action for the user.

### DD-62 — Validate assistant questions

**Status:** Implemented.

**Context**

Unbounded or malformed input may create poor UX or unsafe rendering assumptions.

**Decision**

Assistant questions:

- replace control characters;
- normalize whitespace;
- reject empty input;
- reject input above 500 characters;
- reject external URLs.

**Rationale**

The input domain should remain controlled and deterministic.

**Implementation consequence**

Validation errors are displayed safely.

**Tradeoff**

Users cannot submit long or URL-based questions.

### DD-63 — Use structured assistant answers

**Status:** Implemented.

**Context**

Free-form text may hide caution or next action.

**Decision**

Every answer contains:

1. fact;
2. explanation;
3. caution;
4. next step.

**Rationale**

The structure promotes consistent risk communication.

**Implementation consequence**

Both assistants use a shared answer model.

**Tradeoff**

Responses are less stylistically flexible.

### DD-64 — Render assistant output as ordinary React text

**Status:** Implemented.

**Context**

Rendering assistant-generated HTML would create injection risk.

**Decision**

Do not use `dangerouslySetInnerHTML` in the checked assistant rendering path.

**Rationale**

Structured text does not require raw HTML.

**Implementation consequence**

Assistant content is rendered through normal React escaping.

**Tradeoff**

Rich arbitrary HTML formatting is not supported.

### DD-65 — Treat Spline as visual-only

**Status:** Implemented.

**Context**

The assistant launcher uses an externally hosted Spline scene.

**Decision**

Keep Spline outside:

- financial data;
- wallet access;
- authorization;
- assistant reasoning.

**Rationale**

A visual dependency must not become a security dependency.

**Implementation consequence**

Core assistant and application behavior remains separate from the scene.

**Tradeoff**

The visual launcher may degrade if the external host is unavailable.

## 21. Deployment Decisions

### DD-66 — Use deterministic local deployment and seed

**Status:** Implemented.

**Context**

Local demonstrations must be repeatable.

**Decision**

Deploy in a fixed order and reconcile deterministic target state.

Deployment order:

1. MockUSDC;
2. VaultManager;
3. SavingCore;
4. authorization;
5. demo seed.

**Rationale**

A clean repository should reproduce the same useful local state.

**Implementation consequence**

Local scripts enforce chain ID `31337`.

**Tradeoff**

Local deployment records are environment-specific and should not be confused with Sepolia.

### DD-67 — Do not seed public Sepolia balances or deposits

**Status:** Implemented.

**Context**

Automatically minting balances, funding the vault, or opening deposits on public deployment would create unnecessary irreversible transactions.

**Decision**

Sepolia deployment creates:

- contracts;
- authorization;
- canonical plan.

It does not create:

- demo balances;
- vault funding;
- default deposits.

**Rationale**

Public setup should remain minimal and auditable.

**Implementation consequence**

The verified initial deposit count and vault balance are zero.

**Tradeoff**

Demonstrations require explicit later test-token minting and vault funding.

### DD-68 — Use guarded Sepolia deployment

**Status:** Implemented.

**Context**

Public deployment mistakes may spend real testnet gas and create unusable addresses.

**Decision**

Validate:

- Sepolia chain ID;
- deployment sequence;
- relationships;
- transaction receipts;
- canonical plan;
- initial state.

Use a two-confirmation policy.

**Rationale**

Deployment should fail early when configuration is inconsistent.

**Implementation consequence**

Tracked compact metadata records addresses, transactions, blocks, and verification evidence.

**Tradeoff**

Deployment and verification require additional scripts and checks.

### DD-69 — Treat Etherscan verification as source evidence, not audit evidence

**Status:** Implemented documentation decision.

**Context**

Source verification proves source-to-bytecode correspondence but not security.

**Decision**

State explicitly that verified source is not a professional audit.

**Rationale**

Submission documentation must avoid overstating assurance.

**Implementation consequence**

README and docs use qualified wording.

**Tradeoff**

No independent audit evidence is available.

## 22. Testing Decisions

### DD-70 — Use tests as executable specification

**Status:** Implemented.

**Context**

Boundary and rollback behavior are easy to describe incorrectly.

**Decision**

Write focused tests for:

- exact maturity;
- exact grace end;
- NFT transfer rights;
- rounding dust;
- reentrancy;
- C1 fallback classification;
- pending claimant;
- C2 reserve lifecycle;
- deployment regression;
- frontend state and assistants.

**Rationale**

Tests provide repeatable evidence that implementation matches decisions.

**Implementation consequence**

The latest validated checkpoints report:

- 258 contract tests;
- 65 frontend test files;
- 256 frontend tests.

**Tradeoff**

Tests cannot prove the absence of all vulnerabilities.

### DD-71 — Maintain production-contract coverage above assignment minimum

**Status:** Implemented.

**Context**

The assignment requires test coverage above 90%.

**Decision**

Maintain high statement, function, line, and branch coverage.

**Rationale**

Critical lifecycle and financial branches should be exercised directly.

**Implementation consequence**

Last validated production coverage:

- 100% statements;
- 98.40% branches;
- 100% functions;
- 100% lines.

**Tradeoff**

Coverage percentage does not measure test quality by itself.

## 23. Required Design Answers Mapping

The root README contains the exact required section:

~~~text
## Design Answers
~~~

It contains all seven required questions and answers.

This register maps them to the implemented decisions.

| Required question | Main decisions |
|---|---|
| Transferable certificate | DD-15, DD-16, DD-17, DD-18 |
| Empty vault | DD-37, DD-38, DD-39, DD-40, DD-41 |
| Dead bot | DD-25, DD-33, DD-34, DD-36 |
| Rounding dust | DD-26, DD-27, DD-28 |
| Boundary times | DD-23, DD-24, DD-25 |
| Disabled plan with active deposits | DD-11, DD-13, DD-14, DD-35 |
| Attack thinking | DD-21, DD-47, DD-48, DD-49 |

## 24. Rejected Alternatives

### 24.1 Combined Principal and Interest Vault

**Rejected because:**

- custody boundaries would be weaker;
- administrator withdrawal would be harder to contain;
- C1 principal recovery would be less clear.

### 24.2 Upgradeable Proxy Contracts

**Rejected because:**

- more privileged infrastructure;
- initializer and storage-layout risk;
- unnecessary Capstone complexity.

### 24.3 Original Depositor Keeps Rights Forever

**Rejected because:**

- it conflicts with a financially transferable certificate;
- the current NFT owner would not receive the represented economic value.

### 24.4 ERC721 Approved Operators May Withdraw

**Rejected because:**

- marketplace approval should not automatically authorize direct financial settlement.

### 24.5 Burn NFT at Settlement

**Rejected because:**

- historical certificate evidence would disappear.

### 24.6 Full Revert on Vault Underfunding

**Rejected by C1 because:**

- it can lock principal due to missing interest funding.

### 24.7 Partial Interest Settlement

**Rejected because:**

- remaining-debt accounting and testing would be more complex than full-value deferral.

### 24.8 Auto-Renew Restricted to One Bot

**Rejected because:**

- one dead key or process would create unnecessary liveness failure.

### 24.9 Auto-Renew Uses Current Plan Terms

**Rejected because:**

- an untrusted caller would indirectly apply changed product terms to the owner.

### 24.10 Retroactive Multi-Term Catch-Up

**Rejected because:**

- it requires assumptions about funding, compounding, and historical execution.

### 24.11 Strictly Block Undercollateralized Deposit Opening

**Rejected because:**

- C2 visibility and C1 principal protection provide a more usable Capstone tradeoff.

### 24.12 React Router

**Rejected for current scope because:**

- the application only needs two closely related views;
- deep links are not required by the assignment.

### 24.13 Redux or Zustand

**Rejected for current scope because:**

- focused providers and hooks are sufficient.

### 24.14 Unlimited Token Approval

**Rejected because:**

- exact approval limits exposure.

### 24.15 External General-Purpose LLM

**Rejected because:**

- nondeterminism;
- secret management;
- provider dependency;
- hallucination;
- data disclosure;
- difficult automated verification.

### 24.16 Assistant Transaction Agent

**Rejected because:**

- financial authority must remain in explicit wallet-confirmed application controls.

### 24.17 Public Sepolia Demo Seed

**Rejected because:**

- it would create extra irreversible public transactions and state.

## 25. Decision Consistency Rules

Future maintenance must preserve consistency among:

- Solidity behavior;
- tests;
- deployment scripts;
- tracked metadata;
- frontend availability logic;
- assistant explanations;
- README Design Answers;
- architecture documentation;
- security documentation;
- UI/UX documentation.

A change is incomplete when one layer contradicts another.

Examples:

- changing the grace period requires contract, test, UI, assistant, and documentation updates;
- changing NFT authority requires withdrawal, renewal, test, and warning updates;
- changing C1 fallback requires reserve and claimant review;
- changing C2 requires vault-withdrawal and dashboard-metric review;
- adding an external AI provider requires a new privacy, secret, availability, and safety decision;
- adding routes requires a new navigation and state-persistence decision.

## 26. Known Decision Tradeoffs

Accepted tradeoffs include:

- centralized administrator ownership;
- non-upgradeable bug recovery;
- vault underfunding remains possible;
- pending interest may remain unpaid;
- floor rounding favors the vault by less than one smallest unit;
- transaction ordering may decide withdrawal versus auto-renew;
- off-chain NFT discovery requires RPC work;
- historical NFTs may confuse users;
- browser refresh does not preserve active User/Admin view;
- deterministic assistants have bounded intent coverage;
- Spline is an external visual dependency;
- Sepolia is not a production environment;
- automated tests do not replace an audit.

## 27. Final Decision Summary

SafeBank's implemented design is defined by these major choices:

- six-decimal MockUSDC;
- separated principal and interest custody;
- non-upgradeable contracts;
- Ownable2Step administration;
- one-time SavingCore authorization;
- transferable ERC721 economic rights;
- direct current-owner settlement authority;
- immutable deposit snapshots;
- exact maturity and grace boundaries;
- permissionless ownership-safe auto-renew;
- one delayed call producing one term;
- floor-rounded simple interest;
- C1 principal-first settlement;
- fixed pending-interest claimant;
- C2 aggregate reserved-interest accounting;
- available-liquidity administrator withdrawal limit;
- one SPA with User and Admin views;
- read-only public provider and signer-only writes;
- exact token approval;
- explicit transaction confirmation;
- Vietnamese-first bilingual UX;
- deterministic read-only assistants;
- deterministic local deployment;
- minimal guarded Sepolia deployment;
- Etherscan verification described accurately as non-audit evidence.

These decisions match the current contracts, tests, frontend, assistants, deployment records, and root README.