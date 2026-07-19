import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SavingCore", function () {
  const amount = (value: string) => ethers.parseUnits(value, 6);

  const DEFAULT_TENOR_DAYS = 180;
  const DEFAULT_APR_BPS = 200;
  const DEFAULT_PENALTY_BPS = 750;
  const DEFAULT_MIN_DEPOSIT = amount("100");
  const DEFAULT_MAX_DEPOSIT = amount("10000");

  async function deploySavingCoreFixture() {
    const [
      owner,
      pendingOwner,
      feeReceiver,
      other,
      anotherAccount,
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

    const SavingCore = await ethers.getContractFactory("SavingCore");
    const savingCore = await SavingCore.deploy(
      await token.getAddress(),
      await vault.getAddress(),
      owner.address,
    );
    await savingCore.waitForDeployment();

    return {
      token,
      vault,
      savingCore,
      owner,
      pendingOwner,
      feeReceiver,
      other,
      anotherAccount,
    };
  }

  type SavingCoreFixture = Awaited<
    ReturnType<typeof deploySavingCoreFixture>
  >;

  async function createDefaultPlan(
    fixture: SavingCoreFixture,
    enabled = true,
  ) {
    await fixture.savingCore.connect(fixture.owner).createPlan(
      DEFAULT_TENOR_DAYS,
      DEFAULT_APR_BPS,
      DEFAULT_MIN_DEPOSIT,
      DEFAULT_MAX_DEPOSIT,
      DEFAULT_PENALTY_BPS,
      enabled,
    );
  }

  describe("Deployment and contract foundation", function () {
    it("stores the token, VaultManager, and initial owner", async function () {
      const { token, vault, savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      expect(await savingCore.token()).to.equal(await token.getAddress());
      expect(await savingCore.vaultManager()).to.equal(
        await vault.getAddress(),
      );
      expect(await savingCore.owner()).to.equal(owner.address);
    });

    it("sets the expected ERC721 collection metadata", async function () {
      const { savingCore } = await loadFixture(deploySavingCoreFixture);

      expect(await savingCore.name()).to.equal(
        "SafeBank Deposit Certificate",
      );
      expect(await savingCore.symbol()).to.equal("SBDC");
    });

    it("supports the ERC721 and ERC721 metadata interfaces", async function () {
      const { savingCore } = await loadFixture(deploySavingCoreFixture);

      expect(await savingCore.supportsInterface("0x80ac58cd")).to.equal(
        true,
      );
      expect(await savingCore.supportsInterface("0x5b5e139f")).to.equal(
        true,
      );
      expect(await savingCore.supportsInterface("0xffffffff")).to.equal(
        false,
      );
    });

    it("starts unpaused with no plans and no minted certificates", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      expect(await savingCore.paused()).to.equal(false);
      expect(await savingCore.planCount()).to.equal(0n);
      expect(await savingCore.balanceOf(owner.address)).to.equal(0n);

      await expect(savingCore.ownerOf(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "ERC721NonexistentToken",
        )
        .withArgs(1n);
    });

    it("stores the exact personal-variant constants", async function () {
      const { savingCore } = await loadFixture(deploySavingCoreFixture);

      expect(await savingCore.GRACE_PERIOD()).to.equal(2n * 24n * 60n * 60n);
      expect(await savingCore.DEFAULT_TENOR_DAYS()).to.equal(180n);
      expect(await savingCore.DEFAULT_APR_BPS()).to.equal(200n);
      expect(
        await savingCore.DEFAULT_EARLY_WITHDRAW_PENALTY_BPS(),
      ).to.equal(750n);
      expect(await savingCore.BPS_DENOMINATOR()).to.equal(10_000n);
    });

    it("stores the exact plan validation bounds", async function () {
      const { savingCore } = await loadFixture(deploySavingCoreFixture);

      expect(await savingCore.MIN_TENOR_DAYS()).to.equal(1n);
      expect(await savingCore.MAX_TENOR_DAYS()).to.equal(3_650n);
      expect(await savingCore.MIN_APR_BPS()).to.equal(1n);
      expect(await savingCore.MAX_APR_BPS()).to.equal(10_000n);
      expect(await savingCore.MAX_PENALTY_BPS()).to.equal(10_000n);
    });

    it("rejects a zero token address", async function () {
      const { savingCore, vault, owner } =
        await loadFixture(deploySavingCoreFixture);
      const SavingCore = await ethers.getContractFactory("SavingCore");

      await expect(
        SavingCore.deploy(
          ethers.ZeroAddress,
          await vault.getAddress(),
          owner.address,
        ),
      ).to.be.revertedWithCustomError(savingCore, "InvalidAddress");
    });

    it("rejects a zero VaultManager address", async function () {
      const { token, savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);
      const SavingCore = await ethers.getContractFactory("SavingCore");

      await expect(
        SavingCore.deploy(
          await token.getAddress(),
          ethers.ZeroAddress,
          owner.address,
        ),
      ).to.be.revertedWithCustomError(savingCore, "InvalidAddress");
    });

    it("rejects a token address without deployed bytecode", async function () {
      const { vault, savingCore, owner, other } =
        await loadFixture(deploySavingCoreFixture);
      const SavingCore = await ethers.getContractFactory("SavingCore");

      await expect(
        SavingCore.deploy(
          other.address,
          await vault.getAddress(),
          owner.address,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "AddressIsNotContract",
        )
        .withArgs(other.address);
    });

    it("rejects a VaultManager address without deployed bytecode", async function () {
      const { token, savingCore, owner, other } =
        await loadFixture(deploySavingCoreFixture);
      const SavingCore = await ethers.getContractFactory("SavingCore");

      await expect(
        SavingCore.deploy(
          await token.getAddress(),
          other.address,
          owner.address,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "AddressIsNotContract",
        )
        .withArgs(other.address);
    });

    it("rejects a zero initial owner through Ownable", async function () {
      const { token, vault, savingCore } =
        await loadFixture(deploySavingCoreFixture);
      const SavingCore = await ethers.getContractFactory("SavingCore");

      await expect(
        SavingCore.deploy(
          await token.getAddress(),
          await vault.getAddress(),
          ethers.ZeroAddress,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableInvalidOwner",
        )
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("Two-step ownership", function () {
    it("starts an ownership transfer without changing the current owner", async function () {
      const { savingCore, owner, pendingOwner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(
        savingCore
          .connect(owner)
          .transferOwnership(pendingOwner.address),
      )
        .to.emit(savingCore, "OwnershipTransferStarted")
        .withArgs(owner.address, pendingOwner.address);

      expect(await savingCore.owner()).to.equal(owner.address);
      expect(await savingCore.pendingOwner()).to.equal(
        pendingOwner.address,
      );
    });

    it("allows only the pending owner to accept ownership", async function () {
      const { savingCore, owner, pendingOwner, other } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore
        .connect(owner)
        .transferOwnership(pendingOwner.address);

      await expect(savingCore.connect(other).acceptOwnership())
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await savingCore.owner()).to.equal(owner.address);
    });

    it("transfers ownership after the pending owner accepts", async function () {
      const { savingCore, owner, pendingOwner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore
        .connect(owner)
        .transferOwnership(pendingOwner.address);

      await expect(savingCore.connect(pendingOwner).acceptOwnership())
        .to.emit(savingCore, "OwnershipTransferred")
        .withArgs(owner.address, pendingOwner.address);

      expect(await savingCore.owner()).to.equal(pendingOwner.address);
      expect(await savingCore.pendingOwner()).to.equal(
        ethers.ZeroAddress,
      );
    });

    it("rejects ownership acceptance without a pending transfer", async function () {
      const { savingCore, other } =
        await loadFixture(deploySavingCoreFixture);

      await expect(savingCore.connect(other).acceptOwnership())
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);
    });

    it("gives plan authority to the new owner and removes it from the old owner", async function () {
      const { savingCore, owner, pendingOwner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore
        .connect(owner)
        .transferOwnership(pendingOwner.address);
      await savingCore.connect(pendingOwner).acceptOwnership();

      await expect(
        savingCore.connect(owner).createPlan(
          DEFAULT_TENOR_DAYS,
          DEFAULT_APR_BPS,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(owner.address);

      await expect(
        savingCore.connect(pendingOwner).createPlan(
          DEFAULT_TENOR_DAYS,
          DEFAULT_APR_BPS,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.emit(savingCore, "PlanCreated")
        .withArgs(1n, 180n, 200n);

      expect(await savingCore.planCount()).to.equal(1n);
    });
  });

  describe("Plan creation", function () {
    it("creates the personal-variant default plan with ID one", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await expect(
        savingCore.connect(owner).createPlan(
          DEFAULT_TENOR_DAYS,
          DEFAULT_APR_BPS,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.emit(savingCore, "PlanCreated")
        .withArgs(1n, 180n, 200n);

      expect(await savingCore.planCount()).to.equal(1n);

      const plan = await savingCore.getPlan(1n);

      expect(plan.tenorDays).to.equal(180n);
      expect(plan.aprBps).to.equal(200n);
      expect(plan.minDeposit).to.equal(DEFAULT_MIN_DEPOSIT);
      expect(plan.maxDeposit).to.equal(DEFAULT_MAX_DEPOSIT);
      expect(plan.earlyWithdrawPenaltyBps).to.equal(750n);
      expect(plan.enabled).to.equal(true);
    });

    it("allows a plan to be created initially disabled", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        false,
      );

      expect((await savingCore.getPlan(1n)).enabled).to.equal(false);
    });

    it("assigns sequential plan identifiers beginning at one", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);

      await expect(
        savingCore.connect(owner).createPlan(
          365,
          300,
          amount("500"),
          amount("20000"),
          500,
          true,
        ),
      )
        .to.emit(savingCore, "PlanCreated")
        .withArgs(2n, 365n, 300n);

      expect(await savingCore.planCount()).to.equal(2n);
      expect((await savingCore.getPlan(1n)).tenorDays).to.equal(180n);
      expect((await savingCore.getPlan(2n)).tenorDays).to.equal(365n);
    });

    it("rejects plan creation by a non-owner", async function () {
      const { savingCore, other } =
        await loadFixture(deploySavingCoreFixture);

      await expect(
        savingCore.connect(other).createPlan(
          DEFAULT_TENOR_DAYS,
          DEFAULT_APR_BPS,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect(await savingCore.planCount()).to.equal(0n);
    });

    it("rejects plan ID zero when reading a plan", async function () {
      const { savingCore } =
        await loadFixture(deploySavingCoreFixture);

      await expect(savingCore.getPlan(0n))
        .to.be.revertedWithCustomError(savingCore, "InvalidPlanId")
        .withArgs(0n);
    });

    it("rejects a plan ID greater than the current plan count", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore } = fixture;

      await createDefaultPlan(fixture);

      await expect(savingCore.getPlan(2n))
        .to.be.revertedWithCustomError(savingCore, "InvalidPlanId")
        .withArgs(2n);
    });
  });

  describe("Tenor validation", function () {
    it("rejects a zero-day tenor", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(
        savingCore.connect(owner).createPlan(
          0,
          DEFAULT_APR_BPS,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidTenorDays",
        )
        .withArgs(0n);
    });

    it("rejects a tenor above 3,650 days", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(
        savingCore.connect(owner).createPlan(
          3_651,
          DEFAULT_APR_BPS,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidTenorDays",
        )
        .withArgs(3_651n);
    });

    it("accepts the minimum one-day tenor", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        1,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      expect((await savingCore.getPlan(1n)).tenorDays).to.equal(1n);
    });

    it("accepts the maximum 3,650-day tenor", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        3_650,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      expect((await savingCore.getPlan(1n)).tenorDays).to.equal(3_650n);
    });
  });

  describe("APR validation", function () {
    it("rejects a zero APR", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(
        savingCore.connect(owner).createPlan(
          DEFAULT_TENOR_DAYS,
          0,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.be.revertedWithCustomError(savingCore, "InvalidAprBps")
        .withArgs(0n);
    });

    it("rejects an APR above 10,000 basis points", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(
        savingCore.connect(owner).createPlan(
          DEFAULT_TENOR_DAYS,
          10_001,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.be.revertedWithCustomError(savingCore, "InvalidAprBps")
        .withArgs(10_001n);
    });

    it("accepts the minimum APR of one basis point", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        1,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      expect((await savingCore.getPlan(1n)).aprBps).to.equal(1n);
    });

    it("accepts the maximum APR of 10,000 basis points", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        10_000,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      expect((await savingCore.getPlan(1n)).aprBps).to.equal(10_000n);
    });
  });

  describe("Penalty validation", function () {
    it("rejects a penalty above 10,000 basis points", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(
        savingCore.connect(owner).createPlan(
          DEFAULT_TENOR_DAYS,
          DEFAULT_APR_BPS,
          DEFAULT_MIN_DEPOSIT,
          DEFAULT_MAX_DEPOSIT,
          10_001,
          true,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidPenaltyBps",
        )
        .withArgs(10_001n);
    });

    it("accepts a zero early-withdrawal penalty", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        0,
        true,
      );

      expect(
        (await savingCore.getPlan(1n)).earlyWithdrawPenaltyBps,
      ).to.equal(0n);
    });

    it("accepts the maximum penalty of 10,000 basis points", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        10_000,
        true,
      );

      expect(
        (await savingCore.getPlan(1n)).earlyWithdrawPenaltyBps,
      ).to.equal(10_000n);
    });
  });

  describe("Deposit-limit validation", function () {
    it("rejects a nonzero minimum greater than a nonzero maximum", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);
      const minDeposit = amount("1001");
      const maxDeposit = amount("1000");

      await expect(
        savingCore.connect(owner).createPlan(
          DEFAULT_TENOR_DAYS,
          DEFAULT_APR_BPS,
          minDeposit,
          maxDeposit,
          DEFAULT_PENALTY_BPS,
          true,
        ),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositRange",
        )
        .withArgs(minDeposit, maxDeposit);
    });

    it("accepts zero minimum as no lower plan limit", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        0,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const plan = await savingCore.getPlan(1n);
      expect(plan.minDeposit).to.equal(0n);
      expect(plan.maxDeposit).to.equal(DEFAULT_MAX_DEPOSIT);
    });

    it("accepts zero maximum as no upper plan limit", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        0,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const plan = await savingCore.getPlan(1n);
      expect(plan.minDeposit).to.equal(DEFAULT_MIN_DEPOSIT);
      expect(plan.maxDeposit).to.equal(0n);
    });

    it("accepts both limits as zero", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        0,
        0,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const plan = await savingCore.getPlan(1n);
      expect(plan.minDeposit).to.equal(0n);
      expect(plan.maxDeposit).to.equal(0n);
    });

    it("accepts equal nonzero minimum and maximum limits", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);
      const exactDeposit = amount("1000");

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        exactDeposit,
        exactDeposit,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const plan = await savingCore.getPlan(1n);
      expect(plan.minDeposit).to.equal(exactDeposit);
      expect(plan.maxDeposit).to.equal(exactDeposit);
    });
  });

  describe("APR updates", function () {
    it("updates only the APR and emits PlanUpdated", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);

      const before = await savingCore.getPlan(1n);

      await expect(savingCore.connect(owner).updatePlan(1n, 350))
        .to.emit(savingCore, "PlanUpdated")
        .withArgs(1n, 350n);

      const after = await savingCore.getPlan(1n);

      expect(after.aprBps).to.equal(350n);
      expect(after.tenorDays).to.equal(before.tenorDays);
      expect(after.minDeposit).to.equal(before.minDeposit);
      expect(after.maxDeposit).to.equal(before.maxDeposit);
      expect(after.earlyWithdrawPenaltyBps).to.equal(
        before.earlyWithdrawPenaltyBps,
      );
      expect(after.enabled).to.equal(before.enabled);
    });

    it("updates the APR of a disabled plan without enabling it", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture, false);
      await savingCore.connect(owner).updatePlan(1n, 500);

      const plan = await savingCore.getPlan(1n);

      expect(plan.aprBps).to.equal(500n);
      expect(plan.enabled).to.equal(false);
    });

    it("rejects an APR update by a non-owner", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, other } = fixture;

      await createDefaultPlan(fixture);

      await expect(savingCore.connect(other).updatePlan(1n, 300))
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      expect((await savingCore.getPlan(1n)).aprBps).to.equal(200n);
    });

    it("rejects an APR update for plan ID zero", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(savingCore.connect(owner).updatePlan(0n, 300))
        .to.be.revertedWithCustomError(savingCore, "InvalidPlanId")
        .withArgs(0n);
    });

    it("rejects an APR update for a nonexistent plan", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);

      await expect(savingCore.connect(owner).updatePlan(2n, 300))
        .to.be.revertedWithCustomError(savingCore, "InvalidPlanId")
        .withArgs(2n);
    });

    it("rejects invalid low and high APR updates", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);

      await expect(savingCore.connect(owner).updatePlan(1n, 0))
        .to.be.revertedWithCustomError(savingCore, "InvalidAprBps")
        .withArgs(0n);

      await expect(savingCore.connect(owner).updatePlan(1n, 10_001))
        .to.be.revertedWithCustomError(savingCore, "InvalidAprBps")
        .withArgs(10_001n);

      expect((await savingCore.getPlan(1n)).aprBps).to.equal(200n);
    });
  });

  describe("Plan enable and disable", function () {
    it("disables an enabled plan and emits PlanDisabled", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);

      await expect(savingCore.connect(owner).disablePlan(1n))
        .to.emit(savingCore, "PlanDisabled")
        .withArgs(1n);

      expect((await savingCore.getPlan(1n)).enabled).to.equal(false);
    });

    it("enables a disabled plan and emits PlanEnabled", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture, false);

      await expect(savingCore.connect(owner).enablePlan(1n))
        .to.emit(savingCore, "PlanEnabled")
        .withArgs(1n);

      expect((await savingCore.getPlan(1n)).enabled).to.equal(true);
    });

    it("preserves all immutable plan fields when toggling status", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);
      const before = await savingCore.getPlan(1n);

      await savingCore.connect(owner).disablePlan(1n);
      await savingCore.connect(owner).enablePlan(1n);

      const after = await savingCore.getPlan(1n);

      expect(after.tenorDays).to.equal(before.tenorDays);
      expect(after.aprBps).to.equal(before.aprBps);
      expect(after.minDeposit).to.equal(before.minDeposit);
      expect(after.maxDeposit).to.equal(before.maxDeposit);
      expect(after.earlyWithdrawPenaltyBps).to.equal(
        before.earlyWithdrawPenaltyBps,
      );
      expect(after.enabled).to.equal(true);
    });

    it("rejects enabling an already enabled plan", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);

      await expect(savingCore.connect(owner).enablePlan(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "PlanAlreadyEnabled",
        )
        .withArgs(1n);
    });

    it("rejects disabling an already disabled plan", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture, false);

      await expect(savingCore.connect(owner).disablePlan(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "PlanAlreadyDisabled",
        )
        .withArgs(1n);
    });

    it("rejects enable and disable calls by a non-owner", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, other } = fixture;

      await createDefaultPlan(fixture);

      await expect(savingCore.connect(other).disablePlan(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);

      await fixture.savingCore
        .connect(fixture.owner)
        .disablePlan(1n);

      await expect(savingCore.connect(other).enablePlan(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);
    });

    it("rejects zero and nonexistent plan identifiers", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);

      await expect(savingCore.connect(owner).disablePlan(0n))
        .to.be.revertedWithCustomError(savingCore, "InvalidPlanId")
        .withArgs(0n);

      await expect(savingCore.connect(owner).enablePlan(2n))
        .to.be.revertedWithCustomError(savingCore, "InvalidPlanId")
        .withArgs(2n);
    });
  });

  describe("Pause and unpause", function () {
    it("allows the owner to pause and unpause SavingCore", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(savingCore.connect(owner).pause())
        .to.emit(savingCore, "Paused")
        .withArgs(owner.address);

      expect(await savingCore.paused()).to.equal(true);

      await expect(savingCore.connect(owner).unpause())
        .to.emit(savingCore, "Unpaused")
        .withArgs(owner.address);

      expect(await savingCore.paused()).to.equal(false);
    });

    it("rejects pause by a non-owner", async function () {
      const { savingCore, other } =
        await loadFixture(deploySavingCoreFixture);

      await expect(savingCore.connect(other).pause())
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);
    });

    it("rejects unpause by a non-owner", async function () {
      const { savingCore, owner, other } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).pause();

      await expect(savingCore.connect(other).unpause())
        .to.be.revertedWithCustomError(
          savingCore,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);
    });

    it("rejects pausing an already paused contract", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await savingCore.connect(owner).pause();

      await expect(savingCore.connect(owner).pause())
        .to.be.revertedWithCustomError(savingCore, "EnforcedPause");
    });

    it("rejects unpausing an active contract", async function () {
      const { savingCore, owner } =
        await loadFixture(deploySavingCoreFixture);

      await expect(savingCore.connect(owner).unpause())
        .to.be.revertedWithCustomError(savingCore, "ExpectedPause");
    });

    it("keeps read-only plan access available while paused", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await createDefaultPlan(fixture);
      await savingCore.connect(owner).pause();

      expect(await savingCore.paused()).to.equal(true);
      expect(await savingCore.planCount()).to.equal(1n);
      expect((await savingCore.getPlan(1n)).aprBps).to.equal(200n);
    });

    it("allows plan administration while SavingCore is paused", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner } = fixture;

      await savingCore.connect(owner).pause();

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      await savingCore.connect(owner).updatePlan(1n, 300);
      await savingCore.connect(owner).disablePlan(1n);
      await savingCore.connect(owner).enablePlan(1n);

      const plan = await savingCore.getPlan(1n);

      expect(await savingCore.paused()).to.equal(true);
      expect(plan.aprBps).to.equal(300n);
      expect(plan.enabled).to.equal(true);
    });
  });
});