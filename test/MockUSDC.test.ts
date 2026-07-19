import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MockUSDC", function () {
  async function deployMockUSDCFixture() {
    const [deployer, alice, bob, spender] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    return { mockUSDC, deployer, alice, bob, spender };
  }

  describe("Deployment metadata", function () {
    it("sets the expected name, symbol, decimals, and initial supply", async function () {
      const { mockUSDC } = await loadFixture(deployMockUSDCFixture);

      expect(await mockUSDC.name()).to.equal("Mock USD Coin");
      expect(await mockUSDC.symbol()).to.equal("mUSDC");
      expect(await mockUSDC.decimals()).to.equal(6);
      expect(await mockUSDC.totalSupply()).to.equal(0n);
    });
  });

  describe("Six-decimal units", function () {
    it("uses six decimal places for token amounts", function () {
      expect(ethers.parseUnits("1", 6)).to.equal(1_000_000n);
      expect(ethers.parseUnits("1000", 6)).to.equal(1_000_000_000n);
    });
  });

  describe("Public minting", function () {
    it("allows the deployer to mint tokens", async function () {
      const { mockUSDC, deployer } = await loadFixture(deployMockUSDCFixture);
      const amount = ethers.parseUnits("1000", 6);

      await mockUSDC.mint(deployer.address, amount);

      expect(await mockUSDC.balanceOf(deployer.address)).to.equal(amount);
      expect(await mockUSDC.totalSupply()).to.equal(amount);
    });

    it("allows an arbitrary account to mint tokens", async function () {
      const { mockUSDC, alice } = await loadFixture(deployMockUSDCFixture);
      const amount = ethers.parseUnits("250", 6);

      await mockUSDC.connect(alice).mint(alice.address, amount);

      expect(await mockUSDC.balanceOf(alice.address)).to.equal(amount);
      expect(await mockUSDC.totalSupply()).to.equal(amount);
    });

    it("adds multiple mints to the recipient balance and total supply", async function () {
      const { mockUSDC, alice } = await loadFixture(deployMockUSDCFixture);
      const firstAmount = ethers.parseUnits("100", 6);
      const secondAmount = ethers.parseUnits("50", 6);

      await mockUSDC.mint(alice.address, firstAmount);
      await mockUSDC.mint(alice.address, secondAmount);

      expect(await mockUSDC.balanceOf(alice.address)).to.equal(firstAmount + secondAmount);
      expect(await mockUSDC.totalSupply()).to.equal(firstAmount + secondAmount);
    });

    it("emits a Transfer event from the zero address when minting", async function () {
      const { mockUSDC, alice } = await loadFixture(deployMockUSDCFixture);
      const amount = ethers.parseUnits("100", 6);

      await expect(mockUSDC.mint(alice.address, amount))
        .to.emit(mockUSDC, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, amount);
    });

    it("rejects minting to the zero address", async function () {
      const { mockUSDC } = await loadFixture(deployMockUSDCFixture);
      const amount = ethers.parseUnits("1", 6);

      await expect(mockUSDC.mint(ethers.ZeroAddress, amount))
        .to.be.revertedWithCustomError(mockUSDC, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("Transfers", function () {
    it("transfers balances without changing total supply", async function () {
      const { mockUSDC, alice, bob } = await loadFixture(deployMockUSDCFixture);
      const mintedAmount = ethers.parseUnits("1000", 6);
      const transferAmount = ethers.parseUnits("300", 6);

      await mockUSDC.mint(alice.address, mintedAmount);
      await mockUSDC.connect(alice).transfer(bob.address, transferAmount);

      expect(await mockUSDC.balanceOf(alice.address)).to.equal(mintedAmount - transferAmount);
      expect(await mockUSDC.balanceOf(bob.address)).to.equal(transferAmount);
      expect(await mockUSDC.totalSupply()).to.equal(mintedAmount);
    });

    it("rejects transfers when the sender balance is insufficient", async function () {
      const { mockUSDC, alice, bob } = await loadFixture(deployMockUSDCFixture);
      const amount = ethers.parseUnits("1", 6);

      await expect(mockUSDC.connect(alice).transfer(bob.address, amount))
        .to.be.revertedWithCustomError(mockUSDC, "ERC20InsufficientBalance")
        .withArgs(alice.address, 0n, amount);
    });
  });

  describe("Allowances", function () {
    it("records an approval and emits the Approval event", async function () {
      const { mockUSDC, alice, spender } = await loadFixture(deployMockUSDCFixture);
      const amount = ethers.parseUnits("500", 6);

      await expect(mockUSDC.connect(alice).approve(spender.address, amount))
        .to.emit(mockUSDC, "Approval")
        .withArgs(alice.address, spender.address, amount);

      expect(await mockUSDC.allowance(alice.address, spender.address)).to.equal(amount);
    });

    it("allows transferFrom and reduces the allowance", async function () {
      const { mockUSDC, alice, bob, spender } = await loadFixture(deployMockUSDCFixture);
      const mintedAmount = ethers.parseUnits("1000", 6);
      const approvedAmount = ethers.parseUnits("600", 6);
      const transferAmount = ethers.parseUnits("250", 6);

      await mockUSDC.mint(alice.address, mintedAmount);
      await mockUSDC.connect(alice).approve(spender.address, approvedAmount);
      await mockUSDC.connect(spender).transferFrom(alice.address, bob.address, transferAmount);

      expect(await mockUSDC.balanceOf(alice.address)).to.equal(mintedAmount - transferAmount);
      expect(await mockUSDC.balanceOf(bob.address)).to.equal(transferAmount);
      expect(await mockUSDC.allowance(alice.address, spender.address)).to.equal(
        approvedAmount - transferAmount
      );
      expect(await mockUSDC.totalSupply()).to.equal(mintedAmount);
    });

    it("rejects transferFrom when the allowance is insufficient", async function () {
      const { mockUSDC, alice, bob, spender } = await loadFixture(deployMockUSDCFixture);
      const amount = ethers.parseUnits("100", 6);

      await mockUSDC.mint(alice.address, amount);

      await expect(
        mockUSDC.connect(spender).transferFrom(alice.address, bob.address, amount)
      )
        .to.be.revertedWithCustomError(mockUSDC, "ERC20InsufficientAllowance")
        .withArgs(spender.address, 0n, amount);
    });
  });

  describe("Supply accounting", function () {
    it("keeps the sum of account balances equal to total supply after transfers", async function () {
      const { mockUSDC, alice, bob } = await loadFixture(deployMockUSDCFixture);
      const aliceMint = ethers.parseUnits("1000", 6);
      const bobMint = ethers.parseUnits("500", 6);
      const transferAmount = ethers.parseUnits("250", 6);

      await mockUSDC.mint(alice.address, aliceMint);
      await mockUSDC.mint(bob.address, bobMint);
      await mockUSDC.connect(alice).transfer(bob.address, transferAmount);

      const aliceBalance = await mockUSDC.balanceOf(alice.address);
      const bobBalance = await mockUSDC.balanceOf(bob.address);
      const totalSupply = await mockUSDC.totalSupply();

      expect(aliceBalance + bobBalance).to.equal(totalSupply);
      expect(totalSupply).to.equal(aliceMint + bobMint);
    });
  });
});
