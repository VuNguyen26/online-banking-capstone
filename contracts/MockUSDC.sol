// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mock USD Coin
/// @notice TEST-ONLY ERC20 token used by the SafeBank Capstone for local testing and demonstrations.
/// @dev This token has no real-world value, backing, redemption mechanism, or production stablecoin guarantees.
///      Minting is intentionally permissionless so tests and demo accounts can obtain tokens easily.
contract MockUSDC is ERC20 {
    /// @notice Creates the mock token with the name "Mock USD Coin" and symbol "mUSDC".
    constructor() ERC20("Mock USD Coin", "mUSDC") {}

    /// @notice Returns the number of decimal places used by the token.
    /// @return The fixed decimal precision of 6.
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mints test tokens to an address.
    /// @dev Intentionally callable by any address for testing and demonstration only.
    ///      Minting to the zero address reverts through OpenZeppelin ERC20 validation.
    /// @param to Address receiving the newly minted tokens.
    /// @param amount Amount in the token's smallest unit, where 1 mUSDC equals 1,000,000 units.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
