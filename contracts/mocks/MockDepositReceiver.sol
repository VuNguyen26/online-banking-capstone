// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @dev Minimal SavingCore deposit interface used only by test helpers.
 */
interface ISavingCoreDeposit {
    function openDeposit(
        uint256 planId,
        uint256 amount
    ) external returns (uint256 depositId);
}

/**
 * @title MockDepositReceiver
 * @notice Test-only smart-contract depositor that can receive ERC721 certificates.
 * @dev It may optionally attempt to reenter SavingCore from the safe-mint callback.
 */
contract MockDepositReceiver is IERC721Receiver {
    error ApprovalFailed();

    IERC20 public immutable token;
    ISavingCoreDeposit public immutable savingCore;

    bool public reentryRequested;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    uint256 public reentryPlanId;
    uint256 public reentryAmount;

    bytes4 public lastReentryErrorSelector;

    address public callbackOperator;
    address public callbackFrom;
    uint256 public callbackTokenId;
    bytes public callbackData;

    /**
     * @param tokenAddress ERC20 principal token.
     * @param savingCoreAddress SavingCore contract under test.
     */
    constructor(
        address tokenAddress,
        address savingCoreAddress
    ) {
        token = IERC20(tokenAddress);
        savingCore = ISavingCoreDeposit(savingCoreAddress);
    }

    /**
     * @notice Approves and opens a deposit owned by this contract.
     * @param planId Saving-plan identifier.
     * @param amount Principal amount.
     * @param attemptReentry Whether the NFT callback should try to reenter.
     */
    function openDeposit(
        uint256 planId,
        uint256 amount,
        bool attemptReentry
    ) external returns (uint256 depositId) {
        reentryRequested = attemptReentry;
        reentryAttempted = false;
        reentrySucceeded = false;
        reentryPlanId = planId;
        reentryAmount = amount;
        lastReentryErrorSelector = bytes4(0);

        if (!token.approve(address(savingCore), amount)) {
            revert ApprovalFailed();
        }

        depositId = savingCore.openDeposit(planId, amount);
    }

    /**
     * @notice Accepts an ERC721 certificate and optionally tries reentrancy.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        callbackOperator = operator;
        callbackFrom = from;
        callbackTokenId = tokenId;
        callbackData = data;

        bool shouldAttemptReentry = reentryRequested;
        reentryRequested = false;

        if (shouldAttemptReentry) {
            reentryAttempted = true;

            try savingCore.openDeposit(
                reentryPlanId,
                reentryAmount
            ) returns (uint256) {
                reentrySucceeded = true;
            } catch (bytes memory reason) {
                lastReentryErrorSelector =
                    _errorSelector(reason);
            }
        }

        return IERC721Receiver.onERC721Received.selector;
    }

    /**
     * @dev Extracts the first four bytes of encoded revert data.
     */
    function _errorSelector(
        bytes memory reason
    ) private pure returns (bytes4 selector) {
        if (reason.length < 4) {
            return bytes4(0);
        }

        assembly {
            selector := mload(add(reason, 32))
        }
    }
}

/**
 * @title MockNonERC721Receiver
 * @notice Test-only depositor that cannot accept safely minted ERC721 tokens.
 * @dev SavingCore principal transfer and deposit state must roll back when
 *      certificate delivery to this contract fails.
 */
contract MockNonERC721Receiver {
    error ApprovalFailed();

    IERC20 public immutable token;
    ISavingCoreDeposit public immutable savingCore;

    constructor(
        address tokenAddress,
        address savingCoreAddress
    ) {
        token = IERC20(tokenAddress);
        savingCore = ISavingCoreDeposit(savingCoreAddress);
    }

    /**
     * @notice Approves and attempts to open a deposit.
     */
    function openDeposit(
        uint256 planId,
        uint256 amount
    ) external returns (uint256 depositId) {
        if (!token.approve(address(savingCore), amount)) {
            revert ApprovalFailed();
        }

        depositId = savingCore.openDeposit(planId, amount);
    }
}