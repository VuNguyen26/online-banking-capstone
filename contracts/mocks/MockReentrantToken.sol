// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Minimal SavingCore withdrawal interface used by this test mock.
 */
interface ISavingCoreWithdrawal {
    function earlyWithdraw(uint256 depositId) external;

    function withdrawAtMaturity(uint256 depositId) external;

    function manualRenew(
        uint256 depositId,
        uint256 newPlanId
    ) external returns (uint256 newDepositId);
}

/**
 * @title MockReentrantToken
 * @notice Test-only ERC20 that attempts a callback while SavingCore pays principal.
 * @dev The callback error is caught so the original transfer may continue.
 */
contract MockReentrantToken is ERC20 {
    /**
     * @dev Forced test-only transfer failure for one configured recipient.
     */
    error ForcedTransferFailure(address recipient);
    address public savingCore;
    address public reentryTrigger;
    uint256 public reentryDepositId;
    uint256 public reentryNewPlanId;

    bool public reentryEnabled;
    bool public reenterEarlyWithdrawal;
    bool public reenterManualRenewal;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    bytes4 public lastReentryErrorSelector;

    address public failingRecipient;
    bool public transferFailureEnabled;

    constructor() ERC20("Mock Reentrant USD Coin", "mrUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Configures one callback attempt during a SavingCore transfer.
     */
    function configureReentry(
        address savingCore_,
        uint256 depositId_,
        bool enabled
    ) external {
        savingCore = savingCore_;
        reentryTrigger = savingCore_;
        reentryDepositId = depositId_;
        reentryNewPlanId = 0;
        reentryEnabled = enabled;
        reenterEarlyWithdrawal = false;
        reenterManualRenewal = false;
        reentryAttempted = false;
        reentrySucceeded = false;
        lastReentryErrorSelector = bytes4(0);
    }

    /**
     * @notice Configures a callback into earlyWithdraw during token transfer.
     * @dev Used to cover the nonReentrant rejection path of earlyWithdraw.
     */
    function configureEarlyWithdrawReentry(
        address savingCore_,
        uint256 depositId_,
        bool enabled
    ) external {
        savingCore = savingCore_;
        reentryTrigger = savingCore_;
        reentryDepositId = depositId_;
        reentryNewPlanId = 0;
        reentryEnabled = enabled;
        reenterEarlyWithdrawal = true;
        reenterManualRenewal = false;
        reentryAttempted = false;
        reentrySucceeded = false;
        lastReentryErrorSelector = bytes4(0);
    }

    /**
     * @notice Configures a callback into manualRenew during token transfer.
     * @dev The trigger is normally VaultManager because it transfers renewal
     *      interest into SavingCore.
     */
    function configureManualRenewReentry(
        address savingCore_,
        address reentryTrigger_,
        uint256 depositId_,
        uint256 newPlanId_,
        bool enabled
    ) external {
        savingCore = savingCore_;
        reentryTrigger = reentryTrigger_;
        reentryDepositId = depositId_;
        reentryNewPlanId = newPlanId_;
        reentryEnabled = enabled;
        reenterEarlyWithdrawal = false;
        reenterManualRenewal = true;
        reentryAttempted = false;
        reentrySucceeded = false;
        lastReentryErrorSelector = bytes4(0);
    }

    /**
     * @notice Configures a test-only failure for transfers to one recipient.
     * @dev Used to verify complete rollback when a later settlement transfer
     *      fails after an earlier transfer has already executed.
     */
    function configureTransferFailure(
        address savingCore_,
        address recipient_,
        bool enabled
    ) external {
        savingCore = savingCore_;
        failingRecipient = recipient_;
        transferFailureEnabled = enabled;
    }

    /**
     * @dev Attempts reentrancy only when SavingCore transfers principal.
     */
    function transfer(
        address to,
        uint256 value
    ) public override returns (bool) {
        if (
            transferFailureEnabled &&
            _msgSender() == savingCore &&
            to == failingRecipient
        ) {
            revert ForcedTransferFailure(to);
        }

        bool success = super.transfer(to, value);

        if (
            reentryEnabled &&
            _msgSender() == reentryTrigger
        ) {
            reentryEnabled = false;
            reentryAttempted = true;

            if (reenterManualRenewal) {
                try ISavingCoreWithdrawal(savingCore)
                    .manualRenew(
                        reentryDepositId,
                        reentryNewPlanId
                    )
                returns (uint256) {
                    reentrySucceeded = true;
                } catch (bytes memory reason) {
                    bytes4 selector;

                    assembly {
                        selector := mload(add(reason, 32))
                    }

                    lastReentryErrorSelector = selector;
                }
            } else if (reenterEarlyWithdrawal) {
                try ISavingCoreWithdrawal(savingCore)
                    .earlyWithdraw(reentryDepositId)
                {
                    reentrySucceeded = true;
                } catch (bytes memory reason) {
                    bytes4 selector;

                    assembly {
                        selector := mload(add(reason, 32))
                    }

                    lastReentryErrorSelector = selector;
                }
            } else {
                try ISavingCoreWithdrawal(savingCore)
                    .withdrawAtMaturity(reentryDepositId)
                {
                    reentrySucceeded = true;
                } catch (bytes memory reason) {
                    bytes4 selector;

                    assembly {
                        selector := mload(add(reason, 32))
                    }

                    lastReentryErrorSelector = selector;
                }
            }
        }

        return success;
    }
}