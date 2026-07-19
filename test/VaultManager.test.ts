import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("VaultManager", function () {
  const amount = (value: string) => ethers.parseUnits(value, 6);

  async function deployVaultFixture() {
    const [
      owner,
      pendingOwner,
      feeReceiver,
      newFeeReceiver,
      recipient,
      other,
    ] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const token = await MockUSDC.deploy();
    await token.waitForDeployment();

    const VaultManager = await ethers.getContractFactory("VaultManager");
    const vault = await VaultManager.deploy(
      await token.getAddress(),
      owner.address,
      feeReceiver.address,
    );
    await vault.waitForDeployment();

    const MockSavingCoreCaller = await ethers.getContractFactory(
      "MockSavingCoreCaller",
    );
    const savingCore = await MockSavingCoreCaller.deploy();
    await savingCore.waitForDeployment();

    return {
      token,
      vault,
      savingCore,
      owner,
      pendingOwner,
      feeReceiver,
      newFeeReceiver,
      recipient,
      other,
    };
  }

  async function fundedVaultFixture() {
    const fixture = await deployVaultFixture();
    const fundingAmount = amount("1000");

    await fixture.token.mint(fixture.owner.address, fundingAmount);
    await fixture.token
      .connect(fixture.owner)
      .approve(await fixture.vault.getAddress(), fundingAmount);
    await fixture.vault.connect(fixture.owner).fundVault(fundingAmount);

    return {
      ...fixture,
      fundingAmount,
    };
  }

  async function authorizedFundedVaultFixture() {
    const fixture = await fundedVaultFixture();

    await fixture.vault
      .connect(fixture.owner)
      .authorizeSavingCore(await fixture.savingCore.getAddress());

    return fixture;
  }

  describe("Deployment", function () {
    it("stores the token, owner, and initial fee receiver", async function () {
      const { token, vault, owner, feeReceiver } =
        await loadFixture(deployVaultFixture);

      expect(await vault.token()).to.equal(await token.getAddress());
      expect(await vault.owner()).to.equal(owner.address);
      expect(await vault.feeReceiver()).to.equal(feeReceiver.address);
    });

    it("starts with no authorized SavingCore", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      expect(await vault.savingCore()).to.equal(ethers.ZeroAddress);
    });

    it("starts unpaused with a zero vault balance", async function () {
      const { vault } = await loadFixture(deployVaultFixture);

      expect(await vault.paused()).to.equal(false);
      expect(await vault.vaultBalance()).to.equal(0n);
    });

    it("rejects a zero token address", async function () {
      const { vault, owner, feeReceiver } =
        await loadFixture(deployVaultFixture);
      const VaultManager = await ethers.getContractFactory("VaultManager");

      await expect(
        VaultManager.deploy(
          ethers.ZeroAddress,
          owner.address,
          feeReceiver.address,
        ),
      ).to.be.revertedWithCustomError(vault, "InvalidAddress");
    });

    it("rejects a zero fee receiver", async function () {
      const { token, vault, owner } = await loadFixture(deployVaultFixture);
      const VaultManager = await ethers.getContractFactory("VaultManager");

      await expect(
        VaultManager.deploy(
          await token.getAddress(),
          owner.address,
          ethers.ZeroAddress,
        ),
      ).to.be.revertedWithCustomError(vault, "InvalidAddress");
    });

    it("rejects a zero initial owner through Ownable", async function () {
      const { token, vault, feeReceiver } =
        await loadFixture(deployVaultFixture);
      const VaultManager = await ethers.getContractFactory("VaultManager");

      await expect(
        VaultManager.deploy(
          await token.getAddress(),
          ethers.ZeroAddress,
          feeReceiver.address,
        ),
      )
        .to.be.revertedWithCustomError(vault, "OwnableInvalidOwner")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("Two-step ownership", function () {
    it("starts an ownership transfer without immediately changing owner", async function () {
      const { vault, owner, pendingOwner } =
        await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(owner).transferOwnership(pendingOwner.address),
      )
        .to.emit(vault, "OwnershipTransferStarted")
        .withArgs(owner.address, pendingOwner.address);

      expect(await vault.owner()).to.equal(owner.address);
      expect(await vault.pendingOwner()).to.equal(pendingOwner.address);
    });

    it("allows only the pending owner to accept ownership", async function () {
      const { vault, owner, pendingOwner, other } =
        await loadFixture(deployVaultFixture);

      await vault.connect(owner).transferOwnership(pendingOwner.address);

      await expect(vault.connect(other).acceptOwnership())
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await vault.owner()).to.equal(owner.address);
    });

    it("transfers ownership after the pending owner accepts", async function () {
      const { vault, owner, pendingOwner } =
        await loadFixture(deployVaultFixture);

      await vault.connect(owner).transferOwnership(pendingOwner.address);

      await expect(vault.connect(pendingOwner).acceptOwnership())
        .to.emit(vault, "OwnershipTransferred")
        .withArgs(owner.address, pendingOwner.address);

      expect(await vault.owner()).to.equal(pendingOwner.address);
      expect(await vault.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it("rejects ownership acceptance when the caller is not pending owner", async function () {
      const { vault, other } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(other).acceptOwnership())
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);
    });

    it("gives privileged authority to the new owner and removes it from the old owner", async function () {
      const { vault, owner, pendingOwner, newFeeReceiver } =
        await loadFixture(deployVaultFixture);

      await vault.connect(owner).transferOwnership(pendingOwner.address);
      await vault.connect(pendingOwner).acceptOwnership();

      await expect(
        vault.connect(owner).setFeeReceiver(newFeeReceiver.address),
      )
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(owner.address);

      await expect(
        vault.connect(pendingOwner).setFeeReceiver(newFeeReceiver.address),
      )
        .to.emit(vault, "FeeReceiverUpdated");

      expect(await vault.feeReceiver()).to.equal(newFeeReceiver.address);
    });

    it("withdraws liquidity to the current owner after ownership transfer", async function () {
      const { token, vault, owner, pendingOwner, fundingAmount } =
        await loadFixture(fundedVaultFixture);
      const withdrawAmount = amount("250");

      await vault.connect(owner).transferOwnership(pendingOwner.address);
      await vault.connect(pendingOwner).acceptOwnership();

      const newOwnerBalanceBefore = await token.balanceOf(
        pendingOwner.address,
      );

      await expect(
        vault.connect(pendingOwner).withdrawVault(withdrawAmount),
      )
        .to.emit(vault, "VaultWithdrawn")
        .withArgs(pendingOwner.address, withdrawAmount);

      expect(await token.balanceOf(pendingOwner.address)).to.equal(
        newOwnerBalanceBefore + withdrawAmount,
      );
      expect(await vault.vaultBalance()).to.equal(
        fundingAmount - withdrawAmount,
      );
    });
  });

  describe("SavingCore authorization", function () {
    it("allows the owner to authorize a deployed contract exactly once", async function () {
      const { vault, savingCore, owner } =
        await loadFixture(deployVaultFixture);
      const savingCoreAddress = await savingCore.getAddress();

      await expect(
        vault.connect(owner).authorizeSavingCore(savingCoreAddress),
      )
        .to.emit(vault, "SavingCoreAuthorized")
        .withArgs(savingCoreAddress);

      expect(await vault.savingCore()).to.equal(savingCoreAddress);
    });

    it("rejects authorization by a non-owner", async function () {
      const { vault, savingCore, other } =
        await loadFixture(deployVaultFixture);

      await expect(
        vault
          .connect(other)
          .authorizeSavingCore(await savingCore.getAddress()),
      )
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await vault.savingCore()).to.equal(ethers.ZeroAddress);
    });

    it("rejects the zero address", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(owner).authorizeSavingCore(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(vault, "InvalidAddress");

      expect(await vault.savingCore()).to.equal(ethers.ZeroAddress);
    });

    it("rejects an externally owned account", async function () {
      const { vault, owner, other } =
        await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(owner).authorizeSavingCore(other.address),
      )
        .to.be.revertedWithCustomError(
          vault,
          "AddressIsNotContract",
        )
        .withArgs(other.address);

      expect(await vault.savingCore()).to.equal(ethers.ZeroAddress);
    });

    it("rejects a second authorization and preserves the original address", async function () {
      const { vault, savingCore, owner } =
        await loadFixture(deployVaultFixture);

      const MockSavingCoreCaller = await ethers.getContractFactory(
        "MockSavingCoreCaller",
      );
      const secondSavingCore = await MockSavingCoreCaller.deploy();
      await secondSavingCore.waitForDeployment();

      const firstAddress = await savingCore.getAddress();
      const secondAddress = await secondSavingCore.getAddress();

      await vault.connect(owner).authorizeSavingCore(firstAddress);

      await expect(
        vault.connect(owner).authorizeSavingCore(secondAddress),
      )
        .to.be.revertedWithCustomError(
          vault,
          "SavingCoreAlreadyAuthorized",
        )
        .withArgs(firstAddress);

      expect(await vault.savingCore()).to.equal(firstAddress);
    });
  });

  describe("Fee receiver management", function () {
    it("allows the owner to update the fee receiver", async function () {
      const {
        vault,
        owner,
        feeReceiver,
        newFeeReceiver,
      } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(owner).setFeeReceiver(newFeeReceiver.address),
      )
        .to.emit(vault, "FeeReceiverUpdated")
        .withArgs(feeReceiver.address, newFeeReceiver.address);

      expect(await vault.feeReceiver()).to.equal(
        newFeeReceiver.address,
      );
    });

    it("rejects fee receiver updates by a non-owner", async function () {
      const {
        vault,
        feeReceiver,
        newFeeReceiver,
        other,
      } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(other).setFeeReceiver(newFeeReceiver.address),
      )
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await vault.feeReceiver()).to.equal(
        feeReceiver.address,
      );
    });

    it("rejects a zero fee receiver and preserves state", async function () {
      const { vault, owner, feeReceiver } =
        await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(owner).setFeeReceiver(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(vault, "InvalidAddress");

      expect(await vault.feeReceiver()).to.equal(
        feeReceiver.address,
      );
    });
  });

  describe("Vault funding", function () {
    it("allows the owner to fund the vault using approved tokens", async function () {
      const { token, vault, owner } =
        await loadFixture(deployVaultFixture);
      const fundingAmount = amount("1000");

      await token.mint(owner.address, fundingAmount);
      await token
        .connect(owner)
        .approve(await vault.getAddress(), fundingAmount);

      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const supplyBefore = await token.totalSupply();

      await expect(vault.connect(owner).fundVault(fundingAmount))
        .to.emit(vault, "VaultFunded")
        .withArgs(owner.address, fundingAmount);

      expect(await token.balanceOf(owner.address)).to.equal(
        ownerBalanceBefore - fundingAmount,
      );
      expect(await vault.vaultBalance()).to.equal(fundingAmount);
      expect(await token.totalSupply()).to.equal(supplyBefore);
    });

    it("rejects a zero funding amount", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(owner).fundVault(0))
        .to.be.revertedWithCustomError(vault, "InvalidAmount");

      expect(await vault.vaultBalance()).to.equal(0n);
    });

    it("rejects funding by a non-owner", async function () {
      const { token, vault, other } =
        await loadFixture(deployVaultFixture);
      const fundingAmount = amount("100");

      await token.mint(other.address, fundingAmount);
      await token
        .connect(other)
        .approve(await vault.getAddress(), fundingAmount);

      await expect(vault.connect(other).fundVault(fundingAmount))
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await vault.vaultBalance()).to.equal(0n);
      expect(await token.balanceOf(other.address)).to.equal(
        fundingAmount,
      );
    });

    it("reverts when the allowance is insufficient", async function () {
      const { token, vault, owner } =
        await loadFixture(deployVaultFixture);
      const fundingAmount = amount("100");

      await token.mint(owner.address, fundingAmount);

      await expect(vault.connect(owner).fundVault(fundingAmount))
        .to.be.revertedWithCustomError(
          token,
          "ERC20InsufficientAllowance",
        )
        .withArgs(await vault.getAddress(), 0n, fundingAmount);

      expect(await vault.vaultBalance()).to.equal(0n);
      expect(await token.balanceOf(owner.address)).to.equal(
        fundingAmount,
      );
    });

    it("reverts when the owner token balance is insufficient", async function () {
      const { token, vault, owner } =
        await loadFixture(deployVaultFixture);
      const fundingAmount = amount("100");

      await token
        .connect(owner)
        .approve(await vault.getAddress(), fundingAmount);

      await expect(vault.connect(owner).fundVault(fundingAmount))
        .to.be.revertedWithCustomError(
          token,
          "ERC20InsufficientBalance",
        )
        .withArgs(owner.address, 0n, fundingAmount);

      expect(await vault.vaultBalance()).to.equal(0n);
    });

    it("allows funding while the vault is paused", async function () {
      const { token, vault, owner } =
        await loadFixture(deployVaultFixture);
      const fundingAmount = amount("100");

      await token.mint(owner.address, fundingAmount);
      await token
        .connect(owner)
        .approve(await vault.getAddress(), fundingAmount);
      await vault.connect(owner).pause();

      await expect(vault.connect(owner).fundVault(fundingAmount))
        .to.emit(vault, "VaultFunded")
        .withArgs(owner.address, fundingAmount);

      expect(await vault.paused()).to.equal(true);
      expect(await vault.vaultBalance()).to.equal(fundingAmount);
    });

    it("reports direct ERC20 transfers through the actual token balance", async function () {
      const { token, vault, other } =
        await loadFixture(deployVaultFixture);
      const transferAmount = amount("75");

      await token.mint(other.address, transferAmount);
      await token
        .connect(other)
        .transfer(await vault.getAddress(), transferAmount);

      expect(await vault.vaultBalance()).to.equal(transferAmount);
    });
  });

  describe("Owner withdrawal", function () {
    it("allows the owner to withdraw available vault liquidity", async function () {
      const { token, vault, owner, fundingAmount } =
        await loadFixture(fundedVaultFixture);
      const withdrawAmount = amount("300");

      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const supplyBefore = await token.totalSupply();

      await expect(
        vault.connect(owner).withdrawVault(withdrawAmount),
      )
        .to.emit(vault, "VaultWithdrawn")
        .withArgs(owner.address, withdrawAmount);

      expect(await token.balanceOf(owner.address)).to.equal(
        ownerBalanceBefore + withdrawAmount,
      );
      expect(await vault.vaultBalance()).to.equal(
        fundingAmount - withdrawAmount,
      );
      expect(await token.totalSupply()).to.equal(supplyBefore);
    });

    it("allows withdrawing the exact full vault balance", async function () {
      const { token, vault, owner, fundingAmount } =
        await loadFixture(fundedVaultFixture);

      const ownerBalanceBefore = await token.balanceOf(owner.address);

      await vault.connect(owner).withdrawVault(fundingAmount);

      expect(await vault.vaultBalance()).to.equal(0n);
      expect(await token.balanceOf(owner.address)).to.equal(
        ownerBalanceBefore + fundingAmount,
      );
    });

    it("rejects withdrawal by a non-owner", async function () {
      const { token, vault, other, fundingAmount } =
        await loadFixture(fundedVaultFixture);

      const otherBalanceBefore = await token.balanceOf(other.address);

      await expect(
        vault.connect(other).withdrawVault(amount("100")),
      )
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
      expect(await token.balanceOf(other.address)).to.equal(
        otherBalanceBefore,
      );
    });

    it("rejects a zero withdrawal amount", async function () {
      const { vault, owner, fundingAmount } =
        await loadFixture(fundedVaultFixture);

      await expect(vault.connect(owner).withdrawVault(0))
        .to.be.revertedWithCustomError(vault, "InvalidAmount");

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
    });

    it("rejects withdrawal above the actual vault balance", async function () {
      const { vault, owner, fundingAmount } =
        await loadFixture(fundedVaultFixture);
      const requested = fundingAmount + 1n;

      await expect(vault.connect(owner).withdrawVault(requested))
        .to.be.revertedWithCustomError(
          vault,
          "InsufficientVaultBalance",
        )
        .withArgs(fundingAmount, requested);

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
    });

    it("blocks owner withdrawal while paused", async function () {
      const { vault, owner, fundingAmount } =
        await loadFixture(fundedVaultFixture);

      await vault.connect(owner).pause();

      await expect(
        vault.connect(owner).withdrawVault(amount("100")),
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
    });
  });

  describe("Interest payout", function () {
    it("allows only the authorized SavingCore contract to pay interest", async function () {
      const {
        token,
        vault,
        savingCore,
        recipient,
        fundingAmount,
      } = await loadFixture(authorizedFundedVaultFixture);
      const interest = amount("25");

      const recipientBalanceBefore = await token.balanceOf(
        recipient.address,
      );
      const supplyBefore = await token.totalSupply();

      await expect(
        savingCore.requestInterest(
          await vault.getAddress(),
          recipient.address,
          interest,
        ),
      )
        .to.emit(vault, "InterestPaid")
        .withArgs(
          await savingCore.getAddress(),
          recipient.address,
          interest,
        );

      expect(await token.balanceOf(recipient.address)).to.equal(
        recipientBalanceBefore + interest,
      );
      expect(await vault.vaultBalance()).to.equal(
        fundingAmount - interest,
      );
      expect(await token.totalSupply()).to.equal(supplyBefore);
    });

    it("rejects a payout request before SavingCore authorization", async function () {
      const {
        token,
        vault,
        savingCore,
        recipient,
        fundingAmount,
      } = await loadFixture(fundedVaultFixture);
      const interest = amount("10");

      const recipientBalanceBefore = await token.balanceOf(
        recipient.address,
      );

      await expect(
        savingCore.requestInterest(
          await vault.getAddress(),
          recipient.address,
          interest,
        ),
      )
        .to.be.revertedWithCustomError(
          vault,
          "UnauthorizedSavingCore",
        )
        .withArgs(await savingCore.getAddress());

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
      expect(await token.balanceOf(recipient.address)).to.equal(
        recipientBalanceBefore,
      );
    });

    it("rejects a direct payout call from the owner", async function () {
      const {
        token,
        vault,
        owner,
        recipient,
        fundingAmount,
      } = await loadFixture(authorizedFundedVaultFixture);
      const interest = amount("10");

      const recipientBalanceBefore = await token.balanceOf(
        recipient.address,
      );

      await expect(
        vault
          .connect(owner)
          .payInterest(recipient.address, interest),
      )
        .to.be.revertedWithCustomError(
          vault,
          "UnauthorizedSavingCore",
        )
        .withArgs(owner.address);

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
      expect(await token.balanceOf(recipient.address)).to.equal(
        recipientBalanceBefore,
      );
    });

    it("rejects a direct payout call from an unrelated account", async function () {
      const {
        vault,
        other,
        recipient,
        fundingAmount,
      } = await loadFixture(authorizedFundedVaultFixture);

      await expect(
        vault
          .connect(other)
          .payInterest(recipient.address, amount("10")),
      )
        .to.be.revertedWithCustomError(
          vault,
          "UnauthorizedSavingCore",
        )
        .withArgs(other.address);

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
    });

    it("rejects a zero payout recipient", async function () {
      const {
        vault,
        savingCore,
        fundingAmount,
      } = await loadFixture(authorizedFundedVaultFixture);

      await expect(
        savingCore.requestInterest(
          await vault.getAddress(),
          ethers.ZeroAddress,
          amount("10"),
        ),
      ).to.be.revertedWithCustomError(vault, "InvalidAddress");

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
    });

    it("rejects a zero payout amount", async function () {
      const {
        vault,
        savingCore,
        recipient,
        fundingAmount,
      } = await loadFixture(authorizedFundedVaultFixture);

      await expect(
        savingCore.requestInterest(
          await vault.getAddress(),
          recipient.address,
          0,
        ),
      ).to.be.revertedWithCustomError(vault, "InvalidAmount");

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
    });

    it("rejects a payout above the vault balance", async function () {
      const {
        token,
        vault,
        savingCore,
        recipient,
        fundingAmount,
      } = await loadFixture(authorizedFundedVaultFixture);
      const requested = fundingAmount + 1n;

      const recipientBalanceBefore = await token.balanceOf(
        recipient.address,
      );

      await expect(
        savingCore.requestInterest(
          await vault.getAddress(),
          recipient.address,
          requested,
        ),
      )
        .to.be.revertedWithCustomError(
          vault,
          "InsufficientVaultBalance",
        )
        .withArgs(fundingAmount, requested);

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
      expect(await token.balanceOf(recipient.address)).to.equal(
        recipientBalanceBefore,
      );
    });

    it("blocks interest payout while paused", async function () {
      const {
        token,
        vault,
        savingCore,
        owner,
        recipient,
        fundingAmount,
      } = await loadFixture(authorizedFundedVaultFixture);

      await vault.connect(owner).pause();

      const recipientBalanceBefore = await token.balanceOf(
        recipient.address,
      );

      await expect(
        savingCore.requestInterest(
          await vault.getAddress(),
          recipient.address,
          amount("10"),
        ),
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");

      expect(await vault.vaultBalance()).to.equal(fundingAmount);
      expect(await token.balanceOf(recipient.address)).to.equal(
        recipientBalanceBefore,
      );
    });
  });

  describe("Pause and unpause", function () {
    it("allows the owner to pause and unpause", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(owner).pause())
        .to.emit(vault, "Paused")
        .withArgs(owner.address);

      expect(await vault.paused()).to.equal(true);

      await expect(vault.connect(owner).unpause())
        .to.emit(vault, "Unpaused")
        .withArgs(owner.address);

      expect(await vault.paused()).to.equal(false);
    });

    it("rejects pause by a non-owner", async function () {
      const { vault, other } = await loadFixture(deployVaultFixture);

      await expect(vault.connect(other).pause())
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await vault.paused()).to.equal(false);
    });

    it("rejects unpause by a non-owner", async function () {
      const { vault, owner, other } =
        await loadFixture(deployVaultFixture);

      await vault.connect(owner).pause();

      await expect(vault.connect(other).unpause())
        .to.be.revertedWithCustomError(
          vault,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await vault.paused()).to.equal(true);
    });

    it("rejects pausing an already paused vault", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await vault.connect(owner).pause();

      await expect(
        vault.connect(owner).pause(),
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");

      expect(await vault.paused()).to.equal(true);
    });

    it("rejects unpausing an active vault", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(
        vault.connect(owner).unpause(),
      ).to.be.revertedWithCustomError(vault, "ExpectedPause");

      expect(await vault.paused()).to.equal(false);
    });

    it("keeps read-only state available while paused", async function () {
      const {
        vault,
        owner,
        token,
        feeReceiver,
        savingCore,
        fundingAmount,
      } = await loadFixture(authorizedFundedVaultFixture);

      await vault.connect(owner).pause();

      expect(await vault.paused()).to.equal(true);
      expect(await vault.token()).to.equal(await token.getAddress());
      expect(await vault.owner()).to.equal(owner.address);
      expect(await vault.feeReceiver()).to.equal(
        feeReceiver.address,
      );
      expect(await vault.savingCore()).to.equal(
        await savingCore.getAddress(),
      );
      expect(await vault.vaultBalance()).to.equal(fundingAmount);
    });
  });
});