// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {VaultManager} from "./VaultManager.sol";

/**
 * @title SavingCore
 * @notice Central SafeBank contract for saving-plan and deposit management.
 * @dev Phase 4 implements only the contract foundation and saving-plan
 *      administration. Principal custody, deposits, certificate minting,
 *      withdrawals, renewals, C1, and C2 are intentionally deferred.
 */
contract SavingCore is ERC721, Ownable2Step, Pausable, ReentrancyGuard {
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

    mapping(uint256 planId => Plan plan) private _plans;

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
     * @dev Reverts unless planId identifies an existing plan.
     */
    function _requirePlanExists(uint256 planId) internal view {
        if (planId == 0 || planId > planCount) {
            revert InvalidPlanId(planId);
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