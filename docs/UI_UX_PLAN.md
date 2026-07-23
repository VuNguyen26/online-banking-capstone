# SafeBank UI/UX Implementation Guide

## 1. Document Status

| Field | Value |
|---|---|
| Project | SafeBank — Blockchain Term Deposit System |
| Document | Implemented UI/UX Architecture and Product Behavior |
| Current documentation phase | Phase 19 — Final Documentation |
| Frontend stack | React, TypeScript, Vite, ethers |
| Application model | One single-page application |
| Product areas | User Banking App and Admin Portal |
| Primary language | Vietnamese |
| Secondary language | English |
| Public network | Ethereum Sepolia, chain ID `11155111` |
| Test asset | MockUSDC with 6 decimals |
| Assistant model | Deterministic local rule engines |
| External visual dependency | Spline robot launcher |

This document describes the UI and UX implemented in the current frontend.

It replaces earlier route-level and framework-planning assumptions.

The current application:

- does not use React Router;
- does not use Redux or Zustand;
- switches between User and Admin views through local application state;
- keeps all financial authority in the connected wallet and Solidity contracts;
- treats assistants as optional read-only explanation tools.

A professional accessibility review, usability study, and production banking certification have not been completed.

## 2. Personal Variant Presentation

The UI consistently presents the Personal Variant derived from student ID `3122560090`.

| Parameter | Value |
|---|---:|
| Grace period | `2 days` |
| Default APR | `200 bps = 2.00%` |
| Early-withdrawal penalty | `750 bps = 7.50%` |
| Default tenor | `180 days` |
| MockUSDC decimals | `6` |

User-facing financial calculations use six-decimal token units.

The frontend does not use `parseEther` for MockUSDC.

## 3. Product Positioning

SafeBank is presented as:

- an educational blockchain Capstone;
- a fixed-term savings demonstration;
- a Sepolia testnet application;
- a transparent contract-driven product;
- a system using freely mintable test tokens.

The interface must not imply:

- legal deposit insurance;
- guaranteed real-world returns;
- production banking certification;
- professional financial advice;
- real monetary value for MockUSDC;
- autonomous financial authority for assistants.

The educational and test-token context remains visible throughout the experience.

## 4. Product Principles

### 4.1 Contract State Is Authoritative

The UI may calculate estimates and derive availability, but contract storage and confirmed transaction receipts remain authoritative.

The interface distinguishes:

- estimated values;
- current on-chain values;
- pending transaction values;
- confirmed results;
- historical certificate data.

### 4.2 Explain Before Signing

Before opening the wallet, consequential actions present:

- action type;
- relevant amount;
- contract or recipient;
- timing condition;
- expected state transition;
- important warning;
- network context.

### 4.3 No Hidden Financial Actions

The frontend does not:

- sign automatically;
- submit automatically;
- silently approve tokens;
- default to unlimited approval;
- silently switch networks;
- hide approval as part of a deposit;
- execute assistant suggestions.

### 4.4 Safe Defaults

Implemented safe defaults include:

- exact token approval;
- Sepolia validation;
- explicit confirmation;
- disabled action when required data is unavailable;
- no transaction from assistant output;
- no optimistic terminal state before receipt confirmation.

### 4.5 Honest Status

The UI distinguishes:

- loading;
- empty;
- ready;
- disabled;
- waiting for wallet;
- submitted;
- confirming;
- success;
- rejected;
- reverted;
- RPC failure;
- paused;
- underfunded.

### 4.6 Progressive Disclosure

Primary views emphasize:

- action;
- amount;
- status;
- timing;
- next available step.

Supporting details include:

- contract addresses;
- plan IDs;
- deposit IDs;
- timestamps;
- basis points;
- transaction hashes;
- reserve metrics;
- claimant information.

## 5. Application Structure

SafeBank is one React single-page application.

`App.tsx` stores:

~~~text
ApplicationView = user | admin
~~~

The application renders either:

- `UserDashboard`;
- `AdminDashboard`.

Both are wrapped by:

~~~text
ApplicationShell
~~~

The frontend does not define route paths such as:

- `/app`;
- `/admin`;
- `/app/plans`;
- `/app/deposits`.

View switching is immediate and local.

## 6. Shared Application Shell

`ApplicationShell` provides the common product frame.

Shared responsibilities include:

- SafeBank branding;
- User and Admin view switch;
- language switch;
- responsive page layout;
- consistent primary content width;
- shared navigation presentation;
- educational and network context.

User and Admin views remain visually related while preserving different workflows.

The shell does not grant administrator authority.

## 7. Language Experience

SafeBank supports:

- Vietnamese;
- English.

Vietnamese is the default language.

The selected language is:

- managed by `LanguageProvider`;
- persisted in `localStorage`;
- restored on later visits;
- reflected in document language metadata;
- applied to user, administrator, transaction, error, and assistant content.

Contract values and identifiers are not translated.

## 8. Wallet Experience

The wallet layer supports an injected EIP-1193 browser wallet.

Implemented wallet states include:

- no browser wallet detected;
- disconnected;
- connecting;
- connected;
- wrong network;
- switching network;
- ready for transactions;
- provider error.

Displayed wallet information includes:

- shortened connected address;
- current network state;
- Sepolia requirement;
- action to connect;
- action to switch network;
- error feedback.

The frontend never requests a private key or seed phrase.

## 9. Network Experience

The application targets Ethereum Sepolia only.

Before returning a signer, the wallet layer verifies:

- an injected provider exists;
- an account is connected;
- chain ID equals `11155111`.

Public contract reads may continue without a connected wallet.

Wrong-network state:

- prevents write preparation;
- displays a clear Sepolia requirement;
- offers an explicit switch action;
- does not silently change the network.

## 10. Public Data Loading

Public reads use an ethers `JsonRpcProvider`.

The application can display public protocol data before wallet connection.

Public data includes:

- contract configuration;
- plan count;
- saving plans;
- deposit count;
- pause states;
- vault balance;
- reserved interest;
- available liquidity;
- funding shortfall;
- latest block timestamp.

Public loading is separate from wallet-specific loading.

## 11. User Banking App Overview

The User Banking App is implemented in `UserDashboard`.

Primary user areas include:

- wallet section;
- open-deposit panel;
- contract links;
- deposit portfolio;
- Banking Assistant;
- protocol and account data.

The dashboard supports both:

- users with no connected wallet;
- connected users with or without deposits.

Fake balances or example deposits are not displayed as live state.

## 12. Wallet Section

The wallet section presents:

- connection status;
- connected address;
- network status;
- connect action;
- Sepolia switch action;
- wallet-related errors.

The section avoids:

- requesting wallet access on page load;
- presenting a disconnected account as zero balance;
- claiming transaction readiness on the wrong network.

## 13. Contract Links

The User Banking App displays tracked Sepolia contract addresses.

Links are provided for:

- MockUSDC;
- VaultManager;
- SavingCore.

Address presentation uses:

- shortened human-readable form;
- full address where appropriate;
- Sepolia Etherscan target;
- explicit contract identity.

Etherscan source verification is not presented as a security audit.

## 14. Saving Plan Presentation

Plan information includes:

- plan ID;
- tenor;
- APR;
- APR percentage conversion;
- minimum deposit;
- maximum deposit;
- early-withdrawal penalty;
- enabled state.

Enabled plans may be selected for new deposits.

Disabled plans:

- remain visible when relevant;
- show disabled state;
- cannot be used to open a new deposit;
- cannot be selected for manual renewal;
- do not invalidate existing deposits.

Basis-point presentation explains that:

~~~text
100 bps = 1.00%
200 bps = 2.00%
750 bps = 7.50%
~~~

## 15. Open Deposit Experience

The implemented deposit flow separates approval from deposit creation.

### 15.1 Plan Selection

The user selects an enabled plan.

Displayed plan data includes:

- tenor;
- APR;
- limits;
- penalty;
- plan ID.

### 15.2 Amount Entry

The amount input:

- uses mUSDC;
- supports six decimals;
- validates a positive amount;
- validates plan minimum and maximum;
- compares against wallet balance when available;
- avoids floating-point authoritative calculations.

### 15.3 Estimate

The review displays:

- principal;
- plan;
- tenor;
- APR;
- estimated interest;
- estimated maturity payout;
- estimated maturity timestamp;
- early-withdrawal penalty;
- network;
- SavingCore address;
- test-token warning.

The estimate mirrors contract integer-floor behavior.

### 15.4 Approval

Approval is a separate wallet transaction.

The UI explains:

- approval does not create a deposit;
- SavingCore is the spender;
- the requested amount is exact;
- a second confirmation is required for deposit opening.

Existing sufficient allowance may skip a new approval.

### 15.5 Deposit Transaction

Before submission, the confirmation includes:

- selected plan;
- principal;
- expected snapshots;
- network;
- contract;
- expected NFT certificate.

After confirmation, authoritative data is refreshed.

## 16. Deposit Portfolio

`DepositPortfolioPanel` displays deposits associated with the connected wallet.

Portfolio data includes:

- deposit ID;
- certificate ID;
- current owner;
- principal;
- APR snapshot;
- penalty snapshot;
- tenor snapshot;
- start time;
- maturity time;
- grace end;
- status;
- pending interest;
- claimant;
- available actions.

Historical certificates remain visible after terminal actions.

The UI does not treat a retained NFT as proof that its old deposit remains active.

## 17. Deposit Discovery

The contract does not use `ERC721Enumerable`.

Owned-deposit discovery is performed off-chain through available deposit IDs and current ownership checks.

The frontend reconciles:

- candidate deposit IDs;
- `ownerOf(depositId)`;
- deposit status;
- connected wallet;
- pending-interest claimant.

The UI does not rely only on original depositor storage.

## 18. Lifecycle Action Availability

Available actions derive from:

- deposit existence;
- status `Active`;
- direct current NFT owner;
- current block timestamp;
- grace end;
- SavingCore pause;
- VaultManager pause;
- pending-interest amount;
- fixed claimant;
- selected plan state.

The frontend refreshes a recent block timestamp instead of relying only on the browser clock.

## 19. Early Withdrawal UX

Early withdrawal is offered only when:

~~~text
deposit.status == Active
connectedWallet == ownerOf(depositId)
blockTimestamp < maturityAt
SavingCore.paused == false
~~~

The confirmation displays:

- original principal;
- penalty rate;
- floor-rounded penalty;
- user receipt;
- fee receiver;
- zero interest;
- current owner;
- irreversible terminal result;
- historical NFT retention.

The UI explains that VaultManager pause alone does not block early withdrawal.

At exact maturity, early withdrawal becomes unavailable.

## 20. Maturity Withdrawal UX

Maturity withdrawal is offered when:

~~~text
deposit.status == Active
connectedWallet == ownerOf(depositId)
blockTimestamp >= maturityAt
SavingCore.paused == false
~~~

The review displays:

- principal;
- calculated interest;
- total expected payout;
- current owner;
- principal source;
- interest source;
- vault state;
- network;
- contract.

For underfunded interest, the UI explains C1:

- principal may still return;
- complete unpaid interest becomes pending;
- no partial interest payment is attempted;
- the current owner becomes the fixed claimant;
- later funding is required for claim.

The UI does not promise immediate interest.

## 21. Manual Renewal UX

Manual renewal is offered only during:

~~~text
maturityAt <= blockTimestamp < graceEndsAt
~~~

Additional conditions:

- old deposit is active;
- connected wallet is direct current owner;
- SavingCore is not paused;
- target plan exists;
- target plan is enabled;
- compounded principal satisfies target limits.

The plan selector includes enabled plans only.

The review displays:

- old deposit ID;
- old owner;
- old principal;
- old APR snapshot;
- old tenor snapshot;
- calculated old-term interest;
- selected new plan;
- new principal;
- new APR;
- new tenor;
- new penalty;
- expected new maturity;
- renewed NFT recipient.

The user is told that positive interest moves from VaultManager into SavingCore rather than into the wallet.

## 22. Permissionless Auto-Renew UX

Auto-renew is offered when:

~~~text
deposit.status == Active
blockTimestamp >= graceEndsAt
SavingCore.paused == false
~~~

The connected wallet does not need to own the certificate.

The review distinguishes:

- transaction caller;
- current old-certificate owner;
- renewed NFT recipient.

The recipient is not editable.

The UI explains that auto-renew preserves:

- old plan ID;
- old tenor snapshot;
- old APR snapshot;
- old penalty snapshot.

It also explains:

- time passing alone does not renew;
- one transaction creates one new term;
- delayed execution does not create multiple retroactive terms;
- the new term starts at the transaction timestamp.

## 23. Pending Interest UX

Pending interest is displayed when:

~~~text
pendingInterest[depositId] > 0
~~~

Displayed data includes:

- deposit ID;
- pending amount;
- fixed claimant;
- current connected wallet;
- vault liquidity context;
- claim availability.

Claim is offered only when:

~~~text
connectedWallet == interestClaimant[depositId]
~~~

The UI does not treat:

- NFT ownership after settlement;
- ERC721 approval;
- original depositor identity

as pending-claim authority.

After a successful claim, pending amount refreshes to zero.

## 24. Pause-State UX

SavingCore and VaultManager pause states are displayed separately.

### 24.1 SavingCore Pause

The UI blocks:

- opening deposits;
- early withdrawal;
- maturity withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claim.

### 24.2 VaultManager Pause

The UI explains that VaultManager pause blocks:

- positive-interest maturity payout;
- positive-interest renewal;
- pending-interest payout;
- owner vault withdrawal.

Early withdrawal remains available when only VaultManager is paused.

Zero-interest renewal may remain contract-valid.

### 24.3 Mixed Pause State

The interface does not combine both contracts into one ambiguous status.

Each blocked action identifies the relevant contract.

## 25. Admin Portal Overview

The Admin Portal is implemented in `AdminDashboard`.

Primary areas include:

- administrator overview;
- protocol configuration;
- plan management;
- vault management;
- deposit inspection;
- Risk Assistant.

`AdminDataProvider` is mounted only while the Admin view is active.

The portal remains readable to non-admin users, but write actions require on-chain ownership.

## 26. Admin Overview

The overview displays:

- plan count;
- deposit count;
- vault balance;
- loading state;
- error state;
- retry action.

Additional panels expose:

- owners;
- pending owners;
- pause states;
- contract relationships;
- fee receiver;
- reserve metrics;
- shortfall.

No administrator metric is fabricated when data loading fails.

## 27. Plan Administration UX

Implemented plan actions:

- create plan;
- update APR;
- enable plan;
- disable plan.

### 27.1 Create Plan

The form accepts:

- tenor days;
- APR bps;
- minimum;
- maximum;
- penalty bps;
- initial enabled state.

The review converts basis points to human-readable percentages.

### 27.2 APR Update

The confirmation displays:

- plan ID;
- existing APR;
- new APR;
- percentage conversion;
- statement that existing snapshots remain unchanged.

### 27.3 Enable and Disable

Enable confirmation explains that new deposits may use the plan.

Disable confirmation explains:

- new deposits cannot use it;
- manual renewal cannot select it;
- existing deposits remain valid;
- snapshot-based auto-renew may continue.

## 28. Vault Administration UX

Implemented vault actions:

- exact-amount token approval;
- vault funding;
- available-liquidity withdrawal;
- fee-receiver update;
- VaultManager pause;
- VaultManager unpause.

### 28.1 Vault Metrics

Displayed metrics include:

- vault balance;
- total reserved interest;
- available liquidity;
- funding shortfall;
- fee receiver;
- authorized SavingCore;
- pause state.

### 28.2 Funding

Funding is separated into:

- exact MockUSDC approval;
- vault funding transaction.

The review displays:

- source wallet;
- amount;
- VaultManager recipient;
- network;
- expected effect.

### 28.3 Withdrawal

Withdrawal input is constrained by available liquidity.

The confirmation displays:

- requested amount;
- vault balance;
- reserve;
- maximum available;
- owner recipient;
- expected remaining balance.

The contract remains the final enforcement layer.

### 28.4 Fee Receiver

The confirmation displays:

- current fee receiver;
- new address;
- effect on future unsettled early withdrawals;
- no effect on penalty-rate snapshots.

## 29. System Control UX

SavingCore and VaultManager pause controls are independent.

Pause and unpause require confirmation.

The review identifies:

- affected contract;
- current state;
- new state;
- connected wallet;
- network;
- operational impact.

The interface explains that pause does not:

- reverse transactions;
- restore keys;
- fund liabilities;
- repair a wrong deployment;
- guarantee recovery.

## 30. Deposit Inspection UX

The Admin Portal includes read-only deposit inspection by ID.

Inspection displays available contract data without allowing direct editing.

The administrator cannot use the UI to:

- change principal;
- change owner;
- change snapshots;
- reset status;
- force settlement;
- create pending debt manually.

Invalid deposit IDs return a clear state instead of editable placeholder data.

## 31. Transaction Lifecycle UX

The reusable transaction model includes:

- idle;
- wallet confirmation;
- submitted;
- confirming;
- success;
- error.

The UI handles:

- user rejection;
- contract revert;
- provider error;
- invalid network;
- missing wallet;
- invalid input.

A confirmed receipt is required before showing success.

Relevant data providers refresh after success.

## 32. Confirmation Dialog UX

Confirmation dialogs are used for:

- deposit opening;
- early withdrawal;
- maturity withdrawal;
- manual renewal;
- auto-renew;
- pending-interest claim;
- plan creation;
- APR update;
- plan enable;
- plan disable;
- vault funding;
- vault withdrawal;
- fee-receiver update;
- pause;
- unpause.

Dialog behavior includes:

- clear title;
- consequence summary;
- cancel action;
- confirm action;
- disabled confirm while transaction is active;
- action-specific details;
- accessible dialog labeling.

The dialog does not sign or submit without explicit confirmation.

## 33. Loading, Empty, and Error States

Reusable state presentation distinguishes:

- loading;
- empty;
- error;
- informational state.

Examples include:

- public data loading;
- wallet data loading;
- no wallet;
- no deposits;
- no pending claim;
- no valid inspected deposit;
- RPC failure;
- retryable provider failure;
- unavailable configuration.

Empty state is not presented as an error.

Error state does not display fake zero values as successful data.

## 34. Banking Assistant UX

The Banking Assistant is mounted only when User Banking App data is ready.

It can explain:

- plans;
- APR;
- tenor;
- maturity;
- penalties;
- withdrawal;
- manual renewal;
- auto-renew;
- pending interest;
- claimant rules;
- vault shortfall.

It receives:

- serializable dashboard data;
- connected account when available;
- selected language;
- validated question.

It cannot prepare or submit a transaction.

## 35. Risk Assistant UX

The Risk Assistant is mounted only when Admin Portal data is ready.

It can explain:

- vault balance;
- total reserved interest;
- available liquidity;
- funding shortfall;
- pause states;
- ownership;
- pending ownership;
- fee receiver;
- contract relationships;
- plan configuration.

It does not replace contract reads or administrator confirmations.

## 36. Assistant Input and Output UX

Question handling:

- replaces control characters;
- normalizes whitespace;
- rejects empty input;
- rejects input over 500 characters;
- rejects HTTP and HTTPS URLs.

Assistant states include:

- idle;
- answering;
- answer displayed;
- validation failure;
- safe fallback;
- cancellation.

Every answer contains:

1. fact;
2. explanation;
3. caution;
4. next step.

Responses are rendered as ordinary React text.

## 37. Assistant Launcher UX

The assistant launcher uses an external Spline robot scene.

Desktop behavior:

- floating launcher;
- responsive dialog;
- close control;
- labeled assistant identity.

Mobile behavior:

- compact launcher;
- bottom-sheet style panel;
- touch-friendly layout.

Motion behavior:

- nonessential launcher motion;
- reduced-motion support;
- core workflows remain usable without the visual asset.

Spline is not:

- a source of financial data;
- a wallet component;
- an authorization layer;
- an AI reasoning provider.

## 38. Responsive Design

The frontend supports desktop and smaller-screen layouts.

Responsive behavior includes:

- stacked dashboard grids;
- full-width action panels;
- responsive cards;
- compact navigation;
- flexible financial summaries;
- scroll-safe dialogs;
- mobile assistant sheet;
- touch-friendly control sizing.

Responsive behavior does not remove essential financial details.

Dense technical information may wrap or move below primary values.

## 39. Visual System

The implemented visual direction uses:

- SafeBank original branding;
- restrained banking-style layout;
- card-based information grouping;
- gradient hero treatment;
- status chips;
- clear action hierarchy;
- financial-number emphasis;
- readable spacing;
- consistent borders and radii.

The interface avoids copying a real bank identity.

Semantic visual roles include:

- primary action;
- neutral surface;
- success;
- warning;
- danger;
- information;
- disabled state;
- focus state.

## 40. Accessibility Characteristics

Implemented accessibility-related characteristics include:

- semantic headings;
- labeled sections;
- `aria-labelledby` usage;
- accessible dialog labels;
- keyboard-reachable controls;
- visible button labels;
- non-color status text;
- loading and error messages;
- language metadata;
- reduced-motion handling.

Known accessibility limitations:

- no independent WCAG audit;
- no screen-reader laboratory evaluation;
- no formal contrast certification;
- external Spline content has separate accessibility constraints.

## 41. Error Translation

Contract, wallet, provider, and validation errors are mapped into user-facing Vietnamese and English messages.

Mapped categories include:

- user rejected transaction;
- wrong network;
- missing wallet;
- missing account;
- inactive deposit;
- not current owner;
- too early;
- maturity reached;
- manual window closed;
- auto-renew too early;
- disabled plan;
- plan limit failure;
- paused contract;
- underfunded vault;
- no pending interest;
- wrong claimant;
- insufficient allowance;
- insufficient balance;
- generic revert.

The original contract remains the final source of failure semantics.

## 42. Financial Display Rules

Financial values use bigint-compatible calculations.

The frontend avoids JavaScript floating-point arithmetic for authoritative token values.

Display rules include:

- mUSDC formatted from six-decimal units;
- APR shown as percentage and basis points where useful;
- penalty shown as percentage and amount;
- timestamps shown in human-readable form;
- exact values available in supporting details;
- floor rounding aligned with contract behavior;
- estimates labeled as estimates.

## 43. Ownership Communication

The interface communicates:

> Transferring the deposit NFT transfers the right to the active deposit principal and interest.

Ownership communication appears around:

- deposit details;
- current-owner data;
- lifecycle actions;
- renewal recipient;
- assistant explanations.

The UI also explains:

- old certificates remain historical;
- historical NFT transfer after C1 settlement does not transfer the pending claim;
- ERC721 approval alone does not grant direct withdrawal authority.

## 44. Solvency Communication

C2 metrics are presented with explicit definitions.

| Metric | Meaning |
|---|---|
| Vault balance | Actual MockUSDC held by VaultManager |
| Reserved interest | Aggregate expected and pending interest liabilities |
| Available liquidity | Maximum current administrator withdrawal |
| Funding shortfall | Reserve amount not covered by current vault balance |

The UI does not describe zero shortfall as a professional solvency guarantee.

Undercollateralization is shown as a visible risk state.

## 45. Validation Evidence

Last validated frontend checkpoint:

- 65 passing test files;
- 256 passing tests;
- zero Oxlint warnings or errors;
- successful TypeScript validation;
- successful Vite production build.

Validated areas include:

- application view switching;
- shared shell;
- wallet events;
- network handling;
- public reads;
- user actions;
- admin actions;
- exact approval;
- transaction lifecycle;
- confirmations;
- loading states;
- empty states;
- error states;
- bilingual behavior;
- responsive components;
- Banking Assistant;
- Risk Assistant;
- assistant validation;
- assistant cancellation;
- stale-response protection.

## 46. Known UI/UX Limitations

- The application targets Sepolia only.
- MockUSDC has no monetary value.
- There is no React Router or deep-link route model.
- Browser refresh returns to the default application view.
- Rich NFT metadata and custom token artwork are not implemented.
- The assistant supports bounded SafeBank intents rather than unrestricted conversation.
- Spline depends on an external visual host.
- RPC data may be delayed or unavailable.
- The interface has not received an independent accessibility audit.
- Mobile and browser behavior may vary outside validated environments.
- The frontend does not replace on-chain authorization.
- The application is not production banking software.

## 47. Final UI/UX Position

The implemented SafeBank frontend provides:

- one coherent User and Admin application;
- bilingual operation;
- public reads without wallet connection;
- wallet-controlled writes;
- exact-amount approvals;
- contract-aligned financial estimates;
- deposit lifecycle actions;
- C1 pending-interest UX;
- C2 solvency visibility;
- explicit confirmations;
- loading, empty, and error states;
- responsive layouts;
- deterministic read-only assistants.

The final authority remains:

1. contract state;
2. confirmed transaction receipt;
3. current wallet ownership and network.

The UI and assistants explain and prepare actions, but they do not override these boundaries.