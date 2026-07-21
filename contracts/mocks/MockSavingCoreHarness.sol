// SPDX-License-Identifier: MIT
/**
 * @file MockSavingCoreHarness.sol
 * @notice Test-only harness for unreachable internal SavingCore invariants.
 */

pragma solidity 0.8.28;

import {SavingCore} from "../SavingCore.sol";

contract MockSavingCoreHarness is SavingCore {
    constructor(
        address token_,
        address vaultManager_,
        address initialOwner_
    ) SavingCore(token_, vaultManager_, initialOwner_) {}

    function exposeDecreaseReservedInterest(
        uint256 amount
    ) external {
        _decreaseReservedInterest(amount);
    }
}