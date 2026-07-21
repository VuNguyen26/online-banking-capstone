# SafeBank UI/UX Plan

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank / Online Banking System |
| Document | UI/UX Product Plan |
| Current project phase | Phase 14 — Sepolia deployment and Etherscan verification |
| Implementation status | Frontend remains planned only; mandatory contracts, Bonus C1, Bonus C2, local deployment, Sepolia deployment, public metadata, and explorer verification are implemented and validated |
| Target product areas | User Banking App and Admin Portal |
| Product style | Modern, trustworthy, clear, accessible, and responsive |
| Branding model | Original SafeBank identity |
| Test asset | MockUSDC with 6 decimals |
| Student ID | 3122560090 |

This document defines the planned SafeBank user experience and is aligned with
the implemented contract, local deployment, and public Sepolia interfaces
through Phase 14. No frontend application has been created yet.

The public deployment is educational and uses freely mintable MockUSDC with no
real-world monetary value.

## 1.1 SafeBank Personal Variant

The frontend must consistently present the personal variant derived from student ID `3122560090`.

Required values:

- grace period: 2 days;
- default APR: 200 bps = 2.00% per year;
- early withdrawal penalty: 750 bps = 7.50%;
- default tenor: 180 days;
- MockUSDC decimals: 6 decimals.

UI calculations and input handling must use six-decimal token units.

The interface must not use `parseEther` for MockUSDC.

## 1.2 Phase 13 Local Integration Baseline

The future frontend may rely on these implemented and locally validated
interfaces:

- saving-plan creation, APR update, enable, disable, and reads;
- deposit opening and ERC721 certificate issuance;
- maturity withdrawal and early withdrawal;
- manual renewal and permissionless auto-renew;
- C1 pending-interest reads and claims;
- C2 reserved-interest, available-liquidity, and funding-shortfall reads;
- owner vault withdrawal constrained by available liquidity;
- plan, deposit, certificate, ownership, token, fee receiver, authorization,
  and independent pause reads;
- implemented custom errors and lifecycle events;
- production ABIs for MockUSDC, VaultManager, and SavingCore.

Phase 13 also provides:

- an ephemeral Hardhat deployment command;
- a persistent localhost reset-deployment command;
- an idempotent localhost reconciliation command;
- a read-only localhost verification command;
- deterministic local roles for admin, fee receiver, two users, and keeper;
- canonical plan ID `1`;
- deterministic user and vault balances;
- no pre-created deposits.

The standard local addresses are deterministic only under the default Hardhat
mnemonic. A future frontend must read environment-specific addresses from a
defined configuration source and must validate:

- chain ID;
- address format;
- deployed bytecode;
- token, vault, and SavingCore relationships.

No frontend route, component, transaction hook, wallet integration, or
rendered metric exists yet.

The frontend must not present these as available yet:

- autonomous AI transaction execution;
- rich NFT metadata.

Contract state remains authoritative even when the UI displays a deterministic
estimate.

## 1.3 Phase 14 Public Integration Baseline

The future frontend may consume:

- production ABIs for MockUSDC, VaultManager, and SavingCore;
- `data/deployments/sepolia.json`;
- tracked Sepolia deployment records;
- verified Etherscan links.

Validated configuration:

| Item | Value |
|---|---|
| Chain ID | `11155111` |
| MockUSDC | `0xcf779EC5D80573D3254054a17c5B4f0117491662` |
| VaultManager | `0xA79F660FaB4Ebae6Ac4298034Cb3FD6d28e5D2f7` |
| SavingCore | `0xa35c55e7E2dB5874699cC9fb8d0E25032f51b443` |
| Initial administrator | `0xA998526b0A5F23680f50fa3677f5c6576Dba89d9` |
| Canonical plan | ID `1` |
| Initial deposit count | `0` |
| Initial vault balance | `0` |

The future frontend must still validate chain ID, address format, bytecode,
token decimals, contract relationships, owners, fee receiver, and pause state
at runtime.

The UI must not treat a metadata flag or Etherscan verification as an
authorization boundary or security audit.

No Sepolia demo user balances or deposits exist yet. Local deterministic
addresses remain local-only.

## 2. Product Vision

SafeBank presents blockchain-based fixed-term savings through a product experience that feels understandable, transparent, and controlled.

The interface should help users understand:

- what they are depositing;
- which saving plan they selected;
- how interest is calculated;
- when the deposit matures;
- what happens during early withdrawal;
- what an NFT certificate represents;
- what manual renewal means;
- what permissionless auto-renew means;
- what happens when the vault lacks interest;
- which transaction is being signed.

The product must not hide blockchain behavior behind misleading banking language.

It should explain Web3 concepts in clear language while preserving factual accuracy.

---

## 3. Product Principles

## 3.1 Trust Through Clarity

Every important financial value must be visible before the user signs.

The interface should show:

- token;
- amount;
- plan;
- APR;
- tenor;
- maturity;
- expected interest;
- expected payout;
- penalty;
- recipient;
- contract;
- network.

## 3.2 Contract State Is Authoritative

The UI may calculate estimates, but on-chain state is the source of truth.

The frontend must distinguish:

- estimated value;
- confirmed on-chain value;
- pending transaction value;
- historical event value.

## 3.3 No Hidden Financial Actions

The interface must not:

- automatically approve tokens;
- automatically submit transactions;
- automatically sign;
- automatically renew without a transaction;
- hide the difference between approval and deposit opening;
- default to unlimited approval;
- silently switch networks;
- silently change an entered amount.

## 3.4 User-Controlled Transactions

Every state-changing transaction must be confirmed through the user's wallet.

The application prepares the action.

The wallet signs and submits it.

## 3.5 Explain Before Asking for Signature

Before opening MetaMask or another compatible wallet, the UI must explain:

- what action will happen;
- which contract will receive the call;
- what token amount may move;
- what expected state change will occur;
- which risks are relevant.

## 3.6 Progressive Disclosure

Basic users should see a clear summary first.

Advanced details may be expandable, including:

- contract address;
- transaction hash;
- token smallest-unit amount;
- exact timestamp;
- deposit ID;
- NFT token ID;
- event fields;
- reserve information;
- pending-interest details.

## 3.7 Safe Defaults

SafeBank should default to:

- exact token approval;
- supported network validation;
- explicit confirmations;
- no transaction when configuration is incomplete;
- no AI dependency for core financial flows;
- no unlimited token allowance;
- no destructive one-click admin actions.

## 3.8 Honest Status

The UI must clearly distinguish:

- planned;
- unavailable;
- disabled;
- loading;
- submitted;
- confirming;
- successful;
- rejected;
- reverted;
- replaced;
- paused;
- underfunded.

---

## 4. Scope Classification

## 4.1 Mandatory Frontend Scope

The capstone requires a React-based demonstration frontend that supports the mandatory deposit flows.

The minimum functional scope must ultimately include:

- wallet connection;
- plan viewing;
- deposit opening;
- NFT certificate viewing;
- maturity withdrawal;
- early withdrawal;
- manual renewal;
- auto-renew interaction;
- core administrator actions;
- transaction feedback.

## 4.2 SafeBank Product Decisions

SafeBank additionally plans:

- separate User Banking App and Admin Portal experiences;
- detailed transaction lifecycle UX;
- deposit progress and maturity visualization;
- NFT-transfer warning;
- explicit test-token labeling;
- network and contract validation;
- audit-event views;
- solvency visualization;
- responsive behavior;
- accessibility requirements.

## 4.3 Bonus UI Scope

For implemented Bonus C1, the future interface must expose:

- principal-first settlement outcomes;
- pending-interest amount and fixed claimant;
- full-value claims and claim status;
- warning that historical NFT transfer does not transfer an existing claim.

For implemented Bonus C2, the future interface must expose:

- total reserved interest;
- available liquidity;
- funding shortfall;
- solvency ratio derived from verified values;
- undercollateralization warnings;
- owner-withdrawal maximum;
- explanations for withdrawal rejection above available liquidity;
- reserve lifecycle history from C2 events.

## 4.4 AI Extension Scope

After the deterministic product is complete, the UI may include:

- AI Banking Assistant;
- AI Risk Assistant;
- plain-language transaction error explanation;
- plan comparisons;
- vault-risk summaries.

AI must never be required for normal transactions.

---

## 5. Branding Constraints

SafeBank must use an original product identity.

The UI must not copy:

- a real bank's logo;
- a real bank's name;
- an exact banking color palette;
- a recognizable banking landing-page layout;
- proprietary icons or illustrations;
- brand slogans from existing financial institutions.

The product may use general principles associated with trusted financial software:

- generous spacing;
- clear hierarchy;
- restrained color use;
- readable numbers;
- visible confirmation;
- professional typography;
- consistent status indicators.

---

## 6. Proposed Brand Direction

The final visual identity will be selected during frontend implementation.

The current planning direction is:

- product name: SafeBank;
- tone: calm, transparent, modern;
- visual character: structured cards, clear financial summaries, subtle blockchain references;
- primary emphasis: trust and control;
- secondary emphasis: maturity progress and solvency visibility.

The design should avoid appearing like:

- a speculative trading platform;
- a casino;
- a meme-token dashboard;
- a clone of an existing bank;
- a generic unstyled Hardhat demo.

---

## 7. Design Tokens at Planning Level

No frontend design tokens have been implemented yet.

The following categories must later be defined centrally.

## 7.1 Color Roles

Planned semantic roles:

- primary action;
- secondary action;
- neutral surface;
- elevated surface;
- page background;
- border;
- standard text;
- secondary text;
- positive status;
- warning status;
- dangerous action;
- informational status;
- disabled state;
- focus ring.

Colors must be selected for contrast, not only appearance.

## 7.2 Typography Roles

Planned roles:

- display heading;
- page title;
- section title;
- card title;
- body text;
- small supporting text;
- financial value;
- mono-style contract data;
- button label;
- form label.

Financial values should use stable number alignment where practical.

## 7.3 Spacing Roles

A consistent spacing system should cover:

- inline spacing;
- component padding;
- card padding;
- section spacing;
- page margins;
- mobile gutters;
- desktop content width.

## 7.4 Radius and Elevation

Use a restrained set of:

- border radii;
- shadow levels;
- modal elevation;
- dropdown elevation;
- sticky navigation elevation.

## 7.5 Motion

Motion should be limited to:

- progress transitions;
- loading indicators;
- confirmation transitions;
- expandable details;
- non-distracting page transitions.

The interface must respect reduced-motion preferences.

---

## 8. Primary Personas

## 8.1 Depositor Persona

The depositor wants to:

- understand available plans;
- estimate return;
- deposit MockUSDC;
- monitor maturity;
- withdraw or renew;
- avoid signing the wrong transaction;
- understand the NFT certificate.

Possible concerns:

- unfamiliarity with basis points;
- confusion about six token decimals;
- fear of losing principal;
- confusion between approve and deposit;
- confusion about NFT transfer;
- uncertainty about transaction status;
- uncertainty about vault funding.

## 8.2 Current NFT Owner Persona

This persona may not be the original depositor.

The UI must focus on current rights rather than original ownership.

The current NFT owner needs to know:

- it owns the certificate;
- it now controls the deposit;
- the original depositor no longer controls settlement;
- certificate transfer transfers the economic rights;
- historical certificates may remain visible after completion.

## 8.3 Bank Administrator Persona

The administrator wants to:

- create and manage plans;
- fund interest liquidity;
- understand liabilities;
- withdraw only allowable liquidity;
- change fee receiver safely;
- pause and unpause;
- inspect events;
- understand risk before taking action.

Administrator actions require stronger confirmations because they affect multiple users.

## 8.4 Demonstration Viewer Persona

The evaluator or instructor wants to:

- understand the architecture quickly;
- see the personal variant;
- observe correct financial calculations;
- verify NFT ownership behavior;
- observe maturity and grace boundaries;
- see bonus features;
- inspect transaction links and events;
- understand security decisions.

---

## 9. Information Architecture

SafeBank is planned as two clearly separated product areas.

### User Banking App

- public landing page;
- user dashboard;
- saving plans;
- deposit-opening wizard;
- deposit portfolio;
- deposit details;
- pending interest;
- wallet and transaction activity.

### Admin Portal

- admin dashboard;
- plan management;
- vault management;
- system controls;
- audit history;
- risk monitoring.

The separation may use route groups in one frontend project or two frontend shells.

The final framework decision remains open.

---

## 10. Planned User Routes

| Route | Purpose |
|---|---|
| `/` | Public product introduction and entry point |
| `/app` | User dashboard |
| `/app/plans` | Browse and compare saving plans |
| `/app/deposits` | View owned and historical deposit certificates |
| `/app/deposits/:id` | View one deposit and available actions |
| `/app/pending-interest` | View and claim deferred interest |
| `/app/activity` | Optional user transaction and event history |
| `/app/settings` | Optional network, display, and wallet preferences |

Exact routes may change during implementation.

No route exists at the time this document is written.

---

## 11. Planned Admin Routes

| Route | Purpose |
|---|---|
| `/admin` | Admin overview |
| `/admin/plans` | Create and manage saving plans |
| `/admin/vault` | Fund and manage interest liquidity |
| `/admin/system` | Pause, unpause, and system configuration |
| `/admin/audit` | Inspect contract events |
| `/admin/risk` | Review solvency and liability metrics |

Access to these pages is a frontend UX decision.

Actual authorization must remain in Solidity.

---

## 12. Public Landing Page

The landing page should explain SafeBank without implying real banking services.

Recommended sections:

1. product headline;
2. educational-project notice;
3. explanation of fixed-term blockchain savings;
4. principal and interest separation;
5. how NFT certificates work;
6. main user flow;
7. personal-variant values;
8. supported network;
9. test-token notice;
10. security and risk summary;
11. call to connect wallet or enter app.

The page must prominently state:

- SafeBank is an educational capstone;
- MockUSDC is a test token;
- assets have no real monetary value;
- returns are based on contract rules, not a legal guarantee.

---

## 13. User Navigation

The planned desktop navigation may include:

- Overview;
- Plans;
- My Deposits;
- Pending Interest;
- Activity.

Wallet and network status should remain visible.

The mobile layout may use:

- a compact top bar;
- a bottom navigation bar;
- a drawer for secondary options.

The navigation must show which area the user is currently viewing.

---

## 14. User Dashboard

The dashboard should answer:

- Which wallet is connected?
- Which network is active?
- How much MockUSDC does the wallet hold?
- How much active principal does the user control?
- How much estimated interest is associated with active deposits?
- Which deposits mature soon?
- Is any interest pending?
- What action should the user take next?

## 14.1 Planned Summary Cards

Possible cards:

- wallet MockUSDC balance;
- total active principal;
- estimated active-term interest;
- active deposit count;
- deposits maturing soon;
- pending interest;
- system status.

## 14.2 Deposit Preview List

Each deposit preview should show:

- deposit ID;
- NFT ID;
- principal;
- APR snapshot;
- maturity date;
- status;
- progress;
- next valid action.

## 14.3 Dashboard Actions

Primary actions:

- view plans;
- open deposit;
- inspect maturing deposit;
- claim pending interest when available.

## 14.4 Empty Dashboard

When no wallet is connected:

- explain wallet connection;
- show supported network;
- avoid displaying fake balances.

When the wallet owns no deposits:

- explain how deposits work;
- provide a link to plans;
- distinguish empty data from loading failure.

---

## 15. Plans Page

The plans page presents only plans read from the contract.

## 15.1 Plan Card Fields

Each plan card should show:

- plan ID;
- tenor in days and approximate months;
- APR percentage;
- APR in basis points in advanced details;
- minimum deposit;
- maximum deposit;
- early-withdrawal penalty;
- enabled status;
- estimated maturity date after amount entry;
- expected interest after amount entry.

## 15.2 Plan Status

Enabled plans may present an Open Deposit action.

Disabled plans should:

- remain visible when useful for transparency;
- show a Disabled badge;
- explain that no new deposits can use them;
- not present an active deposit button.

## 15.3 Plan Comparison

The comparison tool may show:

- tenor;
- APR;
- penalty;
- min;
- max;
- expected interest;
- expected maturity payout.

Comparison values must be deterministic.

## 15.4 Financial Explanation

The page should explain:

- one basis point equals 0.01%;
- 200 bps equals 2.00%;
- interest is simple within one term;
- compounding happens only after successful renewal;
- displayed values are estimates until confirmed on-chain.

---

## 16. Open Deposit Wizard

Opening a deposit should be a guided multi-step flow.

## 16.1 Step 1 — Select Plan

Display:

- enabled plans;
- tenor;
- APR;
- penalty;
- min and max;
- plan ID.

Validation:

- plan exists;
- plan is enabled;
- plan data loaded from the expected contract.

## 16.2 Step 2 — Enter Amount

Display:

- wallet balance;
- amount field;
- MockUSDC symbol;
- six-decimal behavior;
- min and max;
- available balance.

Client-side validation may assist the user but must not replace contract validation.

## 16.3 Step 3 — Review Estimate

Show:

- principal;
- APR snapshot that will be requested;
- penalty snapshot that will be requested;
- tenor;
- estimated interest;
- estimated maturity payout;
- estimated maturity date;
- early-withdrawal penalty;
- contract address;
- network;
- test-token warning.

## 16.4 Step 4 — Token Approval

Clearly explain:

- approval does not open the deposit;
- approval permits SavingCore to transfer the specified amount;
- the spender is SavingCore;
- the approval amount is exact;
- another wallet confirmation follows for deposit opening.

Possible states:

- approval not required because allowance is sufficient;
- waiting for wallet;
- submitted;
- confirming;
- successful;
- rejected;
- failed;
- replaced.

## 16.5 Step 5 — Open Deposit

Before wallet confirmation, show:

- selected plan;
- principal;
- expected snapshot values;
- network;
- SavingCore address;
- approved amount.

After success, show:

- deposit ID;
- NFT ID;
- principal;
- maturity;
- transaction hash;
- Etherscan link;
- link to deposit details.

## 16.6 Wizard Recovery

If the user leaves after approval but before opening:

- the app should recognize the current allowance;
- it should allow continuation;
- it should not claim that a deposit exists.

---

## 17. Interest Estimation

The frontend estimator must mirror the contract formula:

`interest = principal × aprBps × tenorSeconds ÷ (365 days × 10,000)`

The UI must:

- use token units consistently;
- apply integer floor rounding when presenting contract-equivalent values;
- label approximate human-readable values;
- avoid floating-point errors for authoritative calculations;
- use big-integer-compatible logic.

The frontend must not rely on JavaScript floating-point arithmetic for exact token accounting.

---

## 18. Early Withdrawal Estimation

The estimator must mirror the implemented early-withdrawal formulas:

`penalty = floor(principal × penaltyBpsAtOpen ÷ 10,000)`

`userReceive = principal - penalty`

Authoritative inputs must come from the deposit snapshot:

- `principal`;
- `penaltyBpsAtOpen`;
- `maturityAt`;
- current deposit status.

The fee receiver is not snapshotted in the deposit.

The interface must refresh `VaultManager.feeReceiver()` immediately before preparing the transaction because the current configured receiver receives the penalty.

The confirmation must show:

- original principal;
- snapshotted penalty percentage;
- exact floor-rounded penalty amount;
- exact amount returned to the current NFT owner;
- current fee receiver in advanced details;
- zero interest paid;
- current owner address;
- current timestamp and maturity timestamp;
- irreversible terminal result;
- statement that the NFT remains as a historical certificate.

The interface must preserve the exact identity:

`userReceive + penalty = principal`

The UI must handle these valid boundaries:

- `0 bps`: user receives the full principal and no fee transfer is required;
- `10,000 bps`: fee receiver receives the full principal and no user transfer is required;
- a positive fractional penalty may round down to zero;
- all arithmetic must use integer-safe six-decimal token units.

The primary button should use clear wording such as:

- Review Early Withdrawal;
- Confirm Early Withdrawal.

It should not use vague wording such as:

- Continue;
- Proceed.

---
## 19. Deposit Portfolio Page

The deposit portfolio should separate deposits by state.

Possible tabs or filters:

- Active;
- Matured;
- Renewable;
- Completed;
- Pending Interest;
- All.

Each deposit card should show:

- certificate NFT ID;
- deposit ID;
- principal;
- current owner;
- maturity;
- status;
- plan;
- APR snapshot;
- next valid action.

Historical deposits should remain visible because NFTs are not burned.

---

## 20. Deposit Detail Page

The deposit detail page is the primary explanation and action screen.

## 20.1 Header

Display:

- deposit ID;
- NFT certificate ID;
- status;
- current owner;
- network;
- contract address.

## 20.2 Financial Summary

Display:

- principal;
- APR snapshot;
- penalty snapshot;
- tenor;
- expected term interest;
- expected maturity payout;
- pending interest where applicable.

## 20.3 Time Summary

Display:

- start date;
- maturity date;
- grace-period end;
- current time basis;
- progress bar;
- current lifecycle window.

Time should be displayed consistently.

The UI should identify the timezone used for human-readable dates.

Exact blockchain timestamps should be available in advanced details.

## 20.4 Ownership Summary

Display:

- current NFT owner;
- connected wallet;
- whether the connected wallet is authorized;
- original depositor only if intentionally stored and relevant;
- economic-rights warning.

## 20.5 Plan Snapshot

Display the deposit's stored values, not only the current plan values.

The page may separately display:

- snapshot APR;
- current plan APR;
- explanation when they differ.

## 20.6 Available Actions

The action area depends on:

- deposit existence;
- `Active` or terminal status;
- direct current NFT ownership;
- current block timestamp;
- SavingCore pause state;
- VaultManager pause state;
- selected renewal-plan validity;
- implemented C1 pending-interest and claimant state;
- implemented contract capability.

Phase 11 action rules:

- offer early withdrawal only when the deposit is `Active`;
- offer early withdrawal only when the connected wallet is the direct
  current NFT owner;
- an ERC721-approved operator must not be shown as authorized;
- offer early withdrawal only while `block.timestamp < maturityAt`;
- stop offering early withdrawal at exactly `maturityAt`;
- offer maturity withdrawal when `block.timestamp >= maturityAt`;
- explain before maturity settlement that principal and interest have separate
  custody sources;
- after a fully funded maturity settlement, show principal and interest as
  paid immediately;
- after a deferred maturity settlement, show principal as paid and the full
  calculated interest as pending;
- show `Withdrawn.interest` as interest paid immediately, not as the total
  interest obligation;
- show the direct current NFT owner at settlement as the snapshotted claimant;
- do not change the displayed claimant merely because the historical NFT is
  transferred after settlement;
- offer `claimPendingInterest(depositId)` only when
  `pendingInterest(depositId) > 0`;
- offer the claim only to `interestClaimant(depositId)`;
- do not treat ERC721 approval as pending-interest claim authorization;
- do not allow the claimant to select another payout recipient or partial
  claim amount;
- after a successful claim, show pending interest as zero while retaining the
  historical claimant;
- offer manual renewal only while the old deposit remains `Active`;
- offer manual renewal only to the direct current certificate owner;
- offer manual renewal only during
  `maturityAt <= block.timestamp < maturityAt + GRACE_PERIOD`;
- do not offer manual renewal before maturity;
- stop offering manual renewal at the exact grace-period end;
- offer permissionless auto-renew only while the old deposit remains
  `Active`;
- offer auto-renew when
  `block.timestamp >= maturityAt + GRACE_PERIOD`;
- allow the connected wallet to trigger auto-renew even when it is not the
  current certificate owner;
- display the current old-certificate owner as the new NFT recipient;
- do not allow the caller to edit the recipient;
- preserve the old plan ID, tenor, APR, and penalty snapshots in the
  review;
- do not require the original plan to remain enabled;
- do not reapply the original plan minimum or maximum;
- explain that one delayed transaction creates exactly one new term;
- explain that the new term begins at the confirmed transaction timestamp;
- include only enabled plans in the manual-renewal plan selector;
- allow the same plan when it remains enabled;
- validate compounded principal against the selected plan limits;
- disable early withdrawal, maturity withdrawal, manual renewal, and
  auto-renew while SavingCore is paused;
- do not disable early withdrawal solely because VaultManager is paused;
- explain that VaultManager pause blocks positive-interest maturity
  withdrawal, positive-interest manual renewal, and positive-interest
  auto-renew;
- explain that zero-interest manual renewal or auto-renew may not require a
  vault payout;
- keep historical certificate viewing available after settlement or
  renewal;
- refresh old deposit, new deposit, NFT ownership, balances, and events
  after every confirmed renewal;
- never infer a terminal state from local UI state before receipt and
  contract refresh.

Possible actions:

- early withdraw;
- withdraw at maturity;
- manually renew during the grace period;
- trigger permissionless auto-renew after the grace period;
- claim pending interest when the connected wallet is the snapshotted claimant;
- view historical certificates.

Unavailable future actions must be labeled unavailable rather than silently
displayed as working controls.

## 20.7 Transaction History

The page may display events associated with the deposit:

- opened;
- transferred;
- withdrawn;
- renewed;
- interest deferred;
- pending interest claimed.

Event data must be labeled as indexed blockchain history.

---

## 21. NFT Transfer Warning

SafeBank must prominently communicate:

> Transferring the NFT transfers the right to receive the deposit principal and interest.

The warning should appear:

- on deposit details;
- near certificate ownership information;
- before linking users to an NFT transfer action;
- in help content;
- in AI explanations involving certificates.

The UI should explain:

- the NFT is not only a collectible;
- the current owner controls economic actions;
- the original depositor loses those rights after transfer;
- historical certificates remain visible after completion;
- transferring the historical NFT after deferred maturity settlement does not transfer the already snapshotted pending-interest claim.

---

## 22. Maturity Withdrawal UX

The maturity-withdrawal action is available when:

`block.timestamp >= maturityAt`

The confirmation must show:

- principal to be returned;
- calculated interest;
- total expected payout;
- current owner;
- source of principal;
- source of interest;
- vault funding state;
- transaction contract;
- network.

For an underfunded Phase 11 maturity settlement, the interface must explain:

- principal can still be returned;
- the full calculated interest becomes pending when VaultManager cannot pay
  the complete amount;
- no partial interest payout is attempted;
- the direct current NFT owner is snapshotted as claimant;
- pending interest may be claimed later after VaultManager funding.

---

## 23. Early Withdrawal UX

The implemented contract action is available only when:

`deposit.status == Active`

`connectedWallet == ownerOf(depositId)`

`block.timestamp < maturityAt`

`SavingCore.paused() == false`

The UI must not treat ERC721 approval as withdrawal authorization.

The interface must display a high-risk warning before wallet submission.

The warning must include:

- no interest will be paid;
- snapshotted penalty percentage;
- exact floor-rounded penalty amount;
- exact amount returned;
- current fee receiver in advanced details;
- current NFT owner;
- action is irreversible;
- deposit status becomes `Withdrawn`;
- certificate remains as historical evidence;
- no second withdrawal or renewal is possible after settlement.

At exactly `maturityAt`, the early-withdrawal action must disappear or become disabled and the maturity-withdrawal action may become available.

If a prepared transaction reaches the contract after maturity, map `DepositAlreadyMatured` to a clear message such as:

> “This deposit has reached maturity. Use maturity withdrawal instead.”

SavingCore pause blocks the action.

VaultManager pause alone does not block early withdrawal because the contract does not request interest from the vault.

After confirmation, the UI must verify:

- transaction receipt success;
- terminal deposit status;
- current NFT owner;
- user token balance;
- fee-receiver token balance where displayed;
- retained NFT certificate.

---
## 24. Manual Renewal UX

The contract permits manual renewal only during:

`maturityAt <= block.timestamp < maturityAt + GRACE_PERIOD`

The UI must derive availability from current on-chain state rather than only
from a local countdown.

### 24.1 Eligibility

Show the manual-renew action only when:

- the old deposit exists;
- the old deposit status is `Active`;
- the connected wallet is the direct current NFT owner;
- the current block timestamp is at or after maturity;
- the current block timestamp is before the grace-period end;
- SavingCore is not paused.

An ERC721-approved operator must not be shown as authorized.

### 24.2 Plan Selection

The renewal-plan selector must:

- include only existing enabled plans;
- exclude disabled plans;
- allow the same plan when it remains enabled;
- show current APR, tenor, penalty, minimum, and maximum;
- explain that these values become the new deposit snapshots;
- validate the compounded principal against selected-plan limits.

Disabling the old plan does not remove the holder's existing renewal right.
The old plan does not need to remain enabled unless it is selected again.

### 24.3 Renewal Estimate

The review screen should show:

- old deposit ID;
- old certificate owner;
- old principal;
- old APR snapshot;
- old tenor snapshot;
- calculated old-term interest;
- selected new plan;
- compounded new principal;
- new APR snapshot;
- new penalty snapshot;
- new tenor;
- estimated new maturity;
- old certificate outcome;
- new NFT recipient.

The old-term interest estimate must use old immutable snapshots.

The new term estimate must use the selected plan's current values.

### 24.4 Token Movement Explanation

The confirmation must explain that:

- the user does not receive interest into the wallet;
- positive interest moves from VaultManager into SavingCore;
- the funded interest becomes part of the new deposit principal;
- the user's MockUSDC wallet balance remains unchanged;
- total MockUSDC supply remains unchanged;
- the old NFT remains as historical evidence;
- a new NFT represents the renewed active deposit.

For zero-rounded interest, explain that:

- no interest payout is requested;
- new principal equals old principal;
- VaultManager balance does not change.

### 24.5 Pause and Funding States

When VaultManager is paused:

- positive-interest renewal should be shown as blocked or expected to
  revert;
- zero-interest renewal may still be contract-valid;
- the UI must not claim that every renewal is always blocked.

When VaultManager is underfunded or SavingCore is unauthorized:

- explain that compounding cannot complete;
- do not imply that unpaid interest was added;
- do not create optimistic local renewal state;
- allow the user to return to maturity withdrawal while the old deposit
  remains active.

When SavingCore is paused, manual renewal is blocked regardless of interest.

### 24.6 Confirmation

Before submitting, show:

- irreversible old-deposit transition to `ManualRenewed`;
- creation of a new active deposit;
- new deposit and NFT identifiers are assigned on-chain;
- old NFT remains;
- new NFT is minted to the current old-certificate owner;
- the old deposit cannot later be withdrawn or renewed again;
- required VaultManager funding for positive interest;
- transaction and gas confirmation.

### 24.7 Success State

After confirmation, refresh and display:

- transaction hash;
- `Renewed` event;
- old deposit status `ManualRenewed`;
- new active deposit;
- new principal;
- selected plan snapshots;
- new maturity;
- old NFT ownership;
- new NFT ownership;
- `InterestPaid` when interest was positive;
- ERC721 mint `Transfer`;
- unchanged user MockUSDC balance;
- unchanged total token supply.

Do not expect a manual-renewal `DepositOpened` or `Withdrawn` event.

### 24.8 Error Mapping

Map contract failures to clear messages:

- `DepositNotMatured`:
  “This deposit has not reached maturity yet.”
- `ManualRenewalWindowClosed`:
  “The manual-renewal window has ended.”
- inactive old deposit:
  “This deposit has already completed another lifecycle action.”
- caller is not direct owner:
  “Only the current certificate owner can renew this deposit.”
- selected plan does not exist:
  “The selected renewal plan is unavailable.”
- selected plan is disabled:
  “Choose an enabled renewal plan.”
- compounded principal below or above plan limits:
  “The renewed principal does not meet this plan’s deposit limits.”
- VaultManager paused:
  “The interest vault is paused, so positive-interest renewal cannot
  complete.”
- underfunded VaultManager:
  “The interest vault cannot fully fund this renewal.”
- unsafe contract-wallet receiver:
  “The current owner contract cannot receive the renewed NFT.”
- reentrancy or unexpected callback failure:
  show a generic safe transaction failure without presenting partial
  success.

The UI must refresh authoritative contract state after every revert.

## 25. Auto-Renew UX

The implemented contract action is:

`autoRenew(depositId)`

It becomes available when:

`block.timestamp >= maturityAt + GRACE_PERIOD`

The UI must derive eligibility from current contract state and a recent block
timestamp.

### 25.1 Eligibility

Show Trigger Auto-Renew only when:

- the old deposit exists;
- the old deposit status is `Active`;
- the current timestamp is at or after the grace-period end;
- SavingCore is not paused.

The connected wallet does not need to own the old certificate.

At one second before the grace-period end, the contract reverts with
`AutoRenewalTooEarly`.

At the exact grace-period end, the action becomes valid.

### 25.2 Permissionless Caller and Recipient

The review must distinguish:

- transaction caller;
- current owner of the old certificate;
- recipient of the new certificate.

The caller may be any wallet.

The new NFT recipient must always be the current old-certificate owner.

The UI must not:

- default the recipient to the caller;
- allow the caller to edit the recipient;
- imply that triggering creates ownership rights;
- require ERC721 approval for permissionless triggering.

Refresh `ownerOf(depositId)` immediately before preparing the transaction.

### 25.3 Preserved Terms

The review must display that the new deposit preserves the old deposit's:

- plan ID;
- tenor snapshot;
- APR snapshot;
- early-withdrawal penalty snapshot.

The UI must not substitute the current plan APR or current enabled state.

The original plan may be disabled and auto-renew may still remain valid.

The original plan minimum and maximum are not reapplied to compounded
principal.

### 25.4 Delayed Execution

The confirmation must explain:

- time passing alone does not renew the deposit;
- a real transaction is required;
- one transaction creates exactly one new term;
- only one old term of interest is calculated;
- no retroactive multi-term catch-up occurs;
- the new term starts at the successful transaction timestamp.

The UI must not display hypothetical accumulated renewal terms.

### 25.5 Interest and Token Movement

For positive interest, explain that:

- interest moves from VaultManager into SavingCore;
- the user wallet does not receive the interest directly;
- the funded interest becomes part of the new principal;
- VaultManager balance decreases;
- SavingCore balance increases;
- user wallet balance remains unchanged;
- total MockUSDC supply remains unchanged.

For zero-rounded interest, explain that:

- no VaultManager payout is requested;
- no `InterestPaid` event is expected;
- new principal equals old principal;
- VaultManager pause alone may not block the action.

### 25.6 Pause and Funding States

When SavingCore is paused:

- auto-renew is blocked.

When VaultManager is paused:

- positive-interest auto-renew is blocked;
- zero-interest auto-renew may remain valid.

When VaultManager is underfunded or SavingCore is unauthorized:

- no renewed principal is created;
- no new deposit remains;
- no new NFT remains;
- the old deposit remains `Active`;
- maturity withdrawal may remain available to the owner.

The UI must not present partial success after a revert.

### 25.7 Confirmation

Before wallet submission, show:

- old deposit ID;
- current old-certificate owner;
- transaction caller;
- grace-period end;
- old principal;
- old plan ID;
- old tenor snapshot;
- old APR snapshot;
- old penalty snapshot;
- calculated old-term interest;
- new principal;
- expected new term start;
- expected new maturity;
- new NFT recipient;
- old NFT retention;
- irreversible old status transition to `AutoRenewed`;
- statement that one new active deposit will be created.

### 25.8 Success State

After confirmation, refresh and display:

- transaction hash;
- `Renewed` event;
- old status `AutoRenewed`;
- new active deposit ID;
- new principal;
- preserved snapshots;
- confirmed `startedAt`;
- confirmed `maturityAt`;
- old NFT ownership;
- new NFT ownership;
- `InterestPaid` only when interest is positive;
- ERC721 mint `Transfer`;
- unchanged caller and owner wallet balances where relevant;
- unchanged total token supply.

Do not expect auto-renew to emit:

- `DepositOpened`;
- `Withdrawn`.

### 25.9 Competing Maturity Withdrawal

After grace, the current owner may still submit maturity withdrawal while the
old deposit remains `Active`.

A permissionless auto-renew transaction may compete with it.

The first successfully mined transaction determines the terminal state.

After either transaction confirms, refresh the deposit before offering another
action.

### 25.10 Error Mapping

Map failures to clear messages:

- `AutoRenewalTooEarly`:
  “Auto-renew becomes available after the two-day grace period.”
- inactive deposit:
  “This deposit has already completed another lifecycle action.”
- SavingCore paused:
  “SafeBank deposit operations are temporarily paused.”
- VaultManager paused with positive interest:
  “The interest vault is paused, so this positive-interest renewal cannot
  complete.”
- underfunded VaultManager:
  “The interest vault cannot fully fund this renewal.”
- unauthorized SavingCore:
  “The interest vault is not configured for this SavingCore contract.”
- unsafe current-owner contract:
  “The current owner contract cannot receive the renewed NFT.”
- reentrancy or callback failure:
  show a generic safe transaction failure and refresh authoritative state.

The UI must never infer renewal solely because the grace period has passed.
---

## 26. Withdraw After Grace Period

If the deposit remains active after the grace period:

- maturity withdrawal remains available to the owner;
- auto-renew remains available permissionlessly;
- both actions may compete;
- the first successfully mined transaction determines the state.

The UI should not claim that the deposit has already auto-renewed solely because the grace period ended.

The status must be read from the contract.

---

## 27. Pending Interest Page

The Phase 11 contract capabilities required by this page are implemented, but the page itself remains planned and has not been built.

## 27.1 Summary

Display:

- total pending interest controlled by the connected wallet;
- number of pending claims;
- vault availability;
- system pause status.

## 27.2 Claim Item

Each item should show:

- deposit ID;
- claimant;
- pending amount;
- settlement transaction;
- claim status;
- whether vault liquidity is sufficient;
- claim action.

## 27.3 Claim Confirmation

Show:

- claimant;
- pending amount;
- vault contract;
- network;
- expected transfer;
- test-token warning.

## 27.4 Claimed State

After successful claim:

- mark the item claimed;
- show the transaction link;
- retain historical information;
- do not offer the claim action again.

---

## 28. User Activity Page

An optional activity page may aggregate:

- approvals;
- deposits opened;
- NFT transfers;
- withdrawals;
- renewals;
- pending-interest settlements;
- claims.

Each item should show:

- action type;
- status;
- timestamp;
- amount;
- transaction hash;
- explorer link.

The activity page must not infer success only from local UI state.

It should reconcile with transaction receipts and contract state.

---

## 29. Admin Portal Principles

Admin actions may affect all depositors.

Therefore, the Admin Portal should prioritize:

- explicit scope;
- clear consequences;
- data visibility before action;
- stronger confirmations;
- transaction auditability;
- prevention of accidental clicks;
- on-chain authorization awareness.

The Admin Portal must not present frontend access as proof of authorization.

---

## 30. Admin Dashboard

The admin dashboard should answer:

- Is the system paused?
- How much interest liquidity exists?
- How much interest is reserved?
- How much liquidity is available?
- Is the vault underfunded?
- How much active principal exists?
- How many active deposits exist?
- Which deposits mature soon?
- Which plans create the most liabilities?
- Are there pending-interest debts?

## 30.1 Planned Metrics

Possible metrics:

- vault balance;
- total reserved interest;
- available liquidity;
- solvency ratio;
- funding shortfall;
- total active principal;
- active deposit count;
- pending-interest total;
- deposits maturing within a selected period;
- system pause status.

## 30.2 Metric Definitions

The interface must explain each metric.

Example:

- Vault balance: token balance held by VaultManager.
- Reserved interest: aggregate expected active-deposit interest plus unpaid pending-interest liabilities.
- Available liquidity: maximum amount the administrator may currently withdraw.
- Funding shortfall: reserved liabilities exceeding vault balance.
- Solvency ratio: vault balance divided by reserved interest, subject to defined zero-liability behavior.

---

## 31. Plan Management

## 31.1 Plan List

Display:

- plan ID;
- tenor;
- APR;
- min;
- max;
- penalty;
- enabled state;
- active-deposit count if available;
- related reserved liability if available.

## 31.2 Create Plan

The form should include:

- tenor days;
- APR bps;
- min deposit;
- max deposit;
- penalty bps;
- initial enabled state if supported.

The UI should provide human-readable conversions:

- basis points to percentage;
- token smallest units to MockUSDC;
- days to approximate months.

## 31.3 Update APR

Before submission, show:

- plan ID;
- old APR;
- new APR;
- percentage conversion;
- statement that existing deposits retain old snapshots;
- statement that only future deposits use the new APR.

## 31.4 Enable Plan

Show:

- plan details;
- consequence for new deposits;
- no retroactive change to active deposits.

## 31.5 Disable Plan

Show:

- plan details;
- no new deposit may use it;
- existing deposits remain valid;
- existing owners may still withdraw;
- manual renewal cannot target it;
- auto-renew may still use old snapshots.

## 31.6 Validation

The form should prevent obvious mistakes but must rely on contract validation for final enforcement.

---

## 32. Vault Management

## 32.1 Vault Overview

Display:

- VaultManager address;
- MockUSDC balance;
- total reserved interest;
- available liquidity;
- funding shortfall;
- fee receiver;
- authorized SavingCore;
- pause state.

## 32.2 Fund Vault

The funding flow should show:

- source wallet;
- amount;
- token;
- vault recipient;
- network;
- whether approval is required;
- new estimated vault balance.

Funding is a token transfer and may require approval depending on final implementation.

## 32.3 Withdraw Vault Liquidity

Before submission, show:

- requested amount;
- current vault balance;
- reserved interest;
- available liquidity;
- destination;
- expected remaining liquidity;
- warning when close to the maximum.

The input must not present amounts above available liquidity as valid.

The contract remains the final enforcement layer.

## 32.4 Blocked Withdrawal Explanation

When withdrawal is unavailable, explain the reason:

- not administrator;
- system configuration unavailable;
- amount exceeds available liquidity;
- vault balance insufficient;
- wrong network;
- contract paused if applicable;
- missing deployment configuration.

## 32.5 Fee Receiver Update

The confirmation must show:

- current receiver;
- new receiver;
- address validation;
- administrator wallet;
- VaultManager contract address;
- network;
- effect on future unsettled early-withdrawal penalties;
- no change to deposit penalty-rate snapshots;
- no retroactive change to completed withdrawals.

After a successful update:

- refresh `VaultManager.feeReceiver()`;
- invalidate any stale early-withdrawal confirmation prepared with the old receiver;
- require the user to review the early-withdrawal summary again;
- display the transaction hash and decoded `FeeReceiverUpdated` event.

The caller of `earlyWithdraw` cannot choose the penalty recipient.

---

## 33. Emergency System Controls

## 33.1 Pause Action

Pause must not be a one-click action.

The planned confirmation should require:

- impact summary;
- current system state;
- administrator wallet;
- network;
- contract;
- typed confirmation word such as `PAUSE`;
- wallet confirmation.

The impact summary should state that pause blocks:

- new deposits;
- withdrawals;
- renewals;
- pending-interest claims;
- interest payouts.

## 33.2 Unpause Action

Unpause should also require confirmation.

Show:

- current pause state;
- affected contract;
- network;
- statement that user operations will resume.

## 33.3 Pause Limitations

The UI should explain that pause does not:

- reverse prior transactions;
- restore stolen keys;
- fund the vault;
- correct a wrong deployment;
- guarantee recovery.

## 33.4 Multi-Contract State

SavingCore and VaultManager have separate pause states and the UI must display them separately.

It must not display a single healthy state when one contract remains paused.

Phase 11 operation-specific behavior:

- SavingCore paused: deposit opening, maturity withdrawal, early withdrawal,
  manual renewal, auto-renew, and pending-interest claims are blocked;
- VaultManager paused: positive-interest payout operations are blocked;
- a paused VaultManager does not activate C1 interest deferral because pause
  is not `InsufficientVaultBalance`;
- a pending-interest claim fails while VaultManager is paused and remains
  claimable after unpause;
- VaultManager paused by itself does not block early withdrawal;
- VaultManager paused by itself may not block zero-interest manual renewal
  or zero-interest auto-renew;
- positive-interest manual renewal and positive-interest auto-renew require
  an unpaused VaultManager;
- plan and deposit reads remain available while either contract is paused;
- certificate and ownership reads remain available;
- the interface must explain which contract is responsible for the blocked
  action.
---

## 34. Admin Audit Page

The audit page should organize events by category.

## 34.1 Plan Events

- PlanCreated;
- PlanUpdated;
- PlanEnabled;
- PlanDisabled.

## 34.2 Deposit Events

- DepositOpened;
- Withdrawn;
- Renewed.

## 34.3 Vault Events

- VaultFunded;
- VaultWithdrawn;
- InterestPaid;
- FeeReceiverUpdated;
- SavingCoreAuthorized.

## 34.4 System Events

- paused;
- unpaused;
- ownership transfer started;
- ownership accepted.

## 34.5 C1 and C2 Events

- InterestDeferred;
- PendingInterestClaimed;
- InterestReserved;
- ReservedInterestReleased.

## 34.6 Event Detail

Show:

- event name;
- block number;
- timestamp;
- transaction hash;
- caller where available;
- decoded parameters;
- explorer link.

Events support auditability but do not replace state reads.

---

## 35. Admin Risk Page

The risk page consumes the implemented C2 solvency reads.

## 35.1 Solvency Summary

Display:

- vault balance;
- reserved interest;
- available liquidity;
- funding shortfall;
- solvency ratio;
- risk classification.

## 35.2 Risk Classification

Possible deterministic labels:

- No liabilities;
- Fully funded;
- Adequately funded;
- Near shortfall;
- Undercollateralized;
- Data unavailable.

Thresholds must be documented before implementation.

AI must not invent the classification.

## 35.3 Maturity Exposure

Display upcoming interest obligations grouped by:

- next 24 hours;
- next 7 days;
- next 30 days;
- later.

This may require indexed events or aggregated reads depending on contract design.

## 35.4 Funding Recommendation

A deterministic baseline recommendation may be:

`recommended minimum funding = max(totalReservedInterest - vaultBalance, 0)`

AI may explain the result but must not change it.

## 35.5 Withdrawal Recommendation

A deterministic maximum is:

`availableLiquidity`

AI may explain why the amount is limited.

---

## 36. Wallet Connection Flow

## 36.1 Disconnected State

Display:

- Connect Wallet action;
- supported network;
- educational warning;
- no fabricated account data.

## 36.2 Connection Request

The app requests account access through the wallet provider.

Possible results:

- connected;
- user rejected;
- provider unavailable;
- unsupported wallet;
- no account.

## 36.3 Account Change

When the wallet account changes:

- refresh ownership;
- refresh balances;
- refresh permissions;
- close stale confirmations;
- do not retain previous-wallet financial data as current.

## 36.4 Disconnect

The application may clear its local session state.

It cannot forcibly disconnect the wallet extension in every provider.

## 36.5 Wallet Privacy

The UI should avoid unnecessary collection of wallet-linked personal information.

---

## 37. Network Validation

Before reads or writes, validate:

- chain ID;
- expected environment;
- contract-address mapping;
- provider connection.

## 37.1 Unsupported Network

Display:

- current network;
- expected network;
- Switch Network action;
- manual instructions if automatic switching fails.

## 37.2 Network Switch

The app may request a network switch.

It must handle:

- user rejection;
- missing network;
- provider error;
- account change;
- delayed update.

## 37.3 Mainnet Protection

Until explicitly supported, the app must not present mainnet as a valid demonstration network.

---

## 38. Contract Validation

The frontend must not blindly trust environment configuration.

Possible validation checks:

- address format;
- nonzero address;
- expected chain;
- bytecode exists;
- known contract interface calls succeed;
- token decimals equal 6;
- SavingCore and VaultManager dependencies match expected addresses where exposed.

If validation fails:

- disable state-changing actions;
- show a configuration error;
- avoid asking users to sign.

---

## 39. Test Token Warning

A persistent warning should state:

- MockUSDC is a test token;
- it is freely mintable for demonstration;
- it is not USDC;
- it has no real financial value;
- SafeBank is not a real banking service.

The warning should appear:

- on the landing page;
- near wallet balance;
- in deposit confirmation;
- in admin vault funding;
- in demo documentation.

---

## 40. Transaction Lifecycle Model

Every transaction action should use a consistent lifecycle.

## 40.1 Idle

No transaction has started.

## 40.2 Preparing

The app is:

- validating network;
- reading state;
- calculating values;
- preparing request data.

## 40.3 Waiting for Wallet

The wallet confirmation is open.

The UI should tell the user to review the wallet.

## 40.4 Rejected

The user rejected the request.

This is not necessarily an application error.

Provide a retry action without showing a false failure alarm.

## 40.5 Submitted

The wallet returned a transaction hash.

Display:

- hash;
- explorer link;
- submitted status.

Do not claim success yet.

## 40.6 Confirming

The transaction is waiting for confirmations.

Display:

- confirmation progress;
- latest known status;
- ability to copy the transaction hash.

## 40.7 Success

The receipt succeeded and state should be refreshed.

Display:

- result summary;
- transaction link;
- updated deposit or vault state.

## 40.8 Reverted

Display:

- decoded custom error if available;
- plain-language explanation;
- technical details in an expandable section;
- safe recovery action.

## 40.9 Replaced

A transaction may be replaced by:

- speed-up;
- cancellation;
- same-nonce transaction.

The UI should identify the replacement hash where supported.

## 40.10 RPC Failure

An RPC error does not always mean the transaction failed.

The UI should attempt to reconcile by transaction hash and state.

---

## 41. Error Message Principles

Error messages should answer:

1. What happened?
2. Why might it have happened?
3. Was any transaction submitted?
4. Did token state change?
5. What can the user safely do next?

Avoid raw-only messages such as:

- execution reverted;
- unknown error;
- call exception.

Where possible, map custom errors to clear text.

Technical details should remain available for debugging.

---

## 42. Planned Error Examples

### Invalid Plan

“This saving plan does not exist or is no longer available.”

### Disabled Plan

“This plan is disabled and cannot accept new deposits.”

### Below Minimum

“The entered amount is below this plan's minimum deposit.”

### Above Maximum

“The entered amount exceeds this plan's maximum deposit.”

### Insufficient Allowance

“SafeBank does not currently have permission to transfer the required MockUSDC amount.”

### Insufficient Balance

“Your wallet does not contain enough MockUSDC for this action.”

### Wrong Owner

“The connected wallet is not the current owner of this deposit certificate.”

### Too Early

“This deposit has not reached maturity.”

### Early Withdrawal No Longer Available

“This deposit has reached maturity. Use maturity withdrawal instead.”

### Manual Renewal Expired

“The manual-renewal window has ended.”

### Auto-Renew Too Early

“Auto-renew becomes available after the two-day grace period.”

### Already Processed

“This deposit has already been withdrawn or renewed.”

### Paused

“SafeBank financial operations are temporarily paused.”

### Vault Underfunded

“The vault cannot currently fund the required interest.”

### Unsupported Network

“Switch to the supported SafeBank demonstration network before continuing.”

---

## 43. Loading States

Loading must be represented at the correct scope.

## 43.1 Page Loading

Use a page skeleton for initial data.

## 43.2 Card Loading

Use individual skeletons when one metric is loading.

## 43.3 Button Loading

Disable duplicate submission while a request is preparing or awaiting wallet interaction.

## 43.4 Background Refresh

Show subtle refresh indicators without blocking the page.

## 43.5 Long Blockchain Confirmation

Do not use an indefinite spinner alone.

Show:

- current phase;
- transaction hash;
- explorer link;
- explanatory text.

---

## 44. Empty States

Empty states must distinguish valid emptiness from error.

Examples:

- no wallet connected;
- no active deposits;
- no matured deposits;
- no pending interest;
- no events found;
- no enabled plans;
- no vault liabilities;
- no upcoming maturities.

Each empty state should include:

- clear explanation;
- relevant next action;
- no fabricated example data in production mode.

---

## 45. Error States

Error states should exist for:

- provider unavailable;
- network unsupported;
- contract configuration missing;
- contract read failed;
- wallet rejected;
- transaction reverted;
- transaction replaced;
- event query failed;
- AI unavailable;
- stale data;
- partial dashboard failure.

A partial failure should not necessarily blank the entire page.

For example, AI failure must not hide contract balances.

---

## 46. Confirmation Patterns

Different actions require different confirmation strength.

## 46.1 Standard Confirmation

Suitable for:

- exact approval;
- deposit opening;
- maturity withdrawal;
- manual renewal;
- auto-renew trigger;
- pending-interest claim.

## 46.2 High-Risk Confirmation

Suitable for:

- early withdrawal;
- vault withdrawal;
- fee receiver change;
- pause;
- ownership transfer;
- SavingCore authorization change.

High-risk confirmation should include:

- consequence summary;
- critical values;
- typed confirmation where appropriate;
- final wallet review.

---

## 47. Responsive Design Rules

## 47.1 Mobile

Priorities:

- one-column layout;
- financial values remain readable;
- primary action stays reachable;
- tables convert to cards or horizontal scrolling;
- confirmations fit the viewport;
- wallet addresses remain copyable;
- no critical information hidden only on hover.

## 47.2 Tablet

Use:

- one or two columns depending on content;
- responsive navigation;
- compact metric grids;
- adaptive forms.

## 47.3 Desktop

Use:

- constrained content width;
- sidebar or top navigation;
- multi-column dashboards;
- persistent contextual summaries where helpful.

## 47.4 Small Screens

Buttons must not become too small.

Long contract addresses and hashes should:

- truncate visually;
- remain copyable;
- provide full value in a detail view.

---

## 48. Accessibility Requirements

The final UI should target practical WCAG-aligned behavior.

Requirements include:

- semantic HTML;
- keyboard navigation;
- visible focus states;
- sufficient color contrast;
- labels for every form field;
- accessible error messages;
- status announcements;
- no color-only meaning;
- reduced-motion support;
- logical heading structure;
- descriptive button text;
- accessible modal focus management;
- screen-reader-friendly financial summaries;
- touch targets of usable size.

Charts must include textual equivalents.

---

## 49. Number Formatting

SafeBank uses MockUSDC with six decimals.

The UI must:

- retain exact token-unit values internally;
- format human-readable values consistently;
- avoid unintended floating-point rounding;
- distinguish 1 token from 1 smallest unit;
- provide a predictable maximum display precision;
- allow full precision in advanced details.

Examples:

- `1,000.000000 mUSDC`;
- compact dashboard display may show `1,000 mUSDC`;
- transaction review should preserve meaningful precision.

APR display:

- `200 bps`;
- `2.00% APR`.

Penalty display:

- `750 bps`;
- `7.50%`.

---

## 50. Date and Time Formatting

The UI should display:

- human-readable local time;
- explicit timezone;
- exact timestamp in advanced details;
- relative time only as supplementary text.

Example:

- `Jan 15, 2027, 10:30 AM GMT+7`;
- `in 12 days`.

Blockchain state should be calculated from timestamps, not from displayed relative text.

---

## 51. Status Model

Possible deposit statuses:

- Active;
- Matured and Active;
- Manual Renewal Available;
- Auto-Renew Available;
- Withdrawn;
- Manual Renewed;
- Auto Renewed;
- Pending Interest;
- Pending Interest Claimed.

Some labels are UI-derived views.

The underlying contract status remains authoritative.

For example, “Matured and Active” may still correspond to contract status `Active`.

---

## 52. System Status Presentation

The interface should display system-wide states:

- Operational;
- Paused;
- Configuration Error;
- Unsupported Network;
- Vault Underfunded;
- Data Delayed.

Do not combine unrelated states into one misleading label.

Example:

A system may be operational but underfunded.

---

## 53. User Notification Strategy

Notifications may include:

- wallet connected;
- network changed;
- approval submitted;
- approval confirmed;
- deposit opened;
- withdrawal completed;
- renewal completed;
- pending interest created;
- claim completed;
- transaction rejected;
- transaction reverted.

Important results should remain visible on the page and not rely only on temporary toast messages.

---

## 54. Data Refresh Strategy

Refresh contract data after:

- wallet connection;
- account change;
- network change;
- transaction confirmation;
- NFT transfer detection;
- manual refresh;
- selected block interval if appropriate.

Avoid excessive RPC polling.

The final strategy depends on:

- chosen frontend framework;
- wallet library;
- RPC provider;
- event-indexing approach.

---

## 55. Event Indexing Strategy

Possible approaches:

- direct log queries;
- locally cached queries;
- third-party indexing;
- backend indexing service.

For the capstone, the simplest reliable solution should be selected.

The UI must distinguish:

- event history;
- current storage state.

Current state should not be reconstructed solely from incomplete event history when direct reads are available.

---

## 56. AI Banking Assistant Placement

The AI Banking Assistant may appear as:

- a contextual side panel;
- a help drawer;
- a chat page;
- inline explanation actions.

Recommended contexts:

- plans;
- deposit review;
- deposit detail;
- transaction errors;
- pending interest.

The assistant should receive structured verified values, not only free-form page text.

---

## 57. AI Banking Assistant Capabilities

It may explain:

- plan differences;
- estimated interest;
- early-withdrawal penalty;
- maturity;
- grace period;
- manual renewal;
- auto-renew;
- pending interest;
- NFT-transfer consequences;
- common transaction errors.

It must label estimates and assumptions.

---

## 58. AI Risk Assistant Placement

The AI Risk Assistant should remain in the Admin Portal.

Possible placements:

- risk-page summary panel;
- metric explanation drawer;
- funding recommendation section;
- maturity-exposure explanation.

It must not appear as an autonomous operator.

---

## 59. AI Risk Assistant Capabilities

It may explain:

- vault balance;
- reserved interest;
- available liquidity;
- solvency ratio;
- funding shortfall;
- upcoming maturities;
- plan liability concentration;
- why a vault withdrawal is blocked.

Recommendations must be grounded in deterministic values.

---

## 60. AI Restrictions

AI must not:

- hold keys;
- request seed phrases;
- sign;
- submit transactions;
- switch network;
- change plans;
- fund the vault;
- withdraw the vault;
- pause;
- unpause;
- choose a transaction amount without user review;
- fabricate values;
- claim guaranteed profit.

---

## 61. AI Fallback

When the AI provider is unavailable:

- plans remain visible;
- balances remain visible;
- calculators remain available;
- deposit actions remain available;
- admin metrics remain visible;
- deterministic warnings remain active;
- the user can still complete the demo.

An AI error should be isolated from core product functionality.

---

## 62. Security and Privacy UX

The UI should communicate:

- never share a seed phrase;
- SafeBank never requests a private key;
- wallet confirmation is separate from the website;
- contract addresses should be verified;
- MockUSDC is not real money;
- NFT transfer moves economic rights;
- administrator controls create risk;
- AI output is advisory.

Avoid excessive warning fatigue.

Warnings should appear at relevant decision points.

---

## 63. Admin Route Guard

The Admin Portal may check whether the connected wallet matches the on-chain owner.

Possible UX:

- display read-only metrics to non-admin users;
- hide or disable state-changing controls;
- explain that authorization is enforced by the contract.

The route guard must not be described as a security control.

A direct contract call by a non-owner must still revert.

---

## 64. Design for Paused State

When paused:

- show a prominent global banner;
- disable blocked transaction buttons;
- explain which actions are unavailable;
- continue displaying balances and deposit details;
- allow administrators to access unpause controls;
- avoid implying funds are lost.

If only one contract is paused, show the exact scope.

---

## 65. Design for Undercollateralized State

When vault balance is below reserved interest:

- show a warning in Admin Portal;
- show funding shortfall;
- explain C1 behavior after implementation;
- avoid claiming guaranteed immediate interest;
- show safe withdrawal as zero when applicable;
- keep principal and interest amounts visually separated.

User-facing warnings should be factual and not cause unnecessary panic.

---

## 66. Design for Historical Certificates

Because NFTs are not burned:

- completed certificates remain listed;
- status is clearly terminal;
- financial actions are disabled;
- the page shows completion type;
- transaction history remains visible;
- the certificate may be presented as historical proof.

The UI must not make an old NFT appear to represent active principal.

---

## 67. Design for Disabled Plans

Disabled plans should:

- show Disabled status;
- not accept new deposits;
- remain visible where useful;
- explain effects on active deposits;
- explain manual-renew restriction;
- explain that snapshot-based auto-renew may remain available.

---

## 68. Design for Bot Failure

The UI should never imply that a bank bot is required for fund safety.

After grace:

- show the deposit remains active until a transaction executes;
- show owner withdrawal;
- show permissionless auto-renew;
- explain that bot downtime does not create multiple terms automatically.

---

## 69. Demo Mode Considerations

The final demo should make key flows easy to observe.

Useful demo support may include:

- seeded plans;
- funded test accounts;
- funded vault;
- shortened local test terms only in local demo environments if separately configured;
- visible transaction links;
- clear account labels;
- reset instructions.

Personal-variant production logic and official demonstration values must remain documented correctly.

Any local acceleration must not be confused with the required 180-day default tenor.

---

## 70. Content Tone

SafeBank copy should be:

- clear;
- neutral;
- precise;
- educational;
- calm;
- non-promotional.

Avoid claims such as:

- guaranteed safe;
- risk-free;
- impossible to hack;
- insured;
- guaranteed returns;
- real USDC;
- automatic passive income without transactions.

---

## 71. Microcopy Principles

Buttons should use action-specific labels:

- Connect Wallet;
- Approve MockUSDC;
- Open Deposit;
- Review Withdrawal;
- Withdraw at Maturity;
- Renew Deposit;
- Trigger Auto-Renew;
- Claim Pending Interest;
- Fund Vault;
- Withdraw Available Liquidity;
- Pause System.

Avoid vague labels:

- Go;
- Submit;
- Continue;
- Confirm;

unless the context is already completely clear.

---

## 72. User Help Content

Help content should explain:

- basis points;
- tenor;
- APR;
- principal;
- interest;
- penalty;
- maturity;
- grace period;
- NFT certificate;
- current-owner rights;
- approval;
- transaction confirmation;
- pending interest;
- reserved interest;
- available liquidity;
- pause.

Help should not replace visible transaction summaries.

---

## 73. Frontend Technology Decision

No frontend framework has been selected as of Phase 11.

Potential options include:

- React with Vite;
- Next.js;
- another React-based setup compatible with the capstone.

The final decision should consider:

- wallet-library compatibility;
- TypeScript support;
- routing;
- test setup;
- environment configuration;
- deployment simplicity;
- AI server-side requirements;
- bundle security;
- demonstration reliability.

No frontend framework package has been installed yet.

---

## 74. Planned Frontend Architecture

The eventual frontend should separate:

- blockchain configuration;
- wallet state;
- contract reads;
- transaction writes;
- deterministic financial calculations;
- UI components;
- route layouts;
- error mapping;
- AI integration;
- formatting utilities.

Contract ABIs and addresses should not be scattered across components.

Financial formulas should not be duplicated inconsistently.

---

## 75. Planned Component Categories

Possible component groups:

### Shared

- AppShell;
- PageHeader;
- WalletButton;
- NetworkBadge;
- AddressDisplay;
- AmountDisplay;
- TransactionStatus;
- ConfirmationDialog;
- EmptyState;
- ErrorState;
- LoadingSkeleton;
- TestTokenBadge.

### User

- PlanCard;
- PlanComparison;
- DepositCard;
- DepositProgress;
- DepositTimeline;
- OpenDepositWizard;
- ApprovalStep;
- WithdrawalSummary;
- RenewalSummary;
- CertificatePanel;
- PendingInterestCard.

### Admin

- SolvencyMetric;
- RiskBanner;
- PlanForm;
- VaultFundingForm;
- VaultWithdrawalForm;
- PauseConfirmation;
- AuditTable;
- LiabilityChart.

These names are planning references, not implemented components.

---

## 76. Frontend State Separation

The frontend should distinguish:

- wallet state;
- network state;
- server or RPC state;
- transaction state;
- form state;
- contract state;
- AI state.

One state category should not incorrectly overwrite another.

Example:

An AI request failure must not mark a confirmed blockchain transaction as failed.

---

## 77. Form Validation

Client-side validation should provide immediate guidance for:

- required fields;
- valid addresses;
- nonzero amounts;
- decimal precision;
- min and max;
- APR format;
- penalty format;
- tenor format;
- supported network.

The contract remains authoritative.

The UI should display contract reverts even when client validation passed.

---

## 78. Testing Implications

Future UI tests should cover:

- wallet disconnected;
- wallet connected;
- account change;
- unsupported network;
- missing contract configuration;
- empty plans;
- disabled plan;
- amount below min;
- amount above max;
- exact approval;
- rejected approval;
- deposit success;
- deposit revert;
- current NFT owner;
- old owner rejection;
- exact maturity UI;
- exact grace UI;
- early-withdraw warning;
- renewal plan filtering;
- permissionless auto-renew recipient;
- pending-interest claim;
- paused state;
- underfunded state;
- admin authorization;
- high-risk confirmation;
- responsive layout;
- keyboard navigation;
- AI failure fallback.

---

## 79. UI Acceptance Criteria

The User Banking App will not be considered complete until:

- wallet and network states are clear;
- all mandatory user flows exist;
- six-decimal values are correct;
- plan and deposit snapshots are visible;
- transaction lifecycle is complete;
- NFT-transfer warning is prominent;
- test-token warning is prominent;
- mobile layouts are usable;
- core flows work without AI;
- errors are understandable;
- explorer links are available.

The Admin Portal will not be considered complete until:

- administrator identity is clear;
- plan actions exist;
- vault actions exist;
- pause controls use strong confirmation;
- audit information is available;
- C2 metrics mirror the implemented contract reads;
- frontend guards are not presented as real authorization;
- dangerous actions show consequences.

---

## 80. Phase 14 UI/UX Planning Status

At the current Phase 14 baseline:

Completed as planning:

- product principles, branding constraints, personas, routes, responsive rules,
  accessibility rules, transaction lifecycle, and error messaging;
- deposit, withdrawal, manual-renew, auto-renew, and C1 pending-interest UX;
- C2 solvency dashboard, funding-shortfall, reserve, and available-liquidity
  requirements;
- administrator withdrawal review constrained by the contract maximum;
- C1 and C2 event presentation;
- multi-contract pause behavior;
- wallet, network, address, bytecode, and ABI validation;
- AI placement and deterministic fallback requirements;
- alignment with the implemented Phase 13 contracts and production ABIs;
- local environment distinction between ephemeral Hardhat and persistent
  localhost;
- deterministic local role and seed documentation;
- warning that local deterministic addresses are not public deployment
  addresses;
- environment-aware public address configuration;
- actual Sepolia addresses and explorer links;
- compact public deployment metadata;
- accurate zero-vault and zero-deposit initial public state;
- runtime public chain, bytecode, and dependency validation requirements;
- warning that verified source is not a security audit.

Implemented technical integration assets include:

- all mandatory deposit lifecycle operations;
- C1 principal-first settlement and claims;
- C2 reserve and solvency reads;
- local deployment and seed scripts;
- read-only deployment verification;
- production-only ABI export;
- deterministic local accounts and balances;
- five deployment workflow tests;
- guarded Sepolia deployment and read-only verifier;
- public deployment records and compact metadata;
- Etherscan-verified production contract sources.

Not implemented:

- frontend folder and package;
- routes, components, styling, and state management;
- wallet connection;
- contract reads and writes in a browser;
- transaction lifecycle code;
- user and admin controls;
- pending-interest components;
- solvency and reserve components;
- responsive and accessibility testing;
- AI integration;
- deployed frontend.

This remains a planning document. It does not claim that a user interface
currently exists.

## 81. Open UI/UX Decisions

The following decisions remain open:

1. React Vite versus Next.js.
2. Wallet connection library.
3. Contract data-query library.
4. State-management approach.
5. Styling system.
6. Component library or custom system.
7. Final visual identity.
8. Final design tokens.
9. Event-indexing approach.
10. Charting library.
11. Frontend hosting platform.
12. Contract-address configuration format.
13. AI provider.
14. AI server-side architecture.
15. Whether User and Admin use one app shell or separate applications.
16. Final supported wallets.
17. Final confirmation count.
18. Final risk-classification thresholds.

These decisions must be made before or during the relevant frontend phases.

---

## 82. Final Product Position

SafeBank should feel like a carefully designed financial education product rather than a raw smart contract interface.

The experience must consistently communicate:

1. what the user owns;
2. where principal is held;
3. where interest comes from;
4. which financial terms were snapshotted;
5. when each action is available;
6. what the NFT represents;
7. what transaction the wallet will sign;
8. what the administrator can and cannot do;
9. whether the vault is funded;
10. whether displayed values are estimates or confirmed state;
11. that MockUSDC is a test asset;
12. that AI is advisory only.

Implementation must remain aligned with the actual smart contract behavior and must be revised whenever the on-chain interface changes.
