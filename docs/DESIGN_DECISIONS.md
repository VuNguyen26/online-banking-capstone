# SafeBank Design Decisions

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank / Online Banking System |
| Document | Architecture and Product Decision Records |
| Current project phase | Phase 5 — Deposit opening and ERC721 deposit certificates |
| Implementation status | Accepted decisions through Phase 5 are reflected in the implemented contracts and tests; withdrawal, renewal, C1, C2, frontend, AI, and deployment decisions remain pending or deferred |
| Architecture model | Non-upgradeable |
| Student ID | 3122560090 |
| Test token | MockUSDC with 6 decimals |

This document is the living record of accepted, proposed, implemented, and deferred decisions governing SafeBank.

A decision marked accepted or implemented must remain consistent with the actual Solidity code and tests. A proposed or deferred decision is not proof that the related feature has already been implemented.

The Solidity code, tests, frontend, deployment scripts, README, and demonstration must remain consistent with the applicable decisions in this document.

---

## 2. Decision Categories

Each decision belongs to one of four categories.

### 2.1 Mandatory Requirement

A rule explicitly required by the Capstone specification.

Examples:

- MockUSDC uses 6 decimals;
- SavingCore holds principal;
- VaultManager holds interest liquidity;
- APR and penalty are snapshotted;
- manual and automatic renewal are supported;
- coverage must exceed 90%.

### 2.2 SafeBank Project Decision

A choice made by this project where the specification permits design freedom.

Examples:

- current NFT owner receives the deposit's economic rights;
- NFTs are retained after completion;
- exact timestamp boundaries;
- non-upgradeable architecture;
- rounding dust remains in the vault.

### 2.3 Bonus Decision

A decision associated with:

- C1 — Principal-First Settlement;
- C2 — Solvency Guard.

Bonus functionality must not be described as implemented before its designated phase.

### 2.4 Product and AI Extension

A decision affecting:

- User Banking App;
- Admin Portal;
- UI/UX;
- AI Banking Assistant;
- AI Risk Assistant.

These extensions must not override on-chain rules.

---

## 3. Decision Record Format

Each decision record uses the following fields:

| Field | Meaning |
|---|---|
| ID | Stable decision identifier |
| Status | Accepted, Proposed, Deferred, Rejected, or Superseded |
| Category | Mandatory, SafeBank Decision, Bonus, or Product Extension |
| Context | Problem or uncertainty requiring a decision |
| Decision | Selected behavior |
| Rationale | Why this behavior was selected |
| Trade-offs | Costs, limitations, or risks |
| Test implication | Tests required to validate the decision |
| UI implication | User-interface behavior required by the decision |

Statuses mean:

- **Accepted**: the project must implement this behavior unless a later decision explicitly supersedes it;
- **Proposed**: preferred direction, but implementation details may still change;
- **Deferred**: intentionally postponed until a later phase;
- **Rejected**: evaluated and not selected;
- **Superseded**: replaced by another decision record.

---

## 4. Decision Summary

| ID | Decision | Status |
|---|---|---|
| ADR-001 | Use fixed personal-variant values | Accepted |
| ADR-002 | Separate principal and interest custody | Accepted |
| ADR-003 | Current NFT owner holds economic rights | Accepted |
| ADR-004 | Keep completed NFTs as historical certificates | Accepted |
| ADR-005 | Use exact maturity boundary | Accepted |
| ADR-006 | Use exact grace-period boundary | Accepted |
| ADR-007 | Allow maturity withdrawal after grace if still active | Accepted |
| ADR-008 | Restrict disabled plans appropriately | Accepted |
| ADR-009 | Make auto-renew permissionless | Accepted |
| ADR-010 | Preserve tenor, APR, and penalty snapshots during auto-renew | Accepted |
| ADR-011 | Do not accrue multiple terms while bot is offline | Accepted |
| ADR-012 | Leave rounding dust in VaultManager | Accepted |
| ADR-013 | Pause all financial entry points | Accepted |
| ADR-014 | Use non-upgradeable contracts | Accepted |
| ADR-015 | Use basic ERC721 instead of ERC721Enumerable | Accepted |
| ADR-016 | Match NFT token ID with deposit ID | Accepted |
| ADR-017 | Start deposit and plan identifiers at one | Accepted |
| ADR-018 | Use one-time SavingCore authorization in VaultManager | Accepted |
| ADR-019 | Use Ownable2Step for privileged ownership | Accepted |
| ADR-020 | Use separate pause states for SavingCore and VaultManager | Accepted |
| ADR-021 | Keep plan terms immutable except APR and enabled state | Accepted |
| ADR-022 | Apply explicit plan validation bounds | Accepted |
| ADR-023 | Use SafeERC20 and nonReentrant financial entry points | Accepted |
| ADR-024 | Use safe NFT minting with state finalized first | Accepted |
| ADR-025 | Renewal requires fully funded interest | Accepted |
| ADR-026 | Implement C1 Principal-First Settlement | Accepted |
| ADR-027 | Snapshot pending-interest claimant at settlement | Accepted |
| ADR-028 | Implement C2 Solvency Guard | Accepted |
| ADR-029 | Permit undercollateralized deposit opening | Accepted |
| ADR-030 | Preserve pending-interest liabilities in reserve accounting | Accepted |
| ADR-031 | Frontend approval defaults to exact amount | Accepted |
| ADR-032 | Frontend route guards are UX only | Accepted |
| ADR-033 | AI remains read-only and advisory | Accepted |
| ADR-034 | Use contract state as the source of truth | Accepted |
| ADR-035 | Use a 365-day simple-interest year | Accepted |
| ADR-036 | Avoid administrator editing of active deposits | Accepted |
| ADR-037 | First successfully mined terminal action wins | Accepted |
| ADR-038 | Treat MockUSDC as a test-only asset | Accepted |
| ADR-039 | Frontend framework selection remains deferred | Deferred |
| ADR-040 | Final NFT metadata strategy remains deferred | Deferred |

---

# Accepted Decision Records

## ADR-001 — Personal Variant

**Status:** Accepted

**Category:** Mandatory requirement

### Context

The Capstone derives project parameters from student ID `3122560090`.

The final two digits are:

- `A = 0`;
- `B = 9`.

### Decision

SafeBank must use:

- grace period: 2 days;
- default APR: 200 bps;
- early withdrawal penalty: 750 bps;
- default tenor: 180 days;
- MockUSDC decimals: 6.

All MockUSDC amounts must use six-decimal conversion.

Tests and scripts must use `parseUnits(value, 6)` rather than `parseEther`.

### Rationale

These values are fixed by the personal variant and form part of the evaluation requirements.

### Trade-offs

The project cannot freely change these defaults for convenience.

Local demonstration acceleration, if later introduced, must be clearly separated from the official required parameters.

### Test implication

Tests must verify all five values explicitly.

### UI implication

The UI must consistently display:

- 2-day grace period;
- 2.00% APR;
- 7.50% penalty;
- 180-day default tenor;
- MockUSDC with six decimals.

---

## ADR-002 — Separation of Principal and Interest

**Status:** Accepted

**Category:** Mandatory requirement

### Context

Combining user principal and bank-funded interest would make accounting unclear and could allow one user's principal to fund another user's return.

### Decision

`SavingCore` holds user principal.

`VaultManager` holds bank-funded interest liquidity.

Interest is always paid through `VaultManager`.

Early-withdrawal penalties are transferred from principal held by `SavingCore` to the fee receiver.

### Rationale

This creates a clear custody boundary and makes solvency, payouts, and security analysis easier.

### Trade-offs

The system requires cross-contract calls and more deployment configuration.

### Test implication

Balance tests must prove that:

- opening a deposit increases the SavingCore token balance;
- funding the vault increases the VaultManager balance;
- maturity interest leaves VaultManager;
- principal leaves SavingCore;
- another user's principal is never used as interest.

### UI implication

The product must explain principal and interest as separate pools.

---

## ADR-003 — Current NFT Owner Holds Economic Rights

**Status:** Accepted

**Category:** SafeBank project decision

### Context

The specification requires an ERC721 certificate but leaves the exact economic effect of transfer open.

### Decision

The current result of `ownerOf(depositId)` determines who may:

- withdraw early;
- withdraw at maturity;
- manually renew.

The current owner receives principal and interest.

The original depositor loses those rights after transferring the certificate.

### Rationale

This gives the ERC721 certificate real ownership meaning and provides a clear answer to the required design question.

### Trade-offs

Users may transfer valuable economic rights accidentally.

A transfer race may cause a prepared transaction from the former owner to revert.

### Test implication

Tests must transfer the NFT from Alice to Bob and verify:

- Bob can withdraw or renew;
- Alice can no longer do so;
- unrelated users are rejected.

### UI implication

Display the warning:

> Transferring the NFT transfers the right to receive the deposit principal and interest.

---

## ADR-004 — Keep Completed NFTs

**Status:** Accepted

**Category:** SafeBank project decision

### Context

A completed deposit no longer needs an actionable certificate, but burning the NFT removes its usefulness as historical proof.

### Decision

SafeBank will not burn the NFT after:

- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renewal.

The associated deposit status makes the old NFT non-actionable.

### Rationale

The NFT remains a historical certificate and improves demonstration value.

### Trade-offs

Wallets will continue showing completed certificates.

The UI must clearly distinguish active and historical certificates.

### Test implication

Tests must verify that:

- ownership still exists after settlement;
- old-deposit actions revert because status is terminal;
- the old NFT cannot be used twice.

### UI implication

Completed certificates appear in a historical section with disabled actions.

---

## ADR-005 — Exact Maturity Boundary

**Status:** Accepted

**Category:** SafeBank project decision

### Context

The exact second of maturity must be classified consistently.

### Decision

Early withdrawal is valid only when:

`block.timestamp < maturityAt`

Maturity withdrawal is valid when:

`block.timestamp >= maturityAt`

At exactly `maturityAt`, the deposit is mature.

### Rationale

The rules are mutually exclusive and easy to test.

### Trade-offs

Frontend wall-clock time may differ slightly from the next mined block timestamp.

### Test implication

Test:

- one second before maturity;
- exact maturity;
- one second after maturity.

### UI implication

The UI must refresh state at maturity and must not rely only on a local countdown.

---

## ADR-006 — Exact Grace-Period Boundary

**Status:** Accepted

**Category:** SafeBank project decision

### Context

Manual renewal and auto-renew must not overlap ambiguously at the grace boundary.

### Decision

Manual renewal is valid when:

`maturityAt <= block.timestamp < maturityAt + gracePeriod`

Auto-renew is valid when:

`block.timestamp >= maturityAt + gracePeriod`

At the exact grace-period end:

- manual renewal is invalid;
- auto-renew is valid.

### Rationale

This creates one exact transition point without overlapping conditions.

### Trade-offs

A manual-renew transaction submitted near the boundary may be mined too late and revert.

### Test implication

Test exact boundary timestamps and surrounding seconds.

### UI implication

Display the grace deadline and warn users that transaction mining time determines validity.

---

## ADR-007 — Withdraw After Grace Period

**Status:** Accepted

**Category:** SafeBank project decision

### Context

Passing the grace period does not execute a transaction automatically.

The system must decide whether an owner remains able to withdraw.

### Decision

If the deposit remains `Active`, maturity withdrawal remains valid after the grace period.

After grace, both may be valid:

- owner maturity withdrawal;
- permissionless auto-renew.

The first successfully mined transaction determines the final status.

### Rationale

Bot failure must not lock user principal.

Time alone cannot change Solidity state.

### Trade-offs

A valid owner withdrawal and bot auto-renew can compete in the mempool.

### Test implication

Test withdrawal after grace and conflicting transaction ordering.

### UI implication

Do not display a deposit as renewed merely because time has passed.

Read the actual status from the contract.

---

## ADR-008 — Disabled Plan Behavior

**Status:** Accepted

**Category:** SafeBank project decision

### Context

Disabling a plan should stop future use without invalidating existing deposits.

### Decision

A disabled plan:

- cannot accept new deposits;
- cannot be selected for manual renewal;
- does not prevent early withdrawal of existing deposits;
- does not prevent maturity withdrawal;
- does not prevent snapshot-based auto-renew.

### Rationale

Plan administration must not confiscate or invalidate existing user rights.

### Trade-offs

A disabled plan may still have active liabilities and snapshot-based auto-renewals.

### Test implication

Test every allowed and blocked operation after plan disablement.

### UI implication

Explain that disabled status affects new deposits and manual renewal, not existing settlement rights.

---

## ADR-009 — Permissionless Auto-Renew

**Status:** Accepted

**Category:** Mandatory and SafeBank decision

### Context

Auto-renew requires an on-chain transaction.

Restricting the transaction to one bot creates unnecessary liveness risk.

### Decision

Any address may call auto-renew after the grace period.

The caller does not gain ownership or receive financial value solely for calling.

### Rationale

Permissionless execution improves liveness and reduces dependence on a bank-controlled bot.

### Trade-offs

The owner cannot guarantee that a competing auto-renew transaction will not be mined before its withdrawal transaction.

### Test implication

An unrelated account must successfully trigger auto-renew while the new NFT is minted to the old certificate owner.

### UI implication

Clearly display:

- caller;
- recipient;
- current owner;
- permissionless behavior.

---

## ADR-010 — Auto-Renew Snapshot Behavior

**Status:** Accepted

**Category:** SafeBank project decision

### Context

The project must decide which financial terms apply to a new auto-renewed deposit.

### Decision

Auto-renew preserves the old deposit's:

- tenor;
- `aprBpsAtOpen`;
- `penaltyBpsAtOpen`.

The auto-renewed deposit does not read current plan APR, penalty, tenor, or enabled state.

### Rationale

Auto-renew should continue the same contractual conditions without administrator intervention.

This also allows auto-renew when the original plan is disabled.

### Trade-offs

A legacy APR or penalty may continue even when the administrator no longer offers that plan to new users.

### Test implication

Change and disable the original plan, then verify that auto-renew uses old snapshots.

### UI implication

Show “terms preserved from previous deposit” and display each stored snapshot.

---

## ADR-011 — Bot Offline Behavior

**Status:** Accepted

**Category:** SafeBank project decision

### Context

A bot may remain offline for days or months.

### Decision

No renewal and no additional term interest occurs automatically while no transaction is executed.

The deposit remains active.

After grace:

- the owner may withdraw;
- the owner may trigger auto-renew;
- any other account may trigger auto-renew.

One delayed auto-renew creates one new term, not multiple retroactive terms.

### Rationale

Solidity state changes require transactions.

Retroactively creating several compounded terms would add complexity and unpredictable liabilities.

### Trade-offs

Users do not receive interest for multiple hypothetical renewal terms during bot downtime.

### Test implication

Advance time by multiple terms and verify that one auto-renew transaction creates only one new deposit.

### UI implication

Do not display accumulated unexecuted renewal terms.

---

## ADR-012 — Rounding Dust

**Status:** Accepted

**Category:** SafeBank project decision

### Context

Solidity integer division rounds down.

### Decision

Users receive rounded-down interest and penalty calculations.

Interest rounding dust remains in `VaultManager`.

No additional token is minted to compensate for rounding.

### Rationale

This is deterministic, simple, and compatible with ERC20 integer accounting.

### Trade-offs

A very small residual amount remains in the vault.

### Test implication

Use non-divisible examples and verify exact token conservation.

### UI implication

Show contract-equivalent values and optionally explain that blockchain token calculations round down.

---

## ADR-013 — Pause Scope

**Status:** Accepted

**Category:** SafeBank security decision

### Context

An emergency pause is useful only when all relevant financial entry points respect it.

### Decision

When the relevant contract is paused, SafeBank blocks:

- opening deposits;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claims;
- interest payout.

Read-only functions remain available.

### Rationale

This reduces additional state changes during incident investigation.

### Trade-offs

Legitimate users may temporarily be unable to recover funds.

Pause does not solve insolvency or recover compromised keys.

### Test implication

Every blocked function requires its own pause test.

### UI implication

Display exact pause scope and disable affected actions.

---

## ADR-014 — Non-Upgradeable Architecture

**Status:** Accepted

**Category:** SafeBank architecture decision

### Context

Upgradeable proxies introduce proxy administration, initializer, storage-layout, and upgrade-governance risks.

The project removed upgradeable dependencies during Phase 0.

### Decision

SafeBank uses ordinary non-upgradeable contract deployments.

The project will not reinstall upgrade plugins unless a later accepted decision explicitly changes the architecture.

### Rationale

The model is easier to reason about, test, demonstrate, and defend orally.

### Trade-offs

A deployed contract bug requires a new deployment rather than an in-place patch.

### Test implication

No proxy-specific tests are needed.

Constructor configuration must be tested carefully.

### UI implication

Deployment addresses may change when a corrected version is redeployed.

---

## ADR-015 — Basic ERC721 Instead of ERC721Enumerable

**Status:** Accepted

**Category:** SafeBank architecture decision

### Context

The frontend needs to display owned certificates, but enumeration adds storage writes and gas cost to every mint and transfer.

### Decision

`SavingCore` will use standard OpenZeppelin `ERC721`, not `ERC721Enumerable`.

Owned-deposit discovery will use:

- deposit events;
- NFT transfer events;
- direct ownership verification;
- optional off-chain indexing.

No unbounded on-chain owner-deposit loop will be added.

### Rationale

This keeps the contract smaller and reduces gas and denial-of-service concerns.

### Trade-offs

The frontend cannot call a built-in `tokenOfOwnerByIndex`.

It must query events or use indexing.

### Test implication

Tests focus on ownership and transfer correctness rather than enumeration.

### UI implication

The frontend data layer must reconcile event-derived lists with current `ownerOf` values.

---

## ADR-016 — NFT Token ID Equals Deposit ID

**Status:** Accepted

**Category:** SafeBank architecture decision

### Context

Using separate NFT and deposit identifiers would create unnecessary mapping and UI complexity.

### Decision

For every deposit:

`tokenId == depositId`

### Rationale

This simplifies:

- ownership checks;
- events;
- frontend routing;
- debugging;
- oral explanation.

### Trade-offs

NFT and deposit lifecycles remain tightly coupled.

### Test implication

Every deposit-opening and renewal test must verify token ID and deposit ID equality.

### UI implication

The UI may display one identifier as both Deposit ID and Certificate ID while explaining the equivalence.

---

## ADR-017 — Identifiers Start at One

**Status:** Accepted

**Category:** SafeBank implementation decision

### Context

Solidity mappings return zero-value structures for nonexistent keys.

Starting identifiers at zero makes a default mapping entry easier to confuse with a real first entry.

### Decision

Plan IDs and deposit IDs start at `1`.

ID `0` is always invalid.

### Rationale

This simplifies existence validation and debugging.

### Trade-offs

Counters require an initial increment or initial value of one.

### Test implication

Verify that:

- first plan ID is 1;
- first deposit ID is 1;
- ID 0 reverts.

### UI implication

No user-facing item uses ID zero.

---

## ADR-018 — One-Time SavingCore Authorization

**Status:** Accepted

**Category:** SafeBank security decision

### Context

VaultManager must authorize SavingCore, but VaultManager is deployed before SavingCore in the planned sequence.

Allowing unrestricted replacement creates vault-drain risk.

### Decision

VaultManager will provide a one-time owner-only authorization function.

The function must:

- reject zero address;
- reject authorization when already configured;
- require a deployed contract address where practical;
- emit `SavingCoreAuthorized`.

After successful setup, the authorized SavingCore address cannot be replaced in the current architecture.

### Rationale

This resolves deployment ordering while reducing long-term administrator power.

### Trade-offs

Incorrect configuration requires redeployment.

### Test implication

Test:

- owner authorization;
- non-owner rejection;
- zero address;
- externally owned account if code validation is used;
- second authorization rejection;
- only configured SavingCore may request payout.

### UI implication

The Admin Portal displays the configured address as immutable and does not offer a replacement action.

---

## ADR-019 — Ownable2Step

**Status:** Accepted

**Category:** SafeBank security decision

### Context

A one-step ownership transfer may permanently transfer control to an incorrect address.

### Decision

Privileged contracts use OpenZeppelin `Ownable2Step`.

### Rationale

The new owner must explicitly accept control.

### Trade-offs

Ownership transfer requires two transactions.

A pending transfer may remain unaccepted.

### Test implication

Test initiation, acceptance, non-pending acceptance, and previous-owner loss of authority.

### UI implication

Show pending owner and provide separate start and accept states if ownership management is exposed.

---

## ADR-020 — Separate Contract Pause States

**Status:** Accepted

**Category:** SafeBank architecture and security decision

### Context

SavingCore and VaultManager have different responsibilities and are independently deployed.

A single pause variable shared across contracts would require unnecessary coupling.

### Decision

SavingCore and VaultManager each maintain their own pause state.

The same administrator is expected to own both contracts.

An operational “global pause” means pausing both contracts.

### Rationale

Each contract enforces its own security boundary.

### Trade-offs

The states may become inconsistent if only one transaction succeeds.

### Test implication

Test each contract separately and test system behavior under mixed pause states.

### UI implication

Display both pause states explicitly.

The Admin Portal must not show one global “Operational” label when one contract is paused.

---

## ADR-021 — Plan Mutability

**Status:** Accepted

**Category:** Mandatory and SafeBank decision

### Context

The required administration includes updating APR and enabling or disabling plans.

Allowing every field to change would make plan history difficult to understand.

### Decision

After plan creation:

- tenor is immutable;
- min deposit is immutable;
- max deposit is immutable;
- penalty is immutable;
- APR may be updated for future deposits;
- enabled state may change.

To offer different tenor, limits, or penalty, the administrator creates a new plan.

### Rationale

This preserves clear plan identity while meeting the required APR-update behavior.

### Trade-offs

More plan records may exist over time.

### Test implication

Verify APR updates and enabled-state changes while ensuring deposit snapshots remain unchanged.

### UI implication

Only APR and status have edit actions.

Other changes require creating a new plan.

---

## ADR-022 — Plan Validation Bounds

**Status:** Accepted

**Category:** SafeBank implementation and security decision

### Context

Unbounded APR, penalty, and tenor values can create arithmetic risk or nonsensical products.

### Decision

The planned validation bounds are:

- tenor: 1 to 3,650 days;
- APR: 1 to 10,000 bps;
- penalty: 0 to 10,000 bps;
- amount: greater than zero;
- when min and max are both nonzero, min must not exceed max;
- min zero means no lower plan limit;
- max zero means no upper plan limit.

These are contract validation bounds, not claims that every allowed value is financially sensible.

### Rationale

The bounds prevent zero-term plans, interest above 100% APR, and penalties above principal.

### Trade-offs

Changing these limits after deployment is impossible in the non-upgradeable model.

### Test implication

Test every lower bound, upper bound, and one value outside each bound.

### UI implication

Admin forms display allowed ranges and percentage conversions.

---

## ADR-023 — SafeERC20 and ReentrancyGuard

**Status:** Accepted

**Category:** SafeBank security decision

### Context

ERC20 transfers are external interactions and may return false, return no value, or revert.

Financial functions may be targeted by reentrancy.

### Decision

SafeBank will use:

- OpenZeppelin `SafeERC20`;
- `ReentrancyGuard`;
- checks-effects-interactions;
- state changes before external settlement interactions where appropriate.

State-changing user financial entry points will use `nonReentrant`.

### Rationale

These controls reduce token-compatibility and reentrancy risks.

### Trade-offs

They do not make arbitrary malicious ERC20 tokens safe.

### Test implication

Use malicious or failing token mocks and reentrant receiver mocks where applicable.

### UI implication

External-call failures must be mapped to understandable transaction errors.

---

## ADR-024 — Safe NFT Minting

**Status:** Accepted

**Category:** SafeBank security and compatibility decision

### Context

Minting to a contract using ordinary minting can permanently lock an NFT in a contract that cannot receive ERC721 tokens.

Safe minting invokes an external receiver hook and therefore introduces reentrancy considerations.

### Decision

SafeBank will use safe minting for deposit certificates.

Before safe minting:

- the deposit record is created;
- its status is valid;
- counters are updated;
- the function is protected by `nonReentrant`.

If the recipient contract rejects the NFT, the entire transaction reverts.

### Rationale

This protects recipients from accidentally receiving an unusable certificate while maintaining atomicity.

### Trade-offs

Minting costs more gas and invokes an external callback.

### Test implication

Test:

- EOA recipient;
- valid ERC721 receiver;
- invalid receiver;
- receiver reentrancy attempt;
- complete transaction rollback on rejection.

### UI implication

A contract wallet that cannot receive ERC721 certificates must receive a clear failure explanation.

---

## ADR-025 — Renewal Requires Funded Interest

**Status:** Accepted

**Category:** SafeBank financial decision

### Context

Renewal compounds old interest into new principal.

Adding unpaid interest would create principal not backed by tokens in SavingCore.

### Decision

Manual and auto-renew succeed only when VaultManager can fund the complete old-term interest.

If funding fails:

- renewal reverts;
- old deposit remains active;
- no new deposit is created;
- no new NFT is minted;
- no unfunded interest is added to principal.

### Rationale

Every new principal amount must be fully token-backed.

### Trade-offs

An underfunded vault can prevent renewal.

### Test implication

Test complete rollback when the vault lacks interest.

### UI implication

Explain that compounding is unavailable and maturity withdrawal remains an alternative.

---

## ADR-026 — Bonus C1 Principal-First Settlement

**Status:** Accepted

**Category:** Bonus C1

### Context

The base maturity flow may lock principal when VaultManager cannot pay interest.

### Decision

After C1 is implemented:

- principal is returned at maturity even when interest cannot be paid;
- unpaid interest becomes pending debt;
- the deposit becomes terminal;
- the claimant can later claim after vault funding.

C1 applies to maturity withdrawal, not renewal.

### Rationale

User principal should not remain locked solely because the bank interest pool is underfunded.

### Trade-offs

The project must manage deferred debt and later claims.

Interest payment may be delayed.

### Test implication

Test funded and underfunded maturity settlement, claimant authorization, later claim, and double-claim protection.

### UI implication

Show principal settlement and pending interest as separate outcomes.

---

## ADR-027 — Pending-Interest Claimant Snapshot

**Status:** Accepted

**Category:** Bonus C1

### Context

The NFT remains transferable after maturity settlement.

The project must decide whether transferring the historical NFT also transfers already deferred interest.

### Decision

At C1 settlement, SafeBank snapshots:

- pending amount;
- current NFT owner as claimant.

A later NFT transfer does not change the claimant.

### Rationale

The deferred debt belongs to the owner whose maturity settlement created it.

This prevents ownership disputes after settlement.

### Trade-offs

The NFT and pending-interest claim become separate rights after settlement.

### Test implication

Transfer the NFT after settlement and verify only the snapshotted claimant may claim.

### UI implication

Display claimant separately from current NFT owner on historical certificates.

---

## ADR-028 — Bonus C2 Solvency Guard

**Status:** Accepted

**Category:** Bonus C2

### Context

Without liability accounting, the administrator may withdraw vault funds expected to cover active deposits.

### Decision

C2 will track:

`totalReservedInterest`

Available liquidity is:

`max(vaultBalance - totalReservedInterest, 0)`

Administrator withdrawal cannot exceed available liquidity.

### Rationale

This prevents the administrator from worsening interest undercollateralization by withdrawing reserved funds.

### Trade-offs

Reserve accounting adds lifecycle complexity.

The vault may still be underfunded if it was never sufficiently funded.

### Test implication

Test reservation, release, consumption, renewal transitions, undercollateralization, and withdrawal limits.

### UI implication

Display vault balance, reserved interest, available liquidity, solvency ratio, and funding shortfall.

---

## ADR-029 — Permit Undercollateralized Deposit Opening

**Status:** Accepted

**Category:** Bonus C2 and business decision

### Context

The system must decide whether a new deposit should be rejected when VaultManager does not currently hold enough interest for its expected liability.

### Decision

Opening a valid deposit is not automatically blocked by insufficient vault collateral.

The expected liability is still recorded after C2.

The administrator cannot withdraw reserved liquidity.

C1 protects principal recovery if interest remains underfunded at maturity.

### Rationale

This demonstrates liability transparency and the interaction of C1 and C2 without requiring full pre-funding.

### Trade-offs

Interest may be delayed.

The product cannot truthfully promise immediate interest payment.

### Test implication

Open a deposit while undercollateralized and verify reserve and shortfall metrics.

### UI implication

Display clear underfunding warnings and do not state that interest is guaranteed immediately.

---

## ADR-030 — Reserve Treatment of Pending Interest

**Status:** Accepted

**Category:** Bonus integration decision

### Context

When C1 defers interest, releasing the old reserve immediately would allow an administrator to withdraw funds later needed for the pending claim.

### Decision

An unpaid C1 interest liability remains included in `totalReservedInterest`.

Reserve behavior is:

- normal funded maturity payout: consume reserve;
- C1 deferred settlement: keep the unpaid amount reserved;
- pending-interest claim: consume the remaining reserve when payment succeeds;
- early withdrawal: release active-term reserve;
- renewal: consume old reserve and create new-term reserve.

### Rationale

Pending interest remains a real system liability until paid.

### Trade-offs

C1 and C2 integration becomes more complex.

### Test implication

Verify total reserve before deferral, after deferral, and after claim.

### UI implication

Reserved interest includes both active expected interest and unpaid pending liabilities.

The Admin Portal must explain this definition.

---

## ADR-031 — Exact-Amount Approval

**Status:** Accepted

**Category:** Product security extension

### Context

Unlimited ERC20 approvals increase the amount a compromised spender could transfer.

### Decision

The SafeBank frontend defaults to approving the exact deposit amount.

It will not default to unlimited approval.

### Rationale

This limits approval exposure and makes the transaction easier to explain.

### Trade-offs

Each new deposit may require another approval transaction.

### Test implication

Frontend tests verify spender and exact amount.

### UI implication

Approval and deposit opening are shown as two distinct steps.

---

## ADR-032 — Frontend Guards Are UX Only

**Status:** Accepted

**Category:** Product security extension

### Context

A user can bypass frontend routes and call a contract directly.

### Decision

Frontend admin route guards may hide or disable controls but are not treated as security.

Solidity access control is authoritative.

### Rationale

Client-side code cannot enforce blockchain authorization.

### Trade-offs

Read-only admin data may remain publicly accessible on-chain.

### Test implication

Contract tests must reject unauthorized callers independently of frontend behavior.

### UI implication

The Admin Portal may state that authorization is enforced on-chain.

---

## ADR-033 — AI Is Read-Only and Advisory

**Status:** Accepted

**Category:** AI extension

### Context

Allowing AI to sign or submit financial transactions would create unacceptable key, hallucination, and authorization risks.

### Decision

AI assistants may:

- explain;
- compare;
- summarize;
- calculate from verified deterministic inputs;
- warn;
- recommend for human review.

AI assistants may not:

- hold keys;
- request seed phrases;
- sign;
- submit transactions;
- modify plans;
- withdraw;
- fund;
- pause;
- fabricate values.

### Rationale

AI remains outside the financial authorization boundary.

### Trade-offs

Users must still perform and confirm every action themselves.

### Test implication

AI integration tests must verify fallback behavior and absence of autonomous writes.

### UI implication

Label AI output as explanation or recommendation, not authoritative state.

---

## ADR-034 — Contract State Is the Source of Truth

**Status:** Accepted

**Category:** Architecture and product decision

### Context

Frontend caches, RPC data, event indexes, and AI responses may be stale or incomplete.

### Decision

Current contract storage and transaction receipts are authoritative.

Events support history and indexing but do not replace storage for critical current state.

### Rationale

This prevents the product from treating off-chain interpretation as final truth.

### Trade-offs

The UI must refresh and reconcile data after transactions.

### Test implication

Frontend tests must handle stale cached data and refresh from contract state.

### UI implication

Distinguish estimates, submitted state, confirmed receipts, and current on-chain state.

---

## ADR-035 — Interest Year and Compounding Model

**Status:** Accepted

**Category:** Mandatory financial decision

### Context

Interest calculations require a consistent year basis and compounding rule.

### Decision

SafeBank uses:

- 365 days per year;
- 86,400 seconds per day;
- 10,000 basis points per 100%;
- simple interest inside one term;
- multiplication before division;
- compounding only after successful renewal.

Formula:

`principal × aprBps × tenorSeconds ÷ (365 days × 10,000)`

### Rationale

This matches the Capstone formula and is deterministic.

### Trade-offs

The model does not account for leap years or variable day-count conventions.

### Test implication

Use fixed known examples and exact integer results.

### UI implication

The calculator must mirror integer floor behavior.

---

## ADR-036 — No Administrator Editing of Active Deposits

**Status:** Accepted

**Category:** SafeBank security decision

### Context

An administrator function that edits active deposit principal, owner, maturity, APR, or penalty would undermine snapshots and ownership guarantees.

### Decision

SafeBank will not provide an administrator function to mutate active deposit financial terms or ownership.

Deposit state changes occur only through defined user and renewal flows.

### Rationale

This protects user expectations and reduces privileged attack surface.

### Trade-offs

Mistaken deposits cannot be manually corrected by an administrator.

### Test implication

No administrative path may change active deposit data.

### UI implication

The Admin Portal provides read-only deposit inspection, not deposit editing.

---

## ADR-037 — First Mined Terminal Action Wins

**Status:** Accepted

**Category:** SafeBank concurrency decision

### Context

Two conflicting transactions may be valid when submitted but cannot both settle one deposit.

### Decision

The first successfully mined terminal action changes the status.

Every later conflicting transaction reverts because the deposit is no longer active.

SafeBank does not attempt to impose an off-chain priority rule.

### Rationale

This matches blockchain transaction ordering and keeps the state machine deterministic.

### Trade-offs

Users cannot guarantee ordering between competing mempool transactions.

### Test implication

Test multiple action sequences and terminal-state rejection.

### UI implication

Refresh status immediately after confirmation and explain possible transaction competition after grace.

---

## ADR-038 — MockUSDC Is Test-Only

**Status:** Accepted

**Category:** Mandatory and product decision

### Context

MockUSDC has public minting and no real backing.

### Decision

MockUSDC is used only for:

- local tests;
- local demos;
- Sepolia demos.

The project must never describe it as real USDC or a real stablecoin.

### Rationale

This prevents financial misrepresentation.

### Trade-offs

The system does not demonstrate production-token risk completely.

### Test implication

Verify 6 decimals and mint behavior.

### UI implication

Display a persistent test-token warning.

---

# Deferred Decisions

## ADR-039 — Frontend Framework

**Status:** Deferred

**Category:** Product extension

### Context

The frontend has not yet been created.

Potential options include React Vite and Next.js.

### Decision

No framework is selected during Phase 1.

The decision will be made before Phase 15 based on:

- React requirement;
- wallet compatibility;
- routing;
- testing;
- AI server requirements;
- deployment simplicity;
- environment security.

### Rationale

Contract APIs should stabilize before frontend dependencies are selected.

### Trade-offs

Detailed frontend folder structure remains provisional.

### Test implication

None during Phase 1.

### UI implication

Routes and components in UI documentation are plans, not existing implementation.

---

## ADR-040 — NFT Metadata Strategy

**Status:** Deferred

**Category:** Product and architecture decision

### Context

The certificate needs a name and symbol, but rich metadata is not required by the core specification.

Mutable metadata introduces additional administrator and hosting concerns.

### Decision

Phase 5 does not implement a custom `tokenURI` override or rich per-token metadata.

The remaining rich metadata and external presentation strategy stays deferred to a later product phase.

The implemented direction is:

- use the fixed collection name `SafeBank Deposit Certificate`;
- use the fixed collection symbol `SBDC`;
- rely on the inherited basic ERC721 metadata behavior;
- avoid mutable administrator-controlled financial metadata;
- derive all authoritative financial information from `getDeposit`;
- treat any future external metadata as presentation only.

### Rationale

Financial state must not depend on a metadata server.

### Trade-offs

Wallet marketplace presentation may remain basic.

### Test implication

Phase 5 tests validate deposit rights through stored deposit data and NFT ownership.

Any future metadata tests must ensure metadata cannot alter deposit terms, status, ownership, or economic rights.

### UI implication

SafeBank UI reads financial details directly from SavingCore.

---

# Rejected Alternatives

## 5. Upgradeable Proxy Contracts

**Status:** Rejected

Reasons:

- greater deployment complexity;
- proxy-admin risk;
- initializer risk;
- storage-layout risk;
- unnecessary for the Capstone scope;
- upgrade dependencies were removed during Phase 0.

---

## 6. ERC721Enumerable

**Status:** Rejected

Reasons:

- additional storage writes;
- higher transfer and mint gas;
- unnecessary on-chain enumeration;
- possible reliance on large loops;
- event indexing is sufficient for the planned frontend.

---

## 7. Burn NFT After Settlement

**Status:** Rejected

Reasons:

- removes the historical certificate;
- reduces demonstration and audit value;
- status already prevents reuse.

---

## 8. Original Depositor Retains Rights

**Status:** Rejected

Reasons:

- makes NFT transfer economically misleading;
- conflicts with the selected certificate-ownership model;
- complicates the required transfer design answer.

---

## 9. Auto-Renew Restricted to Bank Bot

**Status:** Rejected

Reasons:

- creates liveness dependence;
- increases operational-key importance;
- provides no ownership-security advantage.

---

## 10. Unlimited Approval by Default

**Status:** Rejected

Reasons:

- unnecessarily increases token allowance exposure;
- makes transaction intent less clear;
- exact approval is sufficient for the demonstration.

---

## 11. Automatic Multi-Term Catch-Up

**Status:** Rejected

Reasons:

- time alone cannot execute state;
- creates unpredictable compounded liabilities;
- increases arithmetic and reserve complexity;
- makes bot downtime economically ambiguous.

---

## 12. Administrator Can Withdraw Reserved Interest

**Status:** Rejected after C2

Reasons:

- defeats solvency accounting;
- can worsen undercollateralization;
- conflicts with the purpose of the bonus.

---

## 13. AI Autonomous Transactions

**Status:** Rejected

Reasons:

- private-key risk;
- hallucination risk;
- unclear authorization;
- difficult auditability;
- unnecessary for the Capstone.

---

# Cross-Decision Invariants

## 14. Principal Invariant

For every active deposit, its principal must be backed by tokens held in SavingCore.

## 15. Interest Invariant

Interest is paid from VaultManager, not from unrelated principal.

## 16. Ownership Invariant

Current NFT ownership controls active-deposit economic actions.

## 17. State Invariant

One active deposit reaches one terminal state.

## 18. Snapshot Invariant

Later plan updates do not alter old deposit terms.

## 19. Renewal Invariant

A new principal includes interest only after the interest is actually funded.

## 20. Historical NFT Invariant

Retaining an NFT does not permit reuse of a terminal deposit.

## 21. C1 Invariant

Principal and pending interest cannot each be paid more than once.

## 22. C2 Invariant

Reserved liabilities cannot be released, consumed, or created twice.

## 23. Pause Invariant

Every intended financial entry point checks the appropriate pause state.

## 24. Conservation Invariant

Every successful flow reconciles exact token balance changes.

---

# Required Design Answers Mapping

## 25. Transferable Certificate

Question:

If Alice transfers the NFT to Bob, who may withdraw?

Answer:

Bob, because current `ownerOf(depositId)` controls the economic rights.

Implementation evidence and exact source lines will be added after SavingCore exists.

---

## 26. Empty Vault

Question:

What happens when the vault lacks interest?

Base behavior:

The maturity transaction may revert.

Final SafeBank behavior after C1:

- principal is returned;
- unpaid interest becomes pending;
- the claimant may claim later.

---

## 27. Dead Bot

Question:

What happens if the bot is offline for one month?

Answer:

- deposit remains active;
- principal remains in SavingCore;
- owner may withdraw;
- any account may trigger auto-renew;
- no multiple retroactive terms are created.

---

## 28. Rounding Dust

Question:

Who owns rounding dust?

Answer:

Rounding dust remains in VaultManager.

Exact token-balance tests will prove this behavior.

---

## 29. Boundary Times

Question:

What happens at exact maturity?

Answer:

The deposit is mature.

Question:

What happens at exact grace-period end?

Answer:

Manual renewal ends and auto-renew begins.

---

## 30. Disabled Plan

Question:

What can an existing user still do after a plan is disabled?

Answer:

- withdraw early when not mature;
- withdraw at maturity;
- auto-renew using snapshots.

The user cannot:

- open a new deposit using the plan;
- manually renew into the disabled plan.

---

## 31. Attack Thinking

Planned primary oral-defense example:

A malicious contract attempts to re-enter withdrawal before the first withdrawal completes.

Planned defenses:

- `nonReentrant`;
- active-status validation;
- terminal status update before external transfers;
- transaction atomicity;
- reentrancy tests.

The final answer must cite actual code and tests after implementation.

---

# Implementation Consequences

## 32. Expected SavingCore Storage Direction

The implementation is expected to include:

- plan counter starting at one;
- deposit counter starting at one;
- mapping from plan ID to plan;
- mapping from deposit ID to deposit;
- ERC721 ownership;
- VaultManager reference;
- MockUSDC reference;
- fixed two-day grace period;
- pending-interest data after C1.

Exact Solidity struct layout remains an implementation detail and must be reviewed before coding.

---

## 33. Expected VaultManager Storage Direction

The implementation is expected to include:

- MockUSDC reference;
- fee receiver;
- one-time authorized SavingCore;
- pause state;
- total reserved interest after C2.

Exact variable ordering is not constrained by proxy storage because the contracts are non-upgradeable.

---

## 34. Expected Event Direction

Mandatory events remain:

- PlanCreated;
- PlanUpdated;
- DepositOpened;
- Withdrawn;
- Renewed.

Additional accepted event direction includes:

- plan enabled and disabled;
- vault funded and withdrawn;
- fee receiver updated;
- SavingCore authorized;
- interest paid;
- interest deferred;
- pending interest claimed;
- interest reserved;
- reserve released;
- pause and unpause events inherited or supplemented where necessary.

Exact indexed fields will be finalized during implementation.

---

## 35. Expected Custom Error Direction

The project prefers custom errors for:

- invalid address;
- invalid amount;
- invalid plan;
- disabled plan;
- invalid APR;
- invalid tenor;
- invalid penalty;
- min greater than max;
- deposit not found;
- deposit not active;
- not certificate owner;
- too early;
- manual-renew window closed;
- auto-renew too early;
- insufficient vault liquidity;
- unauthorized SavingCore;
- SavingCore already configured;
- no pending interest;
- wrong claimant;
- withdrawal exceeds available liquidity.

Exact names are intentionally deferred until the associated contract phase.

---

# Decision Change Process

## 36. Changing an Accepted Decision

An accepted decision may change only when:

1. a conflict with the Capstone requirement is found;
2. implementation reveals a technical limitation;
3. a security review identifies a safer alternative;
4. testing proves the current behavior is incorrect;
5. the user explicitly approves the change.

The change must:

- create a new decision record or update the existing record;
- explain what changed;
- explain why;
- identify affected files;
- update tests;
- update UI behavior;
- update README and demo material.

---

## 37. No Silent Architecture Changes

The project must not silently change:

- NFT ownership rights;
- financial formulas;
- time boundaries;
- reserve accounting;
- claimant behavior;
- administrator authority;
- pause scope;
- contract upgradeability;
- principal and interest custody.

Any such change requires explicit documentation and user confirmation.

---

# Phase 1 Decision Status

## 38. Decisions Finalized During Phase 1

Phase 1 has finalized the planned behavior for:

- personal variant;
- principal and interest separation;
- current NFT owner rights;
- historical NFT retention;
- maturity and grace boundaries;
- withdrawal after grace;
- disabled plans;
- permissionless auto-renew;
- auto-renew APR, tenor, and penalty snapshots;
- bot failure;
- rounding;
- pause;
- non-upgradeable contracts;
- basic ERC721;
- identifier strategy;
- one-time SavingCore authorization;
- ownership model;
- plan mutability and bounds;
- safe token and NFT interactions;
- renewal funding;
- C1;
- C2;
- undercollateralization;
- pending-interest reserve treatment;
- frontend approval;
- route-guard limitations;
- AI limitations.

## 39. Decisions Still Deferred

The following remain deferred until their relevant phases:

- final frontend framework;
- wallet library;
- styling system;
- NFT metadata implementation;
- exact custom error names;
- exact Solidity struct layout;
- exact event indexed parameters;
- AI provider;
- frontend deployment provider;
- event-indexing technology.

Deferred details must not contradict accepted financial and security behavior.

---

## 40. Phase Status

At the time this document is created:

Completed:

- decision documentation;
- classification of mandatory requirements;
- classification of SafeBank-specific behavior;
- bonus decisions;
- product and AI constraints;
- rejected-alternative analysis.

Not implemented:

- Solidity contracts;
- tests;
- contract coverage;
- deploy scripts;
- local deployment;
- Sepolia deployment;
- Etherscan verification;
- frontend;
- AI assistants;
- bonus C1 code;
- bonus C2 code.

This file records the intended design only.

---

## 41. Final Decision Position

SafeBank will be implemented as a non-upgradeable, three-contract savings system in which:

1. SavingCore holds principal.
2. VaultManager holds interest liquidity.
3. MockUSDC is a six-decimal test token.
4. ERC721 ownership represents active economic rights.
5. Deposit terms are snapshotted.
6. Exact timestamp boundaries control valid actions.
7. One successful terminal action ends an old deposit.
8. Auto-renew is permissionless but cannot steal ownership.
9. Renewal cannot create unfunded principal.
10. C1 returns principal before deferring unpaid interest.
11. C2 prevents withdrawal of reserved liquidity.
12. The frontend and AI never replace on-chain authorization.
13. Every implemented decision must be proven through tests and actual execution output.
