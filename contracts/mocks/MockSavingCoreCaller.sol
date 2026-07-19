// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @dev Minimal VaultManager payout interface used only by the test mock.
 */
interface IVaultManagerPayout {
    function payInterest(address recipient, uint256 amount) external;
}

/**
 * @title MockSavingCoreCaller
 * @notice Test-only contract used to call VaultManager as an authorized contract.
 * @dev This mock does not implement saving plans, deposits, NFTs, or SavingCore business logic.
 */
contract MockSavingCoreCaller {
    /**
     * @notice Requests an interest payout from a VaultManager-compatible contract.
     * @param vault VaultManager contract address.
     * @param recipient Address that receives the interest.
     * @param amount Interest amount.
     */
    function requestInterest(
        address vault,
        address recipient,
        uint256 amount
    ) external {
        IVaultManagerPayout(vault).payInterest(recipient, amount);
    }
}