// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {VaultManager} from "./VaultManager.sol";

/**
 * @title SavingCore
 * @notice Central SafeBank contract for saving-plan and deposit management.
 * @dev Implements saving-plan administration, deposit lifecycle operations,
 *      ERC721 certificates, C1 principal-first settlement, and C2 aggregate
 *      reserved-interest accounting exposed to VaultManager.
 */
contract SavingCore is ERC721, Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    /**
     * @notice Number of seconds in the fixed personal-variant grace period.
     */
    uint256 public constant GRACE_PERIOD = 2 days;

    /**
     * @notice Personal-variant default tenor in days.
     */
    uint256 public constant DEFAULT_TENOR_DAYS = 180;

    /**
     * @notice Personal-variant default annual percentage rate in basis points.
     */
    uint256 public constant DEFAULT_APR_BPS = 200;

    /**
     * @notice Personal-variant default early-withdrawal penalty in basis points.
     */
    uint256 public constant DEFAULT_EARLY_WITHDRAW_PENALTY_BPS = 750;

    /**
     * @notice Basis-point denominator representing 100%.
     */
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /**
     * @notice Minimum supported saving-plan tenor.
     */
    uint256 public constant MIN_TENOR_DAYS = 1;

    /**
     * @notice Maximum supported saving-plan tenor.
     */
    uint256 public constant MAX_TENOR_DAYS = 3_650;

    /**
     * @notice Minimum supported annual percentage rate.
     */
    uint256 public constant MIN_APR_BPS = 1;

    /**
     * @notice Maximum supported annual percentage rate.
     */
    uint256 public constant MAX_APR_BPS = BPS_DENOMINATOR;

    /**
     * @notice Maximum supported early-withdrawal penalty.
     */
    uint256 public constant MAX_PENALTY_BPS = BPS_DENOMINATOR;

    /**
     * @notice Saving-plan configuration.
     * @dev Only aprBps and enabled may change after creation.
     */
    struct Plan {
        uint256 tenorDays;
        uint256 aprBps;
        uint256 minDeposit;
        uint256 maxDeposit;
        uint256 earlyWithdrawPenaltyBps;
        bool enabled;
    }

    /**
     * @notice Lifecycle state of a deposit certificate.
     */
    enum DepositStatus {
        Active,
        Withdrawn,
        ManualRenewed,
        AutoRenewed
    }

    /**
     * @notice Immutable financial terms and lifecycle state of one deposit.
     */
    struct Deposit {
        uint256 planId;
        uint256 principal;
        uint256 startedAt;
        uint256 maturityAt;
        uint256 tenorDays;
        uint256 aprBpsAtOpen;
        uint256 penaltyBpsAtOpen;
        DepositStatus status;
    }

    /**
     * @dev A required contract address is zero.
     */
    error InvalidAddress();

    /**
     * @dev A dependency address has no deployed bytecode.
     */
    error AddressIsNotContract(address account);

    /**
     * @dev The supplied plan identifier does not refer to an existing plan.
     */
    error InvalidPlanId(uint256 planId);

    /**
     * @dev The supplied tenor is outside the supported range.
     */
    error InvalidTenorDays(uint256 tenorDays);

    /**
     * @dev The supplied APR is outside the supported range.
     */
    error InvalidAprBps(uint256 aprBps);

    /**
     * @dev The supplied early-withdrawal penalty exceeds the supported range.
     */
    error InvalidPenaltyBps(uint256 penaltyBps);

    /**
     * @dev Both deposit limits are nonzero and the minimum exceeds the maximum.
     */
    error InvalidDepositRange(uint256 minDeposit, uint256 maxDeposit);

    /**
     * @dev The requested plan is already enabled.
     */
    error PlanAlreadyEnabled(uint256 planId);

    /**
     * @dev The requested plan is already disabled.
     */
    error PlanAlreadyDisabled(uint256 planId);

    /**
     * @dev The supplied deposit identifier does not exist.
     */
    error InvalidDepositId(uint256 depositId);

    /**
     * @dev A deposit principal amount must be greater than zero.
     */
    error InvalidAmount();

    /**
     * @dev The selected plan does not currently accept new deposits.
     */
    error PlanNotEnabled(uint256 planId);

    /**
     * @dev The supplied amount is below the selected plan's minimum.
     */
    error DepositBelowMinimum(uint256 amount, uint256 minimum);

    /**
     * @dev The supplied amount is above the selected plan's maximum.
     */
    error DepositAboveMaximum(uint256 amount, uint256 maximum);

    /**
     * @dev The deposit has already reached a terminal lifecycle state.
     */
    error DepositNotActive(
        uint256 depositId,
        DepositStatus currentStatus
    );

    /**
     * @dev The caller is not the current owner of the deposit certificate.
     */
    error NotDepositOwner(
        uint256 depositId,
        address caller,
        address currentOwner
    );

    /**
     * @dev The deposit maturity timestamp has not yet been reached.
     */
    error DepositNotMatured(
        uint256 depositId,
        uint256 maturityAt,
        uint256 currentTimestamp
    );

    /**
     * @dev The deposit has reached maturity and is no longer early-withdrawable.
     */
    error DepositAlreadyMatured(
        uint256 depositId,
        uint256 maturityAt,
        uint256 currentTimestamp
    );

    /**
     * @dev The manual-renewal grace window has ended.
     */
    error ManualRenewalWindowClosed(
        uint256 depositId,
        uint256 graceEndsAt,
        uint256 currentTimestamp
    );

    /**
     * @dev The permissionless auto-renew timestamp has not yet been reached.
     */
    error AutoRenewalTooEarly(
        uint256 depositId,
        uint256 graceEndsAt,
        uint256 currentTimestamp
    );

    /**
     * @dev The supplied deposit has no outstanding deferred interest.
     */
    error NoPendingInterest(uint256 depositId);

    /**
     * @dev The caller is not the claimant snapshotted at maturity settlement.
     */
    error NotInterestClaimant(
        uint256 depositId,
        address caller,
        address claimant
    );

    /**
     * @dev Aggregate reserved interest is smaller than a required reduction.
     */
    error InsufficientReservedInterest(
        uint256 reserved,
        uint256 required
    );

    /**
     * @notice Emitted when a new saving plan is created.
     */
    event PlanCreated(
        uint256 indexed planId,
        uint256 tenorDays,
        uint256 aprBps
    );

    /**
     * @notice Emitted when a saving plan's APR is updated.
     */
    event PlanUpdated(uint256 indexed planId, uint256 newAprBps);

    /**
     * @notice Emitted when a saving plan is enabled.
     */
    event PlanEnabled(uint256 indexed planId);

    /**
     * @notice Emitted when a saving plan is disabled.
     */
    event PlanDisabled(uint256 indexed planId);

    /**
     * @notice Emitted after principal custody and certificate issuance succeed.
     */
    event DepositOpened(
        uint256 indexed depositId,
        address indexed owner,
        uint256 indexed planId,
        uint256 principal,
        uint256 maturityAt,
        uint256 aprBpsAtOpen
    );

    /**
     * @notice Emitted after a deposit is settled through withdrawal.
     */
    event Withdrawn(
        uint256 indexed depositId,
        address indexed owner,
        uint256 principal,
        uint256 interest,
        bool isEarly
    );

    /**
     * @notice Emitted when maturity interest is deferred for later payment.
     */
    event InterestDeferred(
        uint256 indexed depositId,
        address indexed claimant,
        uint256 amount
    );

    /**
     * @notice Emitted after a claimant receives all deferred interest.
     */
    event PendingInterestClaimed(
        uint256 indexed depositId,
        address indexed claimant,
        uint256 amount
    );

    /**
     * @notice Emitted when a new deposit interest liability is recorded.
     */
    event InterestReserved(
        uint256 indexed depositId,
        uint256 amount,
        uint256 totalReservedInterest
    );

    /**
     * @notice Emitted when interest is no longer owed after early withdrawal.
     */
    event ReservedInterestReleased(
        uint256 indexed depositId,
        uint256 amount,
        uint256 totalReservedInterest
    );

    /**
     * @notice Emitted when a reserved liability is paid or compounded.
     */
    event ReservedInterestConsumed(
        uint256 indexed depositId,
        uint256 amount,
        uint256 totalReservedInterest
    );

    /**
     * @notice Emitted after an old deposit is renewed into a new one.
     */
    event Renewed(
        uint256 indexed oldDepositId,
        uint256 indexed newDepositId,
        uint256 newPrincipal,
        uint256 indexed newPlanId
    );

    /**
     * @notice MockUSDC-compatible token used by SafeBank.
     */
    IERC20 public immutable token;

    /**
     * @notice VaultManager that holds bank-funded interest liquidity.
     */
    VaultManager public immutable vaultManager;

    /**
     * @notice Number of saving plans created.
     * @dev Valid plan identifiers range from 1 through planCount.
     */
    uint256 public planCount;

    /**
     * @notice Number of deposits created.
     * @dev Valid deposit identifiers range from 1 through depositCount.
     */
    uint256 public depositCount;

    mapping(uint256 planId => Plan plan) private _plans;
    mapping(uint256 depositId => Deposit deposit) private _deposits;

    /**
     * @notice Outstanding deferred maturity interest for each settled deposit.
     */
    mapping(uint256 depositId => uint256 amount) public pendingInterest;

    /**
     * @notice Claimant snapshotted when a deposit creates deferred interest.
     */
    mapping(uint256 depositId => address claimant) public interestClaimant;

    /**
     * @notice Aggregate expected and pending interest liabilities.
     * @dev This value may exceed VaultManager's current token balance.
     */
    uint256 public totalReservedInterest;

    /**
     * @param token_ MockUSDC-compatible ERC20 contract address.
     * @param vaultManager_ Deployed VaultManager contract address.
     * @param initialOwner_ Initial SafeBank administrator.
     */
    constructor(
        address token_,
        address vaultManager_,
        address initialOwner_
    )
        ERC721("SafeBank Deposit Certificate", "SBDC")
        Ownable(initialOwner_)
    {
        if (token_ == address(0) || vaultManager_ == address(0)) {
            revert InvalidAddress();
        }

        if (token_.code.length == 0) {
            revert AddressIsNotContract(token_);
        }

        if (vaultManager_.code.length == 0) {
            revert AddressIsNotContract(vaultManager_);
        }

        token = IERC20(token_);
        vaultManager = VaultManager(vaultManager_);
    }

    /**
     * @notice Creates a new saving plan.
     * @param tenorDays Length of one term in days.
     * @param aprBps Annual percentage rate in basis points.
     * @param minDeposit Minimum principal, or zero for no lower plan limit.
     * @param maxDeposit Maximum principal, or zero for no upper plan limit.
     * @param earlyWithdrawPenaltyBps Early-withdrawal penalty in basis points.
     * @param enabled Whether the plan initially accepts new deposits.
     * @return planId Newly assigned plan identifier.
     */
    function createPlan(
        uint256 tenorDays,
        uint256 aprBps,
        uint256 minDeposit,
        uint256 maxDeposit,
        uint256 earlyWithdrawPenaltyBps,
        bool enabled
    ) external onlyOwner returns (uint256 planId) {
        _validateTenor(tenorDays);
        _validateApr(aprBps);
        _validatePenalty(earlyWithdrawPenaltyBps);
        _validateDepositRange(minDeposit, maxDeposit);

        planId = ++planCount;

        _plans[planId] = Plan({
            tenorDays: tenorDays,
            aprBps: aprBps,
            minDeposit: minDeposit,
            maxDeposit: maxDeposit,
            earlyWithdrawPenaltyBps: earlyWithdrawPenaltyBps,
            enabled: enabled
        });

        emit PlanCreated(planId, tenorDays, aprBps);
    }

    /**
     * @notice Updates the APR used by future deposits selecting a plan.
     * @dev Existing deposit snapshots will not depend on this mutable value.
     * @param planId Existing saving-plan identifier.
     * @param newAprBps New annual percentage rate in basis points.
     */
    function updatePlan(
        uint256 planId,
        uint256 newAprBps
    ) external onlyOwner {
        _requirePlanExists(planId);
        _validateApr(newAprBps);

        _plans[planId].aprBps = newAprBps;

        emit PlanUpdated(planId, newAprBps);
    }

    /**
     * @notice Enables an existing plan for future deposit operations.
     * @param planId Existing saving-plan identifier.
     */
    function enablePlan(uint256 planId) external onlyOwner {
        _requirePlanExists(planId);

        Plan storage plan = _plans[planId];

        if (plan.enabled) {
            revert PlanAlreadyEnabled(planId);
        }

        plan.enabled = true;

        emit PlanEnabled(planId);
    }

    /**
     * @notice Disables an existing plan for future deposit operations.
     * @param planId Existing saving-plan identifier.
     */
    function disablePlan(uint256 planId) external onlyOwner {
        _requirePlanExists(planId);

        Plan storage plan = _plans[planId];

        if (!plan.enabled) {
            revert PlanAlreadyDisabled(planId);
        }

        plan.enabled = false;

        emit PlanDisabled(planId);
    }

    /**
     * @notice Returns an existing saving plan.
     * @param planId Existing saving-plan identifier.
     */
    function getPlan(uint256 planId) external view returns (Plan memory) {
        _requirePlanExists(planId);
        return _plans[planId];
    }

    /**
     * @notice Opens a fixed-term deposit and mints its ERC721 certificate.
     * @param planId Enabled saving-plan identifier.
     * @param amount Principal transferred from the caller into SavingCore.
     * @return depositId Newly assigned deposit and certificate identifier.
     */
    function openDeposit(
        uint256 planId,
        uint256 amount
    )
        external
        whenNotPaused
        nonReentrant
        returns (uint256 depositId)
    {
        _requirePlanExists(planId);

        Plan memory plan = _plans[planId];

        if (!plan.enabled) {
            revert PlanNotEnabled(planId);
        }

        if (amount == 0) {
            revert InvalidAmount();
        }

        if (plan.minDeposit != 0 && amount < plan.minDeposit) {
            revert DepositBelowMinimum(amount, plan.minDeposit);
        }

        if (plan.maxDeposit != 0 && amount > plan.maxDeposit) {
            revert DepositAboveMaximum(amount, plan.maxDeposit);
        }

        uint256 startedAt = block.timestamp;
        uint256 maturityAt = startedAt + plan.tenorDays * 1 days;

        depositId = ++depositCount;

        _deposits[depositId] = Deposit({
            planId: planId,
            principal: amount,
            startedAt: startedAt,
            maturityAt: maturityAt,
            tenorDays: plan.tenorDays,
            aprBpsAtOpen: plan.aprBps,
            penaltyBpsAtOpen: plan.earlyWithdrawPenaltyBps,
            status: DepositStatus.Active
        });

        _reserveInterest(
            depositId,
            _calculateInterest(amount, plan.aprBps, plan.tenorDays)
        );

        token.safeTransferFrom(msg.sender, address(this), amount);
        _safeMint(msg.sender, depositId);

        emit DepositOpened(
            depositId,
            msg.sender,
            planId,
            amount,
            maturityAt,
            plan.aprBps
        );
    }

    /**
     * @notice Settles an active deposit at or after its maturity timestamp.
     * @dev Principal is paid from SavingCore before positive interest is
     *      requested from the authorized VaultManager. If the vault lacks
     *      sufficient liquidity, the full interest amount is deferred for
     *      the current NFT owner to claim later. Other vault failures revert
     *      the complete settlement. The NFT is retained as a historical
     *      certificate.
     * @param depositId Existing active deposit identifier.
     */
    function withdrawAtMaturity(
        uint256 depositId
    ) external whenNotPaused nonReentrant {
        _requireDepositExists(depositId);

        Deposit storage deposit = _deposits[depositId];

        if (deposit.status != DepositStatus.Active) {
            revert DepositNotActive(depositId, deposit.status);
        }

        address currentOwner = ownerOf(depositId);

        if (_msgSender() != currentOwner) {
            revert NotDepositOwner(
                depositId,
                _msgSender(),
                currentOwner
            );
        }

        if (block.timestamp < deposit.maturityAt) {
            revert DepositNotMatured(
                depositId,
                deposit.maturityAt,
                block.timestamp
            );
        }

        uint256 principal = deposit.principal;
        uint256 calculatedInterest = _calculateInterest(
            principal,
            deposit.aprBpsAtOpen,
            deposit.tenorDays
        );
        uint256 paidInterest;

        deposit.status = DepositStatus.Withdrawn;

        token.safeTransfer(currentOwner, principal);

        if (calculatedInterest != 0) {
            _decreaseReservedInterest(calculatedInterest);

            try vaultManager.payInterest(
                currentOwner,
                calculatedInterest
            ) {
                paidInterest = calculatedInterest;

                emit ReservedInterestConsumed(
                    depositId,
                    calculatedInterest,
                    totalReservedInterest
                );
            } catch (bytes memory reason) {
                bytes4 selector;

                if (reason.length >= 4) {
                    assembly {
                        selector := mload(add(reason, 32))
                    }
                }

                if (
                    selector !=
                    VaultManager.InsufficientVaultBalance.selector
                ) {
                    assembly {
                        revert(add(reason, 32), mload(reason))
                    }
                }

                totalReservedInterest += calculatedInterest;
                pendingInterest[depositId] = calculatedInterest;
                interestClaimant[depositId] = currentOwner;

                emit InterestDeferred(
                    depositId,
                    currentOwner,
                    calculatedInterest
                );
            }
        }

        emit Withdrawn(
            depositId,
            currentOwner,
            principal,
            paidInterest,
            false
        );
    }

    /**
     * @notice Claims all deferred maturity interest for a settled deposit.
     * @dev Only the claimant snapshotted at maturity settlement may call.
     *      Pending state is cleared before the external vault interaction.
     *      A failed payout reverts and restores the outstanding amount.
     * @param depositId Settled deposit with outstanding deferred interest.
     */
    function claimPendingInterest(
        uint256 depositId
    ) external whenNotPaused nonReentrant {
        _requireDepositExists(depositId);

        uint256 amount = pendingInterest[depositId];

        if (amount == 0) {
            revert NoPendingInterest(depositId);
        }

        address claimant = interestClaimant[depositId];

        if (_msgSender() != claimant) {
            revert NotInterestClaimant(
                depositId,
                _msgSender(),
                claimant
            );
        }

        pendingInterest[depositId] = 0;
        _consumeReservedInterest(depositId, amount);

        vaultManager.payInterest(claimant, amount);

        emit PendingInterestClaimed(
            depositId,
            claimant,
            amount
        );
    }

    /**
     * @notice Settles an active deposit before its maturity timestamp.
     * @dev No interest is paid. The snapshotted penalty is transferred from
     *      principal to the current VaultManager fee receiver, and the
     *      remaining principal is returned to the direct current NFT owner.
     *      The NFT is retained as a historical certificate.
     * @param depositId Existing active deposit identifier.
     */
    function earlyWithdraw(
        uint256 depositId
    ) external whenNotPaused nonReentrant {
        _requireDepositExists(depositId);

        Deposit storage deposit = _deposits[depositId];

        if (deposit.status != DepositStatus.Active) {
            revert DepositNotActive(depositId, deposit.status);
        }

        address currentOwner = ownerOf(depositId);

        if (_msgSender() != currentOwner) {
            revert NotDepositOwner(
                depositId,
                _msgSender(),
                currentOwner
            );
        }

        if (block.timestamp >= deposit.maturityAt) {
            revert DepositAlreadyMatured(
                depositId,
                deposit.maturityAt,
                block.timestamp
            );
        }

        uint256 principal = deposit.principal;
        uint256 penalty = Math.mulDiv(
            principal,
            deposit.penaltyBpsAtOpen,
            BPS_DENOMINATOR
        );
        uint256 userReceive = principal - penalty;
        uint256 reservedInterest = _calculateInterest(
            principal,
            deposit.aprBpsAtOpen,
            deposit.tenorDays
        );
        address feeReceiver = vaultManager.feeReceiver();

        deposit.status = DepositStatus.Withdrawn;
        _releaseReservedInterest(depositId, reservedInterest);

        if (userReceive != 0) {
            token.safeTransfer(currentOwner, userReceive);
        }

        if (penalty != 0) {
            token.safeTransfer(feeReceiver, penalty);
        }

        emit Withdrawn(
            depositId,
            currentOwner,
            principal,
            0,
            true
        );
    }
    /**
     * @notice Manually renews an active matured deposit during its grace period.
     * @dev The old principal remains in SavingCore. Positive old-term interest
     *      is funded by VaultManager directly into SavingCore before the new
     *      ERC721 certificate is safely minted. The old certificate is retained
     *      as historical evidence.
     * @param depositId Existing active deposit identifier.
     * @param newPlanId Enabled saving plan selected for the new term.
     * @return newDepositId Identifier of the newly created active deposit.
     */
    function manualRenew(
        uint256 depositId,
        uint256 newPlanId
    )
        external
        whenNotPaused
        nonReentrant
        returns (uint256 newDepositId)
    {
        _requireDepositExists(depositId);

        Deposit storage oldDeposit = _deposits[depositId];

        if (oldDeposit.status != DepositStatus.Active) {
            revert DepositNotActive(depositId, oldDeposit.status);
        }

        address currentOwner = ownerOf(depositId);

        if (_msgSender() != currentOwner) {
            revert NotDepositOwner(
                depositId,
                _msgSender(),
                currentOwner
            );
        }

        if (block.timestamp < oldDeposit.maturityAt) {
            revert DepositNotMatured(
                depositId,
                oldDeposit.maturityAt,
                block.timestamp
            );
        }

        uint256 graceEndsAt =
            oldDeposit.maturityAt + GRACE_PERIOD;

        if (block.timestamp >= graceEndsAt) {
            revert ManualRenewalWindowClosed(
                depositId,
                graceEndsAt,
                block.timestamp
            );
        }

        _requirePlanExists(newPlanId);

        Plan memory newPlan = _plans[newPlanId];

        if (!newPlan.enabled) {
            revert PlanNotEnabled(newPlanId);
        }

        uint256 interest = _calculateInterest(
            oldDeposit.principal,
            oldDeposit.aprBpsAtOpen,
            oldDeposit.tenorDays
        );
        uint256 newPrincipal =
            oldDeposit.principal + interest;
        uint256 newReservedInterest = _calculateInterest(
            newPrincipal,
            newPlan.aprBps,
            newPlan.tenorDays
        );

        if (
            newPlan.minDeposit != 0 &&
            newPrincipal < newPlan.minDeposit
        ) {
            revert DepositBelowMinimum(
                newPrincipal,
                newPlan.minDeposit
            );
        }

        if (
            newPlan.maxDeposit != 0 &&
            newPrincipal > newPlan.maxDeposit
        ) {
            revert DepositAboveMaximum(
                newPrincipal,
                newPlan.maxDeposit
            );
        }

        uint256 startedAt = block.timestamp;
        uint256 maturityAt =
            startedAt + newPlan.tenorDays * 1 days;

        newDepositId = ++depositCount;

        oldDeposit.status = DepositStatus.ManualRenewed;

        _deposits[newDepositId] = Deposit({
            planId: newPlanId,
            principal: newPrincipal,
            startedAt: startedAt,
            maturityAt: maturityAt,
            tenorDays: newPlan.tenorDays,
            aprBpsAtOpen: newPlan.aprBps,
            penaltyBpsAtOpen:
                newPlan.earlyWithdrawPenaltyBps,
            status: DepositStatus.Active
        });

        _consumeReservedInterest(depositId, interest);
        _reserveInterest(newDepositId, newReservedInterest);

        if (interest != 0) {
            vaultManager.payInterest(
                address(this),
                interest
            );
        }

        _safeMint(currentOwner, newDepositId);

        emit Renewed(
            depositId,
            newDepositId,
            newPrincipal,
            newPlanId
        );
    }

    /**
     * @notice Permissionlessly renews an active deposit after its grace period.
     * @dev The new term starts at the execution timestamp and preserves the
     *      old plan identifier, tenor, APR, and penalty snapshots. Exactly one
     *      new term is created per successful call. Positive old-term interest
     *      is funded by VaultManager directly into SavingCore before the new
     *      ERC721 certificate is safely minted to the current old-NFT owner.
     *      The caller receives no ownership solely for triggering this function.
     * @param depositId Existing active deposit identifier.
     * @return newDepositId Identifier of the newly created active deposit.
     */
    function autoRenew(
        uint256 depositId
    )
        external
        whenNotPaused
        nonReentrant
        returns (uint256 newDepositId)
    {
        _requireDepositExists(depositId);

        Deposit storage oldDeposit = _deposits[depositId];

        if (oldDeposit.status != DepositStatus.Active) {
            revert DepositNotActive(depositId, oldDeposit.status);
        }

        uint256 graceEndsAt =
            oldDeposit.maturityAt + GRACE_PERIOD;

        if (block.timestamp < graceEndsAt) {
            revert AutoRenewalTooEarly(
                depositId,
                graceEndsAt,
                block.timestamp
            );
        }

        address currentOwner = ownerOf(depositId);
        uint256 planId = oldDeposit.planId;
        uint256 oldPrincipal = oldDeposit.principal;
        uint256 tenorDays = oldDeposit.tenorDays;
        uint256 aprBpsAtOpen = oldDeposit.aprBpsAtOpen;
        uint256 penaltyBpsAtOpen =
            oldDeposit.penaltyBpsAtOpen;

        uint256 interest = _calculateInterest(
            oldPrincipal,
            aprBpsAtOpen,
            tenorDays
        );
        uint256 newPrincipal = oldPrincipal + interest;
        uint256 newReservedInterest = _calculateInterest(
            newPrincipal,
            aprBpsAtOpen,
            tenorDays
        );
        uint256 startedAt = block.timestamp;
        uint256 maturityAt =
            startedAt + tenorDays * 1 days;

        newDepositId = ++depositCount;

        oldDeposit.status = DepositStatus.AutoRenewed;

        _deposits[newDepositId] = Deposit({
            planId: planId,
            principal: newPrincipal,
            startedAt: startedAt,
            maturityAt: maturityAt,
            tenorDays: tenorDays,
            aprBpsAtOpen: aprBpsAtOpen,
            penaltyBpsAtOpen: penaltyBpsAtOpen,
            status: DepositStatus.Active
        });

        _consumeReservedInterest(depositId, interest);
        _reserveInterest(newDepositId, newReservedInterest);

        if (interest != 0) {
            vaultManager.payInterest(
                address(this),
                interest
            );
        }

        _safeMint(currentOwner, newDepositId);

        emit Renewed(
            depositId,
            newDepositId,
            newPrincipal,
            planId
        );
    }

    /**
     * @notice Returns an existing deposit and its snapshotted terms.
     * @param depositId Existing deposit identifier.
     */
    function getDeposit(
        uint256 depositId
    ) external view returns (Deposit memory) {
        _requireDepositExists(depositId);
        return _deposits[depositId];
    }

    /**
     * @notice Pauses future pause-protected SavingCore financial entry points.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses SavingCore.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Records a nonzero interest liability.
     */
    function _reserveInterest(
        uint256 depositId,
        uint256 amount
    ) internal {
        if (amount == 0) {
            return;
        }

        totalReservedInterest += amount;

        emit InterestReserved(
            depositId,
            amount,
            totalReservedInterest
        );
    }

    /**
     * @dev Releases a nonzero liability without paying interest.
     */
    function _releaseReservedInterest(
        uint256 depositId,
        uint256 amount
    ) internal {
        if (amount == 0) {
            return;
        }

        _decreaseReservedInterest(amount);

        emit ReservedInterestReleased(
            depositId,
            amount,
            totalReservedInterest
        );
    }

    /**
     * @dev Consumes a nonzero liability through payment or compounding.
     */
    function _consumeReservedInterest(
        uint256 depositId,
        uint256 amount
    ) internal {
        if (amount == 0) {
            return;
        }

        _decreaseReservedInterest(amount);

        emit ReservedInterestConsumed(
            depositId,
            amount,
            totalReservedInterest
        );
    }

    /**
     * @dev Decreases aggregate liabilities with an explicit invariant check.
     */
    function _decreaseReservedInterest(uint256 amount) internal {
        uint256 reserved = totalReservedInterest;

        if (reserved < amount) {
            revert InsufficientReservedInterest(reserved, amount);
        }

        totalReservedInterest = reserved - amount;
    }

    /**
     * @dev Calculates one term of simple interest with floor rounding.
     */
    function _calculateInterest(
        uint256 principal,
        uint256 aprBps,
        uint256 tenorDays
    ) internal pure returns (uint256) {
        uint256 tenorSeconds = tenorDays * 1 days;

        return Math.mulDiv(
            principal,
            aprBps * tenorSeconds,
            365 days * BPS_DENOMINATOR
        );
    }

    /**
     * @dev Reverts unless planId identifies an existing plan.
     */
    function _requirePlanExists(uint256 planId) internal view {
        if (planId == 0 || planId > planCount) {
            revert InvalidPlanId(planId);
        }
    }

    /**
     * @dev Reverts unless depositId identifies an existing deposit.
     */
    function _requireDepositExists(uint256 depositId) internal view {
        if (depositId == 0 || depositId > depositCount) {
            revert InvalidDepositId(depositId);
        }
    }

    /**
     * @dev Validates a saving-plan tenor.
     */
    function _validateTenor(uint256 tenorDays) internal pure {
        if (
            tenorDays < MIN_TENOR_DAYS ||
            tenorDays > MAX_TENOR_DAYS
        ) {
            revert InvalidTenorDays(tenorDays);
        }
    }

    /**
     * @dev Validates a saving-plan APR.
     */
    function _validateApr(uint256 aprBps) internal pure {
        if (aprBps < MIN_APR_BPS || aprBps > MAX_APR_BPS) {
            revert InvalidAprBps(aprBps);
        }
    }

    /**
     * @dev Validates a saving-plan early-withdrawal penalty.
     */
    function _validatePenalty(uint256 penaltyBps) internal pure {
        if (penaltyBps > MAX_PENALTY_BPS) {
            revert InvalidPenaltyBps(penaltyBps);
        }
    }

    /**
     * @dev Validates optional minimum and maximum deposit limits.
     */
    function _validateDepositRange(
        uint256 minDeposit,
        uint256 maxDeposit
    ) internal pure {
        if (
            minDeposit != 0 &&
            maxDeposit != 0 &&
            minDeposit > maxDeposit
        ) {
            revert InvalidDepositRange(minDeposit, maxDeposit);
        }
    }
}