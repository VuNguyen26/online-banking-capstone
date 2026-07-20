// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Minimal SavingCore maturity-withdrawal interface used by this test mock.
 */
interface ISavingCoreMaturityWithdrawal {
    function withdrawAtMaturity(uint256 depositId) external;
}

/**
 * @title MockReentrantToken
 * @notice Test-only ERC20 that attempts a callback while SavingCore pays principal.
 * @dev The callback error is caught so the original transfer may continue.
 */
contract MockReentrantToken is ERC20 {
    address public savingCore;
    uint256 public reentryDepositId;

    bool public reentryEnabled;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    bytes4 public lastReentryErrorSelector;

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
        reentryDepositId = depositId_;
        reentryEnabled = enabled;
        reentryAttempted = false;
        reentrySucceeded = false;
        lastReentryErrorSelector = bytes4(0);
    }

    /**
     * @dev Attempts reentrancy only when SavingCore transfers principal.
     */
    function transfer(
        address to,
        uint256 value
    ) public override returns (bool) {
        bool success = super.transfer(to, value);

        if (reentryEnabled && _msgSender() == savingCore) {
            reentryEnabled = false;
            reentryAttempted = true;

            try ISavingCoreMaturityWithdrawal(savingCore)
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

        return success;
    }
}