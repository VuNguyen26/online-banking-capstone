// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @dev Minimal reserve interface exposed by the authorized SavingCore.
 */
interface ISavingCoreReserve {
    function totalReservedInterest() external view returns (uint256);
}

/**
 * @title VaultManager
 * @notice Holds bank-funded ERC20 liquidity used to pay deposit interest.
 * @dev
 * - This contract never holds or manages user deposit principal.
 * - Only the one-time authorized SavingCore contract may request interest payouts.
 * - Privileged administration uses OpenZeppelin Ownable2Step.
 * - Bonus C2 reads aggregate interest liabilities from the authorized
 *   SavingCore and protects reserved vault liquidity from owner withdrawal.
 * - The contract is non-upgradeable.
 */
contract VaultManager is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * @dev A required address was the zero address.
     */
    error InvalidAddress();

    /**
     * @dev A token amount must be greater than zero.
     */
    error InvalidAmount();

    /**
     * @dev The supplied SavingCore address has no deployed bytecode.
     */
    error AddressIsNotContract(address account);

    /**
     * @dev SavingCore has already been permanently configured.
     */
    error SavingCoreAlreadyAuthorized(address currentSavingCore);

    /**
     * @dev The caller is not the authorized SavingCore contract.
     */
    error UnauthorizedSavingCore(address caller);

    /**
     * @dev The vault has insufficient transferable liquidity.
     */
    error InsufficientVaultBalance(uint256 available, uint256 required);

    /**
     * @notice Emitted when the owner funds the vault.
     */
    event VaultFunded(address indexed funder, uint256 amount);

    /**
     * @notice Emitted when the current owner withdraws vault liquidity.
     */
    event VaultWithdrawn(address indexed recipient, uint256 amount);

    /**
     * @notice Emitted when the early-withdrawal fee receiver changes.
     */
    event FeeReceiverUpdated(
        address indexed previousFeeReceiver,
        address indexed newFeeReceiver
    );

    /**
     * @notice Emitted when SavingCore is permanently authorized.
     */
    event SavingCoreAuthorized(address indexed savingCore);

    /**
     * @notice Emitted when SavingCore requests a successful interest payout.
     */
    event InterestPaid(
        address indexed savingCore,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice ERC20 token used as the bank-funded interest asset.
     */
    IERC20 public immutable token;

    /**
     * @notice Address that receives early-withdrawal penalties from SavingCore.
     */
    address public feeReceiver;

    /**
     * @notice One-time authorized SavingCore contract.
     */
    address public savingCore;

    /**
     * @dev Restricts interest payouts to the configured SavingCore contract.
     */
    modifier onlySavingCore() {
        if (_msgSender() != savingCore) {
            revert UnauthorizedSavingCore(_msgSender());
        }
        _;
    }

    /**
     * @param token_ ERC20 token used for vault liquidity.
     * @param initialOwner_ Initial bank administrator.
     * @param initialFeeReceiver_ Initial early-withdrawal fee receiver.
     */
    constructor(
        address token_,
        address initialOwner_,
        address initialFeeReceiver_
    ) Ownable(initialOwner_) {
        if (
            token_ == address(0) ||
            initialFeeReceiver_ == address(0)
        ) {
            revert InvalidAddress();
        }

        token = IERC20(token_);
        feeReceiver = initialFeeReceiver_;
    }

    /**
     * @notice Permanently authorizes the SavingCore contract.
     * @dev This operation may succeed only once.
     * @param savingCore_ Deployed SavingCore contract address.
     */
    function authorizeSavingCore(address savingCore_) external onlyOwner {
        if (savingCore != address(0)) {
            revert SavingCoreAlreadyAuthorized(savingCore);
        }

        if (savingCore_ == address(0)) {
            revert InvalidAddress();
        }

        if (savingCore_.code.length == 0) {
            revert AddressIsNotContract(savingCore_);
        }

        savingCore = savingCore_;

        emit SavingCoreAuthorized(savingCore_);
    }

    /**
     * @notice Transfers bank-funded interest liquidity into the vault.
     * @dev Funding remains available while paused so liquidity can be restored.
     * @param amount Token amount transferred from the owner.
     */
    function fundVault(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        token.safeTransferFrom(_msgSender(), address(this), amount);

        emit VaultFunded(_msgSender(), amount);
    }

    /**
     * @notice Withdraws unreserved vault liquidity to the current owner.
     * @dev The withdrawal cannot exceed current available liquidity.
     * @param amount Token amount withdrawn to the current owner.
     */
    function withdrawVault(
        uint256 amount
    ) external onlyOwner whenNotPaused nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        uint256 available = availableLiquidity();

        if (available < amount) {
            revert InsufficientVaultBalance(available, amount);
        }

        address recipient = owner();

        token.safeTransfer(recipient, amount);

        emit VaultWithdrawn(recipient, amount);
    }

    /**
     * @notice Pays interest from the vault to a specified recipient.
     * @dev Only the authorized SavingCore may call this function.
     * @param recipient Address receiving interest.
     * @param amount Interest amount.
     */
    function payInterest(
        address recipient,
        uint256 amount
    ) external onlySavingCore whenNotPaused nonReentrant {
        if (recipient == address(0)) {
            revert InvalidAddress();
        }

        if (amount == 0) {
            revert InvalidAmount();
        }

        uint256 available = token.balanceOf(address(this));

        if (available < amount) {
            revert InsufficientVaultBalance(available, amount);
        }

        token.safeTransfer(recipient, amount);

        emit InterestPaid(_msgSender(), recipient, amount);
    }

    /**
     * @notice Updates the address that receives early-withdrawal penalties.
     * @param newFeeReceiver New nonzero fee receiver.
     */
    function setFeeReceiver(address newFeeReceiver) external onlyOwner {
        if (newFeeReceiver == address(0)) {
            revert InvalidAddress();
        }

        address previousFeeReceiver = feeReceiver;
        feeReceiver = newFeeReceiver;

        emit FeeReceiverUpdated(previousFeeReceiver, newFeeReceiver);
    }

    /**
     * @notice Pauses interest payouts and owner withdrawals.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Restores normal interest payouts and owner withdrawals.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Returns the actual ERC20 balance currently held by the vault.
     */
    function vaultBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice Returns aggregate interest liabilities recorded by SavingCore.
     * @dev Returns zero before a SavingCore contract is authorized.
     */
    function totalReservedInterest() public view returns (uint256) {
        address configuredSavingCore = savingCore;

        if (configuredSavingCore == address(0)) {
            return 0;
        }

        return
            ISavingCoreReserve(configuredSavingCore)
                .totalReservedInterest();
    }

    /**
     * @notice Returns liquidity that the administrator may withdraw.
     * @dev Uses saturating subtraction when liabilities exceed the balance.
     */
    function availableLiquidity() public view returns (uint256) {
        uint256 balance = token.balanceOf(address(this));
        uint256 reserved = totalReservedInterest();

        if (balance <= reserved) {
            return 0;
        }

        return balance - reserved;
    }

    /**
     * @notice Returns liabilities not currently covered by vault tokens.
     */
    function fundingShortfall() external view returns (uint256) {
        uint256 balance = token.balanceOf(address(this));
        uint256 reserved = totalReservedInterest();

        if (reserved <= balance) {
            return 0;
        }

        return reserved - balance;
    }
}