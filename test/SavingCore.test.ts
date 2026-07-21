import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-network-helpers";
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

  const SECONDS_PER_DAY = 24n * 60n * 60n;
  const YEAR_IN_SECONDS = 365n * SECONDS_PER_DAY;
  const BPS_DENOMINATOR = 10_000n;

  const calculateInterest = (
    principal: bigint,
    aprBps: bigint,
    tenorDays: bigint,
  ) =>
    (principal * aprBps * tenorDays * SECONDS_PER_DAY) /
    (YEAR_IN_SECONDS * BPS_DENOMINATOR);

  async function deployAuthorizedSavingCoreFixture() {
    const fixture = await deploySavingCoreFixture();

    await fixture.vault
      .connect(fixture.owner)
      .authorizeSavingCore(await fixture.savingCore.getAddress());

    return fixture;
  }

  async function openDefaultMaturityDeposit(
    fixture: SavingCoreFixture,
  ) {
    const { token, savingCore, other } = fixture;

    await createDefaultPlan(fixture);

    const depositId = 1n;
    const principal = amount("1000");
    const savingCoreAddress = await savingCore.getAddress();

    await token.mint(other.address, principal);
    await token
      .connect(other)
      .approve(savingCoreAddress, principal);
    await savingCore
      .connect(other)
      .openDeposit(1n, principal);

    const deposit = await savingCore.getDeposit(depositId);
    const interest = calculateInterest(
      deposit.principal,
      deposit.aprBpsAtOpen,
      deposit.tenorDays,
    );

    return {
      depositId,
      principal,
      maturityAt: deposit.maturityAt,
      interest,
    };
  }

  async function fundVault(
    fixture: SavingCoreFixture,
    fundingAmount: bigint,
  ) {
    if (fundingAmount === 0n) {
      return;
    }

    const { token, vault, owner } = fixture;
    const vaultAddress = await vault.getAddress();

    await token.mint(owner.address, fundingAmount);
    await token
      .connect(owner)
      .approve(vaultAddress, fundingAmount);
    await vault.connect(owner).fundVault(fundingAmount);
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

  describe("Deposit opening and certificates", function () {
    it("starts with no deposits and rejects invalid deposit identifiers", async function () {
      const { savingCore } =
        await loadFixture(deploySavingCoreFixture);

      expect(await savingCore.depositCount()).to.equal(0n);

      await expect(savingCore.getDeposit(0n))
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(0n);

      await expect(savingCore.getDeposit(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);
    });

    it("opens a deposit, transfers principal, snapshots terms, and mints its certificate", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        vault,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);

      const openedAt = (await time.latest()) + 1;
      const maturityAt =
        BigInt(openedAt) +
        BigInt(DEFAULT_TENOR_DAYS * 24 * 60 * 60);

      await time.setNextBlockTimestamp(openedAt);

      const transaction = await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      await expect(transaction)
        .to.emit(savingCore, "DepositOpened")
        .withArgs(
          1n,
          other.address,
          1n,
          depositAmount,
          maturityAt,
          BigInt(DEFAULT_APR_BPS),
        );

      await expect(transaction)
        .to.emit(savingCore, "Transfer")
        .withArgs(
          ethers.ZeroAddress,
          other.address,
          1n,
        );

      const deposit = await savingCore.getDeposit(1n);

      expect(await savingCore.depositCount()).to.equal(1n);
      expect(await savingCore.planCount()).to.equal(1n);

      expect(deposit.planId).to.equal(1n);
      expect(deposit.principal).to.equal(depositAmount);
      expect(deposit.startedAt).to.equal(BigInt(openedAt));
      expect(deposit.maturityAt).to.equal(maturityAt);
      expect(deposit.tenorDays).to.equal(
        BigInt(DEFAULT_TENOR_DAYS),
      );
      expect(deposit.aprBpsAtOpen).to.equal(
        BigInt(DEFAULT_APR_BPS),
      );
      expect(deposit.penaltyBpsAtOpen).to.equal(
        BigInt(DEFAULT_PENALTY_BPS),
      );
      expect(deposit.status).to.equal(0n);

      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        depositAmount,
      );
      expect(await token.balanceOf(vaultAddress)).to.equal(0n);

      expect(await savingCore.ownerOf(1n)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });

    it("assigns sequential deposit and certificate identifiers beginning at one", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
        anotherAccount,
      } = fixture;

      await createDefaultPlan(fixture);

      const firstAmount = amount("500");
      const secondAmount = amount("750");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, firstAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, firstAmount);
      await savingCore
        .connect(other)
        .openDeposit(1n, firstAmount);

      await token.mint(anotherAccount.address, secondAmount);
      await token
        .connect(anotherAccount)
        .approve(savingCoreAddress, secondAmount);
      await savingCore
        .connect(anotherAccount)
        .openDeposit(1n, secondAmount);

      expect(await savingCore.depositCount()).to.equal(2n);
      expect(await savingCore.ownerOf(1n)).to.equal(
        other.address,
      );
      expect(await savingCore.ownerOf(2n)).to.equal(
        anotherAccount.address,
      );

      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(firstAmount);
      expect((await savingCore.getDeposit(2n)).principal)
        .to.equal(secondAmount);

      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        firstAmount + secondAmount,
      );
    });

    it("allows a non-owner user to open a deposit with their own approved principal", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("250");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);

      await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      expect(await savingCore.owner()).to.equal(owner.address);
      expect(await savingCore.ownerOf(1n)).to.equal(
        other.address,
      );
      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(depositAmount);
    });

    it("preserves an existing deposit snapshot after its plan APR is updated and disabled", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);
      await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      const before = await savingCore.getDeposit(1n);

      await savingCore.connect(owner).updatePlan(1n, 325);
      await savingCore.connect(owner).disablePlan(1n);

      const after = await savingCore.getDeposit(1n);
      const plan = await savingCore.getPlan(1n);

      expect(plan.aprBps).to.equal(325n);
      expect(plan.enabled).to.equal(false);

      expect(after.planId).to.equal(before.planId);
      expect(after.principal).to.equal(before.principal);
      expect(after.startedAt).to.equal(before.startedAt);
      expect(after.maturityAt).to.equal(before.maturityAt);
      expect(after.tenorDays).to.equal(before.tenorDays);
      expect(after.aprBpsAtOpen).to.equal(
        BigInt(DEFAULT_APR_BPS),
      );
      expect(after.penaltyBpsAtOpen).to.equal(
        BigInt(DEFAULT_PENALTY_BPS),
      );
      expect(after.status).to.equal(0n);
    });

    it("uses an updated plan APR for deposits opened after the update", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await createDefaultPlan(fixture);
      await savingCore.connect(owner).updatePlan(1n, 325);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);
      await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      const deposit = await savingCore.getDeposit(1n);

      expect(deposit.aprBpsAtOpen).to.equal(325n);
      expect(deposit.tenorDays).to.equal(
        BigInt(DEFAULT_TENOR_DAYS),
      );
      expect(deposit.penaltyBpsAtOpen).to.equal(
        BigInt(DEFAULT_PENALTY_BPS),
      );
    });

    it("allows the deposit certificate to be transferred without changing its stored terms", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
        anotherAccount,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);
      await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      const before = await savingCore.getDeposit(1n);

      await expect(
        savingCore
          .connect(other)
          .transferFrom(
            other.address,
            anotherAccount.address,
            1n,
          ),
      )
        .to.emit(savingCore, "Transfer")
        .withArgs(
          other.address,
          anotherAccount.address,
          1n,
        );

      const after = await savingCore.getDeposit(1n);

      expect(await savingCore.ownerOf(1n)).to.equal(
        anotherAccount.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        0n,
      );
      expect(
        await savingCore.balanceOf(anotherAccount.address),
      ).to.equal(1n);

      expect(after.planId).to.equal(before.planId);
      expect(after.principal).to.equal(before.principal);
      expect(after.startedAt).to.equal(before.startedAt);
      expect(after.maturityAt).to.equal(before.maturityAt);
      expect(after.tenorDays).to.equal(before.tenorDays);
      expect(after.aprBpsAtOpen).to.equal(
        before.aprBpsAtOpen,
      );
      expect(after.penaltyBpsAtOpen).to.equal(
        before.penaltyBpsAtOpen,
      );
      expect(after.status).to.equal(before.status);
    });
  });

  describe("Deposit opening validation", function () {
    it("rejects plan ID zero and a nonexistent plan", async function () {
      const { savingCore, other } =
        await loadFixture(deploySavingCoreFixture);

      await expect(
        savingCore.connect(other).openDeposit(0n, amount("100")),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidPlanId",
        )
        .withArgs(0n);

      await expect(
        savingCore.connect(other).openDeposit(1n, amount("100")),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidPlanId",
        )
        .withArgs(1n);

      expect(await savingCore.depositCount()).to.equal(0n);
    });

    it("rejects a disabled plan without transferring principal or minting a certificate", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture, false);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);

      await expect(
        savingCore
          .connect(other)
          .openDeposit(1n, depositAmount),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "PlanNotEnabled",
        )
        .withArgs(1n);

      expect(await savingCore.depositCount()).to.equal(0n);
      expect(await token.balanceOf(other.address)).to.equal(
        depositAmount,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        0n,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        0n,
      );
    });

    it("rejects a zero principal amount", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, other } = fixture;

      await createDefaultPlan(fixture);

      await expect(
        savingCore.connect(other).openDeposit(1n, 0n),
      ).to.be.revertedWithCustomError(
        savingCore,
        "InvalidAmount",
      );

      expect(await savingCore.depositCount()).to.equal(0n);
    });

    it("rejects an amount below a nonzero minimum", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const belowMinimum = DEFAULT_MIN_DEPOSIT - 1n;
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, belowMinimum);
      await token
        .connect(other)
        .approve(savingCoreAddress, belowMinimum);

      await expect(
        savingCore
          .connect(other)
          .openDeposit(1n, belowMinimum),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositBelowMinimum",
        )
        .withArgs(
          belowMinimum,
          DEFAULT_MIN_DEPOSIT,
        );

      expect(await savingCore.depositCount()).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        0n,
      );
    });

    it("accepts an amount exactly equal to the minimum", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, DEFAULT_MIN_DEPOSIT);
      await token
        .connect(other)
        .approve(
          savingCoreAddress,
          DEFAULT_MIN_DEPOSIT,
        );

      await savingCore
        .connect(other)
        .openDeposit(1n, DEFAULT_MIN_DEPOSIT);

      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(DEFAULT_MIN_DEPOSIT);
    });

    it("rejects an amount above a nonzero maximum", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const aboveMaximum = DEFAULT_MAX_DEPOSIT + 1n;
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, aboveMaximum);
      await token
        .connect(other)
        .approve(savingCoreAddress, aboveMaximum);

      await expect(
        savingCore
          .connect(other)
          .openDeposit(1n, aboveMaximum),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositAboveMaximum",
        )
        .withArgs(
          aboveMaximum,
          DEFAULT_MAX_DEPOSIT,
        );

      expect(await savingCore.depositCount()).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        0n,
      );
    });

    it("accepts an amount exactly equal to the maximum", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, DEFAULT_MAX_DEPOSIT);
      await token
        .connect(other)
        .approve(
          savingCoreAddress,
          DEFAULT_MAX_DEPOSIT,
        );

      await savingCore
        .connect(other)
        .openDeposit(1n, DEFAULT_MAX_DEPOSIT);

      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(DEFAULT_MAX_DEPOSIT);
    });

    it("treats a zero minimum as no lower plan limit while still rejecting zero amount", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        0n,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const smallestPositiveAmount = 1n;
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, smallestPositiveAmount);
      await token
        .connect(other)
        .approve(
          savingCoreAddress,
          smallestPositiveAmount,
        );

      await savingCore
        .connect(other)
        .openDeposit(1n, smallestPositiveAmount);

      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(smallestPositiveAmount);
    });

    it("treats a zero maximum as no upper plan limit", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        0n,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const largeAmount = amount("1000000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, largeAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, largeAmount);

      await savingCore
        .connect(other)
        .openDeposit(1n, largeAmount);

      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(largeAmount);
    });

    it("allows any positive amount when both plan limits are zero", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        0n,
        0n,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const depositAmount = amount("42.123456");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);

      await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(depositAmount);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        depositAmount,
      );
    });
  });

  describe("Deposit ERC20 transfers and rollback", function () {
    it("rolls back deposit state and NFT minting when allowance is insufficient", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);

      await expect(
        savingCore
          .connect(other)
          .openDeposit(1n, depositAmount),
      )
        .to.be.revertedWithCustomError(
          token,
          "ERC20InsufficientAllowance",
        )
        .withArgs(
          savingCoreAddress,
          0n,
          depositAmount,
        );

      expect(await savingCore.depositCount()).to.equal(0n);
      expect(await token.balanceOf(other.address)).to.equal(
        depositAmount,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        0n,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        0n,
      );

      await expect(savingCore.getDeposit(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);

      await expect(savingCore.ownerOf(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "ERC721NonexistentToken",
        )
        .withArgs(1n);
    });

    it("rolls back deposit state when the approved account has insufficient balance", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("1000");
      const availableBalance = amount("500");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, availableBalance);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);

      await expect(
        savingCore
          .connect(other)
          .openDeposit(1n, depositAmount),
      )
        .to.be.revertedWithCustomError(
          token,
          "ERC20InsufficientBalance",
        )
        .withArgs(
          other.address,
          availableBalance,
          depositAmount,
        );

      expect(await savingCore.depositCount()).to.equal(0n);
      expect(await token.balanceOf(other.address)).to.equal(
        availableBalance,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        0n,
      );
      expect(
        await token.allowance(
          other.address,
          savingCoreAddress,
        ),
      ).to.equal(depositAmount);

      await expect(savingCore.getDeposit(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);

      await expect(savingCore.ownerOf(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "ERC721NonexistentToken",
        )
        .withArgs(1n);
    });

    it("transfers only the deposit amount when approval exceeds the requested principal", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const userBalance = amount("2000");
      const approvedAmount = amount("1500");
      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, userBalance);
      await token
        .connect(other)
        .approve(savingCoreAddress, approvedAmount);

      await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      expect(await token.balanceOf(other.address)).to.equal(
        userBalance - depositAmount,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        depositAmount,
      );
      expect(
        await token.allowance(
          other.address,
          savingCoreAddress,
        ),
      ).to.equal(approvedAmount - depositAmount);

      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(depositAmount);
      expect(await savingCore.ownerOf(1n)).to.equal(
        other.address,
      );
    });
  });

  describe("Safe certificate minting and reentrancy", function () {
    it("allows an ERC721-aware smart contract to open a deposit and receive its certificate", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const tokenAddress = await token.getAddress();
      const depositAmount = amount("1000");

      const MockDepositReceiver =
        await ethers.getContractFactory(
          "MockDepositReceiver",
        );

      const receiver = await MockDepositReceiver.deploy(
        tokenAddress,
        savingCoreAddress,
      );

      await receiver.waitForDeployment();

      const receiverAddress = await receiver.getAddress();

      await token.mint(receiverAddress, depositAmount);

      const openedAt = (await time.latest()) + 1;
      const maturityAt =
        BigInt(openedAt) +
        BigInt(DEFAULT_TENOR_DAYS * 24 * 60 * 60);

      await time.setNextBlockTimestamp(openedAt);

      const transaction = await receiver
        .connect(other)
        .openDeposit(
          1n,
          depositAmount,
          false,
        );

      await expect(transaction)
        .to.emit(savingCore, "DepositOpened")
        .withArgs(
          1n,
          receiverAddress,
          1n,
          depositAmount,
          maturityAt,
          BigInt(DEFAULT_APR_BPS),
        );

      await expect(transaction)
        .to.emit(savingCore, "Transfer")
        .withArgs(
          ethers.ZeroAddress,
          receiverAddress,
          1n,
        );

      const deposit = await savingCore.getDeposit(1n);

      expect(await savingCore.depositCount()).to.equal(1n);
      expect(deposit.principal).to.equal(depositAmount);
      expect(deposit.status).to.equal(0n);

      expect(await savingCore.ownerOf(1n)).to.equal(
        receiverAddress,
      );
      expect(await savingCore.balanceOf(receiverAddress))
        .to.equal(1n);

      expect(await token.balanceOf(receiverAddress)).to.equal(
        0n,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        depositAmount,
      );

      expect(await receiver.callbackOperator()).to.equal(
        receiverAddress,
      );
      expect(await receiver.callbackFrom()).to.equal(
        ethers.ZeroAddress,
      );
      expect(await receiver.callbackTokenId()).to.equal(1n);
      expect(await receiver.callbackData()).to.equal("0x");

      expect(await receiver.reentryRequested()).to.equal(false);
      expect(await receiver.reentryAttempted()).to.equal(false);
      expect(await receiver.reentrySucceeded()).to.equal(false);
    });

    it("rolls back principal, deposit state, approval, and NFT minting when the recipient cannot receive ERC721 tokens", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const tokenAddress = await token.getAddress();
      const depositAmount = amount("1000");

      const MockNonERC721Receiver =
        await ethers.getContractFactory(
          "MockNonERC721Receiver",
        );

      const receiver = await MockNonERC721Receiver.deploy(
        tokenAddress,
        savingCoreAddress,
      );

      await receiver.waitForDeployment();

      const receiverAddress = await receiver.getAddress();

      await token.mint(receiverAddress, depositAmount);

      await expect(
        receiver
          .connect(other)
          .openDeposit(1n, depositAmount),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "ERC721InvalidReceiver",
        )
        .withArgs(receiverAddress);

      expect(await savingCore.depositCount()).to.equal(0n);

      expect(await token.balanceOf(receiverAddress)).to.equal(
        depositAmount,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        0n,
      );

      expect(
        await token.allowance(
          receiverAddress,
          savingCoreAddress,
        ),
      ).to.equal(0n);

      expect(await savingCore.balanceOf(receiverAddress))
        .to.equal(0n);

      await expect(savingCore.getDeposit(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);

      await expect(savingCore.ownerOf(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "ERC721NonexistentToken",
        )
        .withArgs(1n);
    });

    it("blocks callback reentrancy while allowing the original deposit to complete", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const tokenAddress = await token.getAddress();
      const depositAmount = amount("1000");

      const MockDepositReceiver =
        await ethers.getContractFactory(
          "MockDepositReceiver",
        );

      const receiver = await MockDepositReceiver.deploy(
        tokenAddress,
        savingCoreAddress,
      );

      await receiver.waitForDeployment();

      const receiverAddress = await receiver.getAddress();

      await token.mint(receiverAddress, depositAmount);

      await receiver
        .connect(other)
        .openDeposit(
          1n,
          depositAmount,
          true,
        );

      const expectedReentrancySelector =
        ethers.id(
          "ReentrancyGuardReentrantCall()",
        ).slice(0, 10);

      expect(await receiver.reentryRequested()).to.equal(false);
      expect(await receiver.reentryAttempted()).to.equal(true);
      expect(await receiver.reentrySucceeded()).to.equal(false);

      expect(
        await receiver.lastReentryErrorSelector(),
      ).to.equal(expectedReentrancySelector);

      expect(await savingCore.depositCount()).to.equal(1n);
      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(depositAmount);

      expect(await savingCore.ownerOf(1n)).to.equal(
        receiverAddress,
      );

      expect(await token.balanceOf(receiverAddress)).to.equal(
        0n,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        depositAmount,
      );

      expect(
        await token.allowance(
          receiverAddress,
          savingCoreAddress,
        ),
      ).to.equal(0n);
    });
  });

  describe("Pause and unpause", function () {
    it("rejects opening a deposit while paused without changing token or deposit state", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);

      await savingCore.connect(owner).pause();

      await expect(
        savingCore
          .connect(other)
          .openDeposit(1n, depositAmount),
      ).to.be.revertedWithCustomError(
        savingCore,
        "EnforcedPause",
      );

      expect(await savingCore.depositCount()).to.equal(0n);
      expect(await token.balanceOf(other.address)).to.equal(
        depositAmount,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        0n,
      );
      expect(
        await token.allowance(
          other.address,
          savingCoreAddress,
        ),
      ).to.equal(depositAmount);
      expect(await savingCore.balanceOf(other.address)).to.equal(
        0n,
      );

      await expect(savingCore.getDeposit(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);
    });

    it("keeps deposit and certificate reads available while paused", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);

      await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      await savingCore.connect(owner).pause();

      const deposit = await savingCore.getDeposit(1n);

      expect(await savingCore.paused()).to.equal(true);
      expect(await savingCore.depositCount()).to.equal(1n);
      expect(deposit.planId).to.equal(1n);
      expect(deposit.principal).to.equal(depositAmount);
      expect(deposit.status).to.equal(0n);
      expect(await savingCore.ownerOf(1n)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });

    it("allows deposit opening again after the owner unpauses SavingCore", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        other,
      } = fixture;

      await createDefaultPlan(fixture);

      const depositAmount = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await token.mint(other.address, depositAmount);
      await token
        .connect(other)
        .approve(savingCoreAddress, depositAmount);

      await savingCore.connect(owner).pause();
      await savingCore.connect(owner).unpause();

      await savingCore
        .connect(other)
        .openDeposit(1n, depositAmount);

      expect(await savingCore.paused()).to.equal(false);
      expect(await savingCore.depositCount()).to.equal(1n);
      expect((await savingCore.getDeposit(1n)).principal)
        .to.equal(depositAmount);
      expect(await savingCore.ownerOf(1n)).to.equal(
        other.address,
      );
    });

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
  describe("Early withdrawal state-machine integration and conservation", function () {
    it("rejects an unrelated caller while the deposit remains active", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const { depositId, principal } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();

      await expect(
        savingCore
          .connect(anotherAccount)
          .earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(
          depositId,
          anotherAccount.address,
          other.address,
        );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(anotherAccount.address)).to.equal(
        0n,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
    });

    it("rejects early withdrawal after maturity withdrawal has settled the deposit", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 1n);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("rejects maturity withdrawal after early withdrawal has settled the deposit", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt } =
        await openDefaultMaturityDeposit(fixture);

      await savingCore.connect(other).earlyWithdraw(depositId);
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 1n);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("floors a nonzero fractional penalty while preserving exact token conservation", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        feeReceiver,
        other,
      } = fixture;
      const principal = 17n;
      const expectedPenalty =
        (principal * BigInt(DEFAULT_PENALTY_BPS)) /
        BPS_DENOMINATOR;
      const expectedUserReceive = principal - expectedPenalty;
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        0n,
        0n,
        DEFAULT_PENALTY_BPS,
        true,
      );

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(savingCoreAddress, principal);
      await savingCore.connect(other).openDeposit(1n, principal);

      expect(expectedPenalty).to.equal(1n);
      expect(expectedUserReceive).to.equal(16n);

      await savingCore.connect(other).earlyWithdraw(1n);

      const userBalance = await token.balanceOf(other.address);
      const feeBalance = await token.balanceOf(
        feeReceiver.address,
      );
      const coreBalance = await token.balanceOf(savingCoreAddress);

      expect(userBalance).to.equal(expectedUserReceive);
      expect(feeBalance).to.equal(expectedPenalty);
      expect(coreBalance).to.equal(0n);
      expect(
        userBalance + feeBalance + coreBalance,
      ).to.equal(principal);
      expect(await token.totalSupply()).to.equal(principal);
      expect((await savingCore.getDeposit(1n)).status).to.equal(1n);
    });
  });

  describe("Early withdrawal boundaries and pause behavior", function () {
    it("returns the full principal when the snapshotted penalty is zero", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        feeReceiver,
        other,
      } = fixture;
      const principal = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        0n,
        0n,
        0n,
        true,
      );

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(savingCoreAddress, principal);
      await savingCore.connect(other).openDeposit(1n, principal);

      await expect(savingCore.connect(other).earlyWithdraw(1n))
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          1n,
          other.address,
          principal,
          0n,
          true,
        );

      expect(await token.balanceOf(other.address)).to.equal(principal);
      expect(await token.balanceOf(feeReceiver.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect((await savingCore.getDeposit(1n)).status).to.equal(1n);
    });

    it("transfers the full principal to the fee receiver at the maximum penalty", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        feeReceiver,
        other,
      } = fixture;
      const principal = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        0n,
        0n,
        10_000n,
        true,
      );

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(savingCoreAddress, principal);
      await savingCore.connect(other).openDeposit(1n, principal);

      await savingCore.connect(other).earlyWithdraw(1n);

      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(feeReceiver.address)).to.equal(
        principal,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect((await savingCore.getDeposit(1n)).status).to.equal(1n);
      expect(await savingCore.ownerOf(1n)).to.equal(other.address);
    });

    it("rounds a positive fractional penalty down to zero", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        feeReceiver,
        other,
      } = fixture;
      const principal = 1n;
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        0n,
        0n,
        DEFAULT_PENALTY_BPS,
        true,
      );

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(savingCoreAddress, principal);
      await savingCore.connect(other).openDeposit(1n, principal);

      const deposit = await savingCore.getDeposit(1n);

      expect(deposit.penaltyBpsAtOpen).to.equal(
        BigInt(DEFAULT_PENALTY_BPS),
      );

      await savingCore.connect(other).earlyWithdraw(1n);

      expect(await token.balanceOf(other.address)).to.equal(principal);
      expect(await token.balanceOf(feeReceiver.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
    });

    it("blocks early withdrawal while SavingCore is paused without changing state", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        feeReceiver,
        other,
      } = fixture;
      const { depositId, principal } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).pause();

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      ).to.be.revertedWithCustomError(
        savingCore,
        "EnforcedPause",
      );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(feeReceiver.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
    });

    it("allows early withdrawal while only VaultManager is paused", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        vault,
        savingCore,
        owner,
        feeReceiver,
        other,
      } = fixture;
      const { depositId, principal } =
        await openDefaultMaturityDeposit(fixture);
      const penalty =
        (principal * BigInt(DEFAULT_PENALTY_BPS)) /
        BPS_DENOMINATOR;

      await vault.connect(owner).pause();

      expect(await vault.paused()).to.equal(true);
      expect(await savingCore.paused()).to.equal(false);

      await savingCore.connect(other).earlyWithdraw(depositId);

      expect(await token.balanceOf(other.address)).to.equal(
        principal - penalty,
      );
      expect(await token.balanceOf(feeReceiver.address)).to.equal(
        penalty,
      );
      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
    });
  });

  describe("Early withdrawal snapshots and configuration", function () {
    it("uses the penalty snapshot after the plan APR changes and the plan is disabled", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        owner,
        feeReceiver,
        other,
      } = fixture;
      const { depositId, principal } =
        await openDefaultMaturityDeposit(fixture);

      const depositBefore = await savingCore.getDeposit(depositId);
      const expectedPenalty =
        (principal * depositBefore.penaltyBpsAtOpen) /
        BPS_DENOMINATOR;

      await savingCore.connect(owner).updatePlan(1n, 999n);
      await savingCore.connect(owner).disablePlan(1n);

      const currentPlan = await savingCore.getPlan(1n);

      expect(currentPlan.aprBps).to.equal(999n);
      expect(currentPlan.enabled).to.equal(false);

      await savingCore.connect(other).earlyWithdraw(depositId);

      const depositAfter = await savingCore.getDeposit(depositId);

      expect(depositAfter.aprBpsAtOpen).to.equal(
        BigInt(DEFAULT_APR_BPS),
      );
      expect(depositAfter.penaltyBpsAtOpen).to.equal(
        BigInt(DEFAULT_PENALTY_BPS),
      );
      expect(depositAfter.status).to.equal(1n);

      expect(await token.balanceOf(feeReceiver.address)).to.equal(
        expectedPenalty,
      );
      expect(await token.balanceOf(other.address)).to.equal(
        principal - expectedPenalty,
      );
    });

    it("sends the penalty to the current VaultManager fee receiver", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        vault,
        savingCore,
        owner,
        feeReceiver,
        other,
        anotherAccount,
      } = fixture;
      const { depositId, principal } =
        await openDefaultMaturityDeposit(fixture);

      const penalty =
        (principal * BigInt(DEFAULT_PENALTY_BPS)) /
        BPS_DENOMINATOR;

      await expect(
        vault
          .connect(owner)
          .setFeeReceiver(anotherAccount.address),
      )
        .to.emit(vault, "FeeReceiverUpdated")
        .withArgs(
          feeReceiver.address,
          anotherAccount.address,
        );

      expect(await vault.feeReceiver()).to.equal(
        anotherAccount.address,
      );

      await savingCore.connect(other).earlyWithdraw(depositId);

      expect(await token.balanceOf(feeReceiver.address)).to.equal(0n);
      expect(
        await token.balanceOf(anotherAccount.address),
      ).to.equal(penalty);
      expect(await token.balanceOf(other.address)).to.equal(
        principal - penalty,
      );
    });
  });

  describe("Early withdrawal authorization and lifecycle", function () {
    it("rejects invalid deposit identifiers", async function () {
      const { savingCore, other } = await loadFixture(
        deploySavingCoreFixture,
      );

      await expect(savingCore.connect(other).earlyWithdraw(0n))
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(0n);

      await expect(savingCore.connect(other).earlyWithdraw(1n))
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);
    });

    it("transfers early-withdrawal rights with the NFT", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        feeReceiver,
        other,
        anotherAccount,
      } = fixture;
      const { depositId, principal } =
        await openDefaultMaturityDeposit(fixture);

      const penalty =
        (principal * BigInt(DEFAULT_PENALTY_BPS)) /
        BPS_DENOMINATOR;
      const userReceive = principal - penalty;

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          anotherAccount.address,
          depositId,
        );

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(
          depositId,
          other.address,
          anotherAccount.address,
        );

      await savingCore
        .connect(anotherAccount)
        .earlyWithdraw(depositId);

      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(
        await token.balanceOf(anotherAccount.address),
      ).to.equal(userReceive);
      expect(await token.balanceOf(feeReceiver.address)).to.equal(
        penalty,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        anotherAccount.address,
      );
    });

    it("does not allow an approved ERC721 operator to withdraw early", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, owner, other } = fixture;
      const { depositId } =
        await openDefaultMaturityDeposit(fixture);

      await savingCore
        .connect(other)
        .approve(owner.address, depositId);

      expect(await savingCore.getApproved(depositId)).to.equal(
        owner.address,
      );

      await expect(
        savingCore.connect(owner).earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(depositId, owner.address, other.address);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );

      await savingCore.connect(other).earlyWithdraw(depositId);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
    });

    it("rejects a second early withdrawal and retains the NFT", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, other } = fixture;
      const { depositId } =
        await openDefaultMaturityDeposit(fixture);

      await savingCore.connect(other).earlyWithdraw(depositId);

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 1n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(1n);
    });
  });

  describe("Early withdrawal core flow", function () {
    it("returns net principal, transfers the snapshotted penalty, and pays no interest", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        vault,
        savingCore,
        feeReceiver,
        other,
      } = fixture;
      const { depositId, principal } =
        await openDefaultMaturityDeposit(fixture);

      const penalty =
        (principal * BigInt(DEFAULT_PENALTY_BPS)) /
        BPS_DENOMINATOR;
      const userReceive = principal - penalty;
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      const transaction = await savingCore
        .connect(other)
        .earlyWithdraw(depositId);

      await expect(transaction)
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          depositId,
          other.address,
          principal,
          0n,
          true,
        );

      await expect(transaction).to.not.emit(vault, "InterestPaid");

      expect(await token.balanceOf(other.address)).to.equal(
        userReceive,
      );
      expect(await token.balanceOf(feeReceiver.address)).to.equal(
        penalty,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect(await token.balanceOf(vaultAddress)).to.equal(0n);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(1n);
    });

    it("allows early withdrawal one second before maturity", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { savingCore, other } = fixture;
      const { depositId, maturityAt } =
        await openDefaultMaturityDeposit(fixture);

      await time.setNextBlockTimestamp(maturityAt - 1n);

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      )
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          depositId,
          other.address,
          amount("1000"),
          0n,
          true,
        );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
    });

    it("rejects early withdrawal at exact maturity without changing state", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const {
        token,
        savingCore,
        feeReceiver,
        other,
      } = fixture;
      const { depositId, principal, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositAlreadyMatured",
        )
        .withArgs(
          depositId,
          maturityAt,
          maturityAt,
        );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(feeReceiver.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });
  });
  describe("Maturity withdrawal core flow", function () {
    it("settles principal and snapshotted interest at exact maturity", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      expect(interest).to.equal(amount("9.863013"));

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      const transaction = await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await expect(transaction)
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          depositId,
          other.address,
          principal,
          interest,
          false,
        );

      await expect(transaction)
        .to.emit(vault, "InterestPaid")
        .withArgs(
          savingCoreAddress,
          other.address,
          interest,
        );

      expect(await token.balanceOf(other.address)).to.equal(
        principal + interest,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect(await token.balanceOf(vaultAddress)).to.equal(0n);
      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("rejects withdrawal one second before maturity without changing state", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, other } = fixture;
      const { depositId, principal, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();
      const beforeMaturity = maturityAt - 1n;

      await time.setNextBlockTimestamp(beforeMaturity);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotMatured",
        )
        .withArgs(depositId, maturityAt, beforeMaturity);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
    });

    it("returns principal and defers full interest when the vault is underfunded", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const availableInterest = interest - 1n;
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, availableInterest);
      await time.setNextBlockTimestamp(maturityAt);

      const transaction = await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await expect(transaction)
        .to.emit(savingCore, "InterestDeferred")
        .withArgs(depositId, other.address, interest);

      await expect(transaction)
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          depositId,
          other.address,
          principal,
          0n,
          false,
        );

      await expect(transaction).not.to.emit(vault, "InterestPaid");

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        other.address,
      );
      expect(await token.balanceOf(other.address)).to.equal(principal);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect(await token.balanceOf(vaultAddress)).to.equal(
        availableInterest,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("returns principal when calculated interest rounds down to zero", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, owner, other } = fixture;

      await savingCore.connect(owner).createPlan(
        1,
        1,
        0n,
        0n,
        0,
        true,
      );

      const principal = 1n;
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(savingCoreAddress, principal);
      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const deposit = await savingCore.getDeposit(1n);
      expect(
        calculateInterest(
          deposit.principal,
          deposit.aprBpsAtOpen,
          deposit.tenorDays,
        ),
      ).to.equal(0n);

      await time.setNextBlockTimestamp(deposit.maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(1n),
      )
        .to.emit(savingCore, "Withdrawn")
        .withArgs(1n, other.address, principal, 0n, false);

      expect(await token.balanceOf(other.address)).to.equal(principal);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect(await token.balanceOf(vaultAddress)).to.equal(0n);
      expect((await savingCore.getDeposit(1n)).status).to.equal(1n);
    });

    it("rejects a second maturity withdrawal and retains the NFT", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 1n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("allows maturity withdrawal after the grace period if still active", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod + 1n,
      );

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      ).to.emit(savingCore, "Withdrawn");

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
    });
  });

  describe("Pending-interest claim core flow", function () {
    it("allows the snapshotted claimant to claim all deferred interest after funding", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        other.address,
      );
      expect(await token.balanceOf(other.address)).to.equal(principal);

      await fundVault(fixture, interest);

      const transaction = await savingCore
        .connect(other)
        .claimPendingInterest(depositId);

      await expect(transaction)
        .to.emit(savingCore, "PendingInterestClaimed")
        .withArgs(depositId, other.address, interest);

      await expect(transaction)
        .to.emit(vault, "InterestPaid")
        .withArgs(
          savingCoreAddress,
          other.address,
          interest,
        );

      expect(await savingCore.pendingInterest(depositId)).to.equal(0n);
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        other.address,
      );
      expect(await token.balanceOf(other.address)).to.equal(
        principal + interest,
      );
      expect(await token.balanceOf(vaultAddress)).to.equal(0n);
      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("keeps the deferred-interest claimant fixed after historical NFT transfer", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          anotherAccount.address,
          depositId,
        );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        anotherAccount.address,
      );
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        other.address,
      );

      await expect(
        savingCore
          .connect(anotherAccount)
          .claimPendingInterest(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotInterestClaimant",
        )
        .withArgs(
          depositId,
          anotherAccount.address,
          other.address,
        );

      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await token.balanceOf(other.address)).to.equal(principal);
      expect(await token.balanceOf(anotherAccount.address)).to.equal(
        0n,
      );

      await fundVault(fixture, interest);

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      )
        .to.emit(savingCore, "PendingInterestClaimed")
        .withArgs(depositId, other.address, interest);

      expect(await token.balanceOf(other.address)).to.equal(
        principal + interest,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        anotherAccount.address,
      );
    });

    it("does not create a pending claim after fully funded maturity settlement", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      expect(await savingCore.pendingInterest(depositId)).to.equal(0n);
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        ethers.ZeroAddress,
      );

      await expect(
        savingCore
          .connect(other)
          .claimPendingInterest(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NoPendingInterest",
        )
        .withArgs(depositId);
    });

    it("rejects a second claim after deferred interest is paid", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await fundVault(fixture, interest);

      await savingCore
        .connect(other)
        .claimPendingInterest(depositId);

      await expect(
        savingCore
          .connect(other)
          .claimPendingInterest(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NoPendingInterest",
        )
        .withArgs(depositId);

      expect(await savingCore.pendingInterest(depositId)).to.equal(0n);
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        other.address,
      );
    });
  });

  describe("Pending-interest authorization and pause", function () {
    it("snapshots the current NFT owner after a transfer before maturity settlement", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          anotherAccount.address,
          depositId,
        );

      await time.setNextBlockTimestamp(maturityAt);

      await savingCore
        .connect(anotherAccount)
        .withdrawAtMaturity(depositId);

      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(anotherAccount.address)).to.equal(
        principal,
      );
      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        anotherAccount.address,
      );

      await fundVault(fixture, interest);

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotInterestClaimant",
        )
        .withArgs(
          depositId,
          other.address,
          anotherAccount.address,
        );

      await expect(
        savingCore
          .connect(anotherAccount)
          .claimPendingInterest(depositId),
      )
        .to.emit(savingCore, "PendingInterestClaimed")
        .withArgs(
          depositId,
          anotherAccount.address,
          interest,
        );
    });

    it("does not allow an approved ERC721 operator to claim deferred interest", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, owner, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await savingCore
        .connect(other)
        .approve(owner.address, depositId);

      expect(await savingCore.getApproved(depositId)).to.equal(
        owner.address,
      );

      await expect(
        savingCore.connect(owner).claimPendingInterest(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotInterestClaimant",
        )
        .withArgs(depositId, owner.address, other.address);

      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
    });

    it("rejects invalid deposits and deposits without pending interest", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId } =
        await openDefaultMaturityDeposit(fixture);

      await expect(
        savingCore.connect(other).claimPendingInterest(0n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(0n);

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NoPendingInterest",
        )
        .withArgs(depositId);
    });

    it("blocks pending-interest claims while SavingCore is paused without changing debt", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await fundVault(fixture, interest);
      await savingCore.connect(owner).pause();

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      ).to.be.revertedWithCustomError(
        savingCore,
        "EnforcedPause",
      );

      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        other.address,
      );
      expect(await token.balanceOf(other.address)).to.equal(principal);

      await savingCore.connect(owner).unpause();

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      )
        .to.emit(savingCore, "PendingInterestClaimed")
        .withArgs(depositId, other.address, interest);
    });
  });

  describe("Pending-interest payout rollback", function () {
    it("restores pending debt when the vault remains underfunded during claim", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const availableInterest = interest - 1n;
      const vaultAddress = await vault.getAddress();

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await fundVault(fixture, availableInterest);

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      )
        .to.be.revertedWithCustomError(
          vault,
          "InsufficientVaultBalance",
        )
        .withArgs(availableInterest, interest);

      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        other.address,
      );
      expect(await token.balanceOf(other.address)).to.equal(principal);
      expect(await token.balanceOf(vaultAddress)).to.equal(
        availableInterest,
      );
      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
    });

    it("restores pending debt when VaultManager is paused and allows retry after unpause", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const vaultAddress = await vault.getAddress();

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await fundVault(fixture, interest);
      await vault.connect(owner).pause();

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");

      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        other.address,
      );
      expect(await token.balanceOf(other.address)).to.equal(principal);
      expect(await token.balanceOf(vaultAddress)).to.equal(interest);

      await vault.connect(owner).unpause();

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      )
        .to.emit(savingCore, "PendingInterestClaimed")
        .withArgs(depositId, other.address, interest);

      expect(await savingCore.pendingInterest(depositId)).to.equal(0n);
      expect(await token.balanceOf(other.address)).to.equal(
        principal + interest,
      );
      expect(await token.balanceOf(vaultAddress)).to.equal(0n);
    });
  });

  describe("Maturity withdrawal authorization and rollback", function () {
    it("transfers withdrawal rights to the current NFT owner", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, owner, other, anotherAccount } =
        fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await savingCore
        .connect(other)
        .transferFrom(other.address, anotherAccount.address, depositId);
      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(
          depositId,
          other.address,
          anotherAccount.address,
        );

      await expect(
        savingCore.connect(owner).withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(
          depositId,
          owner.address,
          anotherAccount.address,
        );

      await expect(
        savingCore
          .connect(anotherAccount)
          .withdrawAtMaturity(depositId),
      )
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          depositId,
          anotherAccount.address,
          principal,
          interest,
          false,
        );

      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(anotherAccount.address)).to.equal(
        principal + interest,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        anotherAccount.address,
      );
    });

    it("does not allow an approved ERC721 operator to withdraw", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, owner, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await savingCore
        .connect(other)
        .approve(owner.address, depositId);
      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      expect(await savingCore.getApproved(depositId)).to.equal(
        owner.address,
      );

      await expect(
        savingCore.connect(owner).withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(depositId, owner.address, other.address);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );

      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
    });

    it("fully rolls back when VaultManager returns empty revert data", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await ethers.provider.send("hardhat_setCode", [
        vaultAddress,
        "0x60006000fd",
      ]);

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      ).to.be.revertedWithoutReason();

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await savingCore.pendingInterest(depositId)).to.equal(0n);
      expect(await savingCore.interestClaimant(depositId)).to.equal(
        ethers.ZeroAddress,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("rolls back when SavingCore has not been authorized by VaultManager", async function () {
      const fixture = await loadFixture(deploySavingCoreFixture);
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          vault,
          "UnauthorizedSavingCore",
        )
        .withArgs(savingCoreAddress);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await token.balanceOf(vaultAddress)).to.equal(interest);
    });

    it("blocks maturity withdrawal while SavingCore is paused", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();

      await fundVault(fixture, interest);
      await savingCore.connect(owner).pause();
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      ).to.be.revertedWithCustomError(savingCore, "EnforcedPause");

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
    });

    it("fully rolls back when VaultManager is paused", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest);
      await vault.connect(owner).pause();
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await token.balanceOf(vaultAddress)).to.equal(interest);
    });

    it("uses the deposit APR snapshot after its plan is updated and disabled", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await savingCore.connect(owner).updatePlan(1n, 500);
      await savingCore.connect(owner).disablePlan(1n);

      const plan = await savingCore.getPlan(1n);
      const deposit = await savingCore.getDeposit(depositId);

      expect(plan.aprBps).to.equal(500n);
      expect(plan.enabled).to.equal(false);
      expect(deposit.aprBpsAtOpen).to.equal(200n);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          depositId,
          other.address,
          principal,
          interest,
          false,
        );

      expect(await token.balanceOf(other.address)).to.equal(
        principal + interest,
      );
    });

    it("allows withdrawal at the exact grace-period end", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt + gracePeriod);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      ).to.emit(savingCore, "Withdrawn");

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
    });

    it("keeps integer-rounding dust inside VaultManager", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const dust = 1n;
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest + dust);
      await time.setNextBlockTimestamp(maturityAt);
      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      expect(await token.balanceOf(other.address)).to.equal(
        principal + interest,
      );
      expect(await token.balanceOf(vaultAddress)).to.equal(dust);
    });

    it("rejects invalid deposit identifiers", async function () {
      const { savingCore, other } = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );

      await expect(
        savingCore.connect(other).withdrawAtMaturity(0n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(0n);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);
    });
  });
  describe("Early withdrawal atomic rollback", function () {
    it("rolls back the user transfer and deposit status when the later penalty transfer fails", async function () {
      const [owner, feeReceiver, other] = await ethers.getSigners();

      const MockReentrantToken = await ethers.getContractFactory(
        "MockReentrantToken",
      );
      const token = await MockReentrantToken.deploy();
      await token.waitForDeployment();

      const VaultManager = await ethers.getContractFactory(
        "VaultManager",
      );
      const vault = await VaultManager.deploy(
        await token.getAddress(),
        owner.address,
        feeReceiver.address,
      );
      await vault.waitForDeployment();

      const SavingCore = await ethers.getContractFactory(
        "SavingCore",
      );
      const savingCore = await SavingCore.deploy(
        await token.getAddress(),
        await vault.getAddress(),
        owner.address,
      );
      await savingCore.waitForDeployment();

      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const depositId = 1n;
      const principal = amount("1000");
      const penalty =
        (principal * BigInt(DEFAULT_PENALTY_BPS)) /
        BPS_DENOMINATOR;
      const userReceive = principal - penalty;

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(savingCoreAddress, principal);
      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const totalSupplyBefore = await token.totalSupply();

      await token.configureTransferFailure(
        savingCoreAddress,
        feeReceiver.address,
        true,
      );

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          token,
          "ForcedTransferFailure",
        )
        .withArgs(feeReceiver.address);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(feeReceiver.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await token.totalSupply()).to.equal(totalSupplyBefore);
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(1n);

      await token.configureTransferFailure(
        savingCoreAddress,
        feeReceiver.address,
        false,
      );

      await savingCore.connect(other).earlyWithdraw(depositId);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await token.balanceOf(other.address)).to.equal(
        userReceive,
      );
      expect(await token.balanceOf(feeReceiver.address)).to.equal(
        penalty,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(totalSupplyBefore);
    });
  });

  describe("Early withdrawal reentrancy protection", function () {
    it("blocks token callback reentrancy while completing the original early withdrawal", async function () {
      const [owner, feeReceiver, other] = await ethers.getSigners();

      const MockReentrantToken = await ethers.getContractFactory(
        "MockReentrantToken",
      );
      const token = await MockReentrantToken.deploy();
      await token.waitForDeployment();

      const VaultManager = await ethers.getContractFactory(
        "VaultManager",
      );
      const vault = await VaultManager.deploy(
        await token.getAddress(),
        owner.address,
        feeReceiver.address,
      );
      await vault.waitForDeployment();

      const SavingCore = await ethers.getContractFactory(
        "SavingCore",
      );
      const savingCore = await SavingCore.deploy(
        await token.getAddress(),
        await vault.getAddress(),
        owner.address,
      );
      await savingCore.waitForDeployment();

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const depositId = 1n;
      const principal = amount("1000");
      const penalty =
        (principal * BigInt(DEFAULT_PENALTY_BPS)) /
        BPS_DENOMINATOR;
      const userReceive = principal - penalty;

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(savingCoreAddress, principal);
      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const totalSupplyBefore = await token.totalSupply();

      await token.configureEarlyWithdrawReentry(
        savingCoreAddress,
        depositId,
        true,
      );

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      )
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          depositId,
          other.address,
          principal,
          0n,
          true,
        );

      expect(await token.reentryAttempted()).to.equal(true);
      expect(await token.reentrySucceeded()).to.equal(false);
      expect(await token.lastReentryErrorSelector()).to.equal(
        ethers
          .id("ReentrancyGuardReentrantCall()")
          .slice(0, 10),
      );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await token.balanceOf(other.address)).to.equal(
        userReceive,
      );
      expect(await token.balanceOf(feeReceiver.address)).to.equal(
        penalty,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect(await token.balanceOf(vaultAddress)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(totalSupplyBefore);
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });
  });

  describe("Maturity withdrawal reentrancy protection", function () {
    it("blocks token callback reentrancy while completing the original withdrawal", async function () {
      const [owner, feeReceiver, other] = await ethers.getSigners();

      const MockReentrantToken = await ethers.getContractFactory(
        "MockReentrantToken",
      );
      const token = await MockReentrantToken.deploy();
      await token.waitForDeployment();

      const VaultManager = await ethers.getContractFactory(
        "VaultManager",
      );
      const vault = await VaultManager.deploy(
        await token.getAddress(),
        owner.address,
        feeReceiver.address,
      );
      await vault.waitForDeployment();

      const SavingCore = await ethers.getContractFactory(
        "SavingCore",
      );
      const savingCore = await SavingCore.deploy(
        await token.getAddress(),
        await vault.getAddress(),
        owner.address,
      );
      await savingCore.waitForDeployment();

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await vault
        .connect(owner)
        .authorizeSavingCore(savingCoreAddress);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const depositId = 1n;
      const principal = amount("1000");

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(savingCoreAddress, principal);
      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const deposit = await savingCore.getDeposit(depositId);
      const interest = calculateInterest(
        deposit.principal,
        deposit.aprBpsAtOpen,
        deposit.tenorDays,
      );

      await token.mint(owner.address, interest);
      await token
        .connect(owner)
        .approve(vaultAddress, interest);
      await vault.connect(owner).fundVault(interest);

      await token.configureReentry(
        savingCoreAddress,
        depositId,
        true,
      );

      await time.setNextBlockTimestamp(deposit.maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.emit(savingCore, "Withdrawn")
        .withArgs(
          depositId,
          other.address,
          principal,
          interest,
          false,
        );

      expect(await token.reentryAttempted()).to.equal(true);
      expect(await token.reentrySucceeded()).to.equal(false);
      expect(await token.lastReentryErrorSelector()).to.equal(
        ethers
          .id("ReentrancyGuardReentrantCall()")
          .slice(0, 10),
      );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        1n,
      );
      expect(await token.balanceOf(other.address)).to.equal(
        principal + interest,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(0n);
      expect(await token.balanceOf(vaultAddress)).to.equal(0n);
    });
  });

  describe("Pending-interest claim reentrancy protection", function () {
    it("blocks token callback reentrancy while completing the original claim", async function () {
      const [owner, feeReceiver, other] =
        await ethers.getSigners();

      const MockReentrantToken =
        await ethers.getContractFactory(
          "MockReentrantToken",
        );

      const token = await MockReentrantToken.deploy();
      await token.waitForDeployment();

      const VaultManager =
        await ethers.getContractFactory("VaultManager");

      const vault = await VaultManager.deploy(
        await token.getAddress(),
        owner.address,
        feeReceiver.address,
      );

      await vault.waitForDeployment();

      const SavingCore =
        await ethers.getContractFactory("SavingCore");

      const savingCore = await SavingCore.deploy(
        await token.getAddress(),
        await vault.getAddress(),
        owner.address,
      );

      await savingCore.waitForDeployment();

      const savingCoreAddress =
        await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await vault
        .connect(owner)
        .authorizeSavingCore(savingCoreAddress);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const depositId = 1n;
      const principal = amount("1000");

      await token.mint(other.address, principal);

      await token
        .connect(other)
        .approve(savingCoreAddress, principal);

      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const deposit =
        await savingCore.getDeposit(depositId);

      const interest = calculateInterest(
        deposit.principal,
        deposit.aprBpsAtOpen,
        deposit.tenorDays,
      );

      await time.setNextBlockTimestamp(
        deposit.maturityAt,
      );

      const settlementTransaction = await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await expect(settlementTransaction)
        .to.emit(savingCore, "InterestDeferred")
        .withArgs(
          depositId,
          other.address,
          interest,
        );

      expect(
        await savingCore.pendingInterest(depositId),
      ).to.equal(interest);

      await token.mint(owner.address, interest);

      await token
        .connect(owner)
        .approve(vaultAddress, interest);

      await vault.connect(owner).fundVault(interest);

      const totalSupplyBefore =
        await token.totalSupply();

      await token.configurePendingInterestClaimReentry(
        savingCoreAddress,
        vaultAddress,
        depositId,
        true,
      );

      const claimTransaction = await savingCore
        .connect(other)
        .claimPendingInterest(depositId);

      await expect(claimTransaction)
        .to.emit(savingCore, "PendingInterestClaimed")
        .withArgs(
          depositId,
          other.address,
          interest,
        );

      await expect(claimTransaction)
        .to.emit(vault, "InterestPaid")
        .withArgs(
          savingCoreAddress,
          other.address,
          interest,
        );

      expect(await token.reentryAttempted()).to.equal(true);
      expect(await token.reentrySucceeded()).to.equal(false);

      expect(
        await token.lastReentryErrorSelector(),
      ).to.equal(
        ethers
          .id("ReentrancyGuardReentrantCall()")
          .slice(0, 10),
      );

      expect(
        await savingCore.pendingInterest(depositId),
      ).to.equal(0n);

      expect(
        await savingCore.interestClaimant(depositId),
      ).to.equal(other.address);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(1n);

      expect(
        await token.balanceOf(other.address),
      ).to.equal(principal + interest);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(0n);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(
        await savingCore.ownerOf(depositId),
      ).to.equal(other.address);
    });
  });

  describe("Manual renewal core flow", function () {
    it("compounds funded interest into a new selected-plan deposit at exact maturity", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const newPlanId = 2n;
      const newDepositId = 2n;
      const newTenorDays = 90n;
      const newAprBps = 350n;
      const newPenaltyBps = 125n;
      const newPrincipal = principal + interest;

      await savingCore.connect(owner).createPlan(
        newTenorDays,
        newAprBps,
        amount("500"),
        amount("5000"),
        newPenaltyBps,
        true,
      );

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      const userBalanceBefore = await token.balanceOf(
        other.address,
      );
      const savingCoreBalanceBefore = await token.balanceOf(
        savingCoreAddress,
      );
      const vaultBalanceBefore = await token.balanceOf(
        vaultAddress,
      );
      const totalSupplyBefore = await token.totalSupply();

      const transaction = await savingCore
        .connect(other)
        .manualRenew(depositId, newPlanId);

      await expect(transaction)
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          newDepositId,
          newPrincipal,
          newPlanId,
        );

      await expect(transaction)
        .to.emit(vault, "InterestPaid")
        .withArgs(
          savingCoreAddress,
          savingCoreAddress,
          interest,
        );

      await expect(transaction)
        .to.emit(savingCore, "Transfer")
        .withArgs(
          ethers.ZeroAddress,
          other.address,
          newDepositId,
        );

      const receipt = await transaction.wait();

      expect(receipt).to.not.equal(null);

      const transactionBlock = await ethers.provider.getBlock(
        receipt!.blockNumber,
      );

      expect(transactionBlock).to.not.equal(null);

      const renewedAt = BigInt(transactionBlock!.timestamp);
      const oldDeposit = await savingCore.getDeposit(depositId);
      const newDeposit = await savingCore.getDeposit(
        newDepositId,
      );

      expect(oldDeposit.status).to.equal(2n);
      expect(oldDeposit.principal).to.equal(principal);
      expect(oldDeposit.maturityAt).to.equal(maturityAt);

      expect(newDeposit.planId).to.equal(newPlanId);
      expect(newDeposit.principal).to.equal(newPrincipal);
      expect(newDeposit.startedAt).to.equal(renewedAt);
      expect(newDeposit.maturityAt).to.equal(
        renewedAt + newTenorDays * SECONDS_PER_DAY,
      );
      expect(newDeposit.tenorDays).to.equal(newTenorDays);
      expect(newDeposit.aprBpsAtOpen).to.equal(newAprBps);
      expect(newDeposit.penaltyBpsAtOpen).to.equal(
        newPenaltyBps,
      );
      expect(newDeposit.status).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(
        newDepositId,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.ownerOf(newDepositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        2n,
      );

      expect(await token.balanceOf(other.address)).to.equal(
        userBalanceBefore,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        savingCoreBalanceBefore + interest,
      );
      expect(await token.balanceOf(vaultAddress)).to.equal(
        vaultBalanceBefore - interest,
      );
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      const savingCoreEventNames = receipt!.logs
        .filter(
          (log) =>
            log.address.toLowerCase() ===
            savingCoreAddress.toLowerCase(),
        )
        .map((log) => {
          try {
            return (
              savingCore.interface.parseLog(log)?.name ?? null
            );
          } catch {
            return null;
          }
        })
        .filter(
          (name): name is string => name !== null,
        );

      expect(savingCoreEventNames).to.include("Renewed");
      expect(savingCoreEventNames).to.include("Transfer");
      expect(savingCoreEventNames).to.not.include(
        "DepositOpened",
      );
      expect(savingCoreEventNames).to.not.include("Withdrawn");
    });

    it("allows manual renewal into the same enabled plan", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt + 1n);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          1n,
        );

      const oldDeposit = await savingCore.getDeposit(depositId);
      const newDeposit = await savingCore.getDeposit(2n);

      expect(oldDeposit.status).to.equal(2n);
      expect(newDeposit.planId).to.equal(1n);
      expect(newDeposit.principal).to.equal(
        principal + interest,
      );
      expect(newDeposit.tenorDays).to.equal(
        BigInt(DEFAULT_TENOR_DAYS),
      );
      expect(newDeposit.aprBpsAtOpen).to.equal(
        BigInt(DEFAULT_APR_BPS),
      );
      expect(newDeposit.penaltyBpsAtOpen).to.equal(
        BigInt(DEFAULT_PENALTY_BPS),
      );
      expect(newDeposit.status).to.equal(0n);
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.ownerOf(2n)).to.equal(
        other.address,
      );
    });
  });

  describe("Manual renewal boundaries and pause behavior", function () {
    it("rejects manual renewal one second before maturity without changing state", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, other } = fixture;
      const { depositId, principal, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();
      const beforeMaturity = maturityAt - 1n;

      await time.setNextBlockTimestamp(beforeMaturity);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotMatured",
        )
        .withArgs(
          depositId,
          maturityAt,
          beforeMaturity,
        );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await savingCore.depositCount()).to.equal(1n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("allows manual renewal one second before the grace-period end", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const gracePeriod = await savingCore.GRACE_PERIOD();
      const beforeGraceEnd =
        maturityAt + gracePeriod - 1n;

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(beforeGraceEnd);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          1n,
        );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        2n,
      );
      expect((await savingCore.getDeposit(2n)).status).to.equal(
        0n,
      );
    });

    it("rejects manual renewal at the exact grace-period end", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, other } = fixture;
      const { depositId, principal, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();
      const gracePeriod = await savingCore.GRACE_PERIOD();
      const graceEndsAt = maturityAt + gracePeriod;

      await time.setNextBlockTimestamp(graceEndsAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "ManualRenewalWindowClosed",
        )
        .withArgs(
          depositId,
          graceEndsAt,
          graceEndsAt,
        );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await savingCore.depositCount()).to.equal(1n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("rejects manual renewal after the grace-period end", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const gracePeriod = await savingCore.GRACE_PERIOD();
      const graceEndsAt = maturityAt + gracePeriod;
      const afterGraceEnd = graceEndsAt + 1n;

      await time.setNextBlockTimestamp(afterGraceEnd);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "ManualRenewalWindowClosed",
        )
        .withArgs(
          depositId,
          graceEndsAt,
          afterGraceEnd,
        );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await savingCore.depositCount()).to.equal(1n);
    });

    it("blocks manual renewal while SavingCore is paused", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();

      await fundVault(fixture, interest);
      await savingCore.connect(owner).pause();
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      ).to.be.revertedWithCustomError(
        savingCore,
        "EnforcedPause",
      );

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await savingCore.depositCount()).to.equal(1n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });
  });

  describe("Manual renewal plan validation and snapshots", function () {
    it("rejects invalid old-deposit identifiers", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;

      await expect(
        savingCore.connect(other).manualRenew(0n, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(0n);

      await expect(
        savingCore.connect(other).manualRenew(1n, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);

      expect(await savingCore.depositCount()).to.equal(0n);
    });

    it("rejects invalid and disabled selected plans without changing the old deposit", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const savingCoreAddress = await savingCore.getAddress();

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 0n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidPlanId",
        )
        .withArgs(0n);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidPlanId",
        )
        .withArgs(2n);

      await savingCore.connect(owner).createPlan(
        30,
        300,
        0n,
        0n,
        100,
        false,
      );

      await expect(
        savingCore.connect(other).manualRenew(depositId, 2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "PlanNotEnabled",
        )
        .withArgs(2n);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(1n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("rejects compounded principal below the selected plan minimum", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const newPrincipal = principal + interest;
      const requiredMinimum = newPrincipal + 1n;
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).createPlan(
        30,
        300,
        requiredMinimum,
        0n,
        100,
        true,
      );

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositBelowMinimum",
        )
        .withArgs(newPrincipal, requiredMinimum);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(1n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);
    });

    it("rejects compounded principal above the selected plan maximum", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);
      const newPrincipal = principal + interest;
      const allowedMaximum = newPrincipal - 1n;
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).createPlan(
        30,
        300,
        0n,
        allowedMaximum,
        100,
        true,
      );

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositAboveMaximum",
        )
        .withArgs(newPrincipal, allowedMaximum);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(1n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);
    });

    it("uses old snapshots after the old plan APR changes and the old plan is disabled", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await savingCore
        .connect(owner)
        .updatePlan(1n, 900);

      await savingCore
        .connect(owner)
        .disablePlan(1n);

      await savingCore.connect(owner).createPlan(
        45,
        425,
        0n,
        0n,
        225,
        true,
      );

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 2n),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          2n,
        );

      const oldDeposit =
        await savingCore.getDeposit(depositId);

      const newDeposit =
        await savingCore.getDeposit(2n);

      const oldPlan =
        await savingCore.getPlan(1n);

      expect(oldPlan.aprBps).to.equal(900n);
      expect(oldPlan.enabled).to.equal(false);

      expect(oldDeposit.aprBpsAtOpen).to.equal(
        BigInt(DEFAULT_APR_BPS),
      );

      expect(oldDeposit.tenorDays).to.equal(
        BigInt(DEFAULT_TENOR_DAYS),
      );

      expect(oldDeposit.penaltyBpsAtOpen).to.equal(
        BigInt(DEFAULT_PENALTY_BPS),
      );

      expect(oldDeposit.status).to.equal(2n);

      expect(newDeposit.planId).to.equal(2n);
      expect(newDeposit.principal).to.equal(
        principal + interest,
      );
      expect(newDeposit.tenorDays).to.equal(45n);
      expect(newDeposit.aprBpsAtOpen).to.equal(425n);
      expect(newDeposit.penaltyBpsAtOpen).to.equal(225n);
      expect(newDeposit.status).to.equal(0n);
    });

    it("skips zero-value interest payout and renews while VaultManager is paused", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, owner, other } = fixture;

      await savingCore.connect(owner).createPlan(
        1,
        1,
        0n,
        0n,
        0,
        true,
      );

      const depositId = 1n;
      const newDepositId = 2n;
      const principal = 1n;
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await token.mint(other.address, principal);

      await token
        .connect(other)
        .approve(savingCoreAddress, principal);

      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const oldDepositBefore =
        await savingCore.getDeposit(depositId);

      const interest = calculateInterest(
        oldDepositBefore.principal,
        oldDepositBefore.aprBpsAtOpen,
        oldDepositBefore.tenorDays,
      );

      expect(interest).to.equal(0n);

      await vault.connect(owner).pause();

      await time.setNextBlockTimestamp(
        oldDepositBefore.maturityAt,
      );

      const transaction = await savingCore
        .connect(other)
        .manualRenew(depositId, 1n);

      await expect(transaction)
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          newDepositId,
          principal,
          1n,
        );

      await expect(transaction).to.not.emit(
        vault,
        "InterestPaid",
      );

      const oldDepositAfter =
        await savingCore.getDeposit(depositId);

      const newDeposit =
        await savingCore.getDeposit(newDepositId);

      expect(oldDepositAfter.status).to.equal(2n);
      expect(newDeposit.principal).to.equal(principal);
      expect(newDeposit.status).to.equal(0n);

      expect(
        await token.balanceOf(other.address),
      ).to.equal(0n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(principal);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );

      expect(await savingCore.ownerOf(newDepositId)).to.equal(
        other.address,
      );
    });
  });

  describe("Manual renewal authorization and lifecycle", function () {
    it("transfers manual-renewal rights and the renewed NFT to the current owner", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        savingCore,
        owner,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          anotherAccount.address,
          depositId,
        );

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore
          .connect(other)
          .manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(
          depositId,
          other.address,
          anotherAccount.address,
        );

      await expect(
        savingCore
          .connect(owner)
          .manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(
          depositId,
          owner.address,
          anotherAccount.address,
        );

      await expect(
        savingCore
          .connect(anotherAccount)
          .manualRenew(depositId, 1n),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          1n,
        );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(2n);

      expect(
        (await savingCore.getDeposit(2n)).status,
      ).to.equal(0n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        anotherAccount.address,
      );

      expect(await savingCore.ownerOf(2n)).to.equal(
        anotherAccount.address,
      );

      expect(
        await savingCore.balanceOf(anotherAccount.address),
      ).to.equal(2n);

      expect(await savingCore.balanceOf(other.address)).to.equal(
        0n,
      );
    });

    it("does not allow an approved ERC721 operator to manually renew", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, owner, other } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      await savingCore
        .connect(other)
        .approve(owner.address, depositId);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      expect(await savingCore.getApproved(depositId)).to.equal(
        owner.address,
      );

      await expect(
        savingCore
          .connect(owner)
          .manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "NotDepositOwner",
        )
        .withArgs(
          depositId,
          owner.address,
          other.address,
        );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore
          .connect(other)
          .manualRenew(depositId, 1n),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          1n,
        );

      expect(await savingCore.ownerOf(2n)).to.equal(
        other.address,
      );
    });

    it("rejects a second manual renewal and retains both certificates", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const {
        depositId,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await savingCore
        .connect(other)
        .manualRenew(depositId, 1n);

      await expect(
        savingCore
          .connect(other)
          .manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 2n);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(2n);

      expect(
        (await savingCore.getDeposit(2n)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );

      expect(await savingCore.ownerOf(2n)).to.equal(
        other.address,
      );

      expect(await savingCore.balanceOf(other.address)).to.equal(
        2n,
      );
    });

    it("rejects manual renewal after maturity withdrawal has settled the deposit", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const {
        depositId,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await expect(
        savingCore
          .connect(other)
          .manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 1n);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(1n);

      expect(await savingCore.depositCount()).to.equal(1n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
    });

    it("rejects maturity and early withdrawal after manual renewal", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const {
        depositId,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await savingCore
        .connect(other)
        .manualRenew(depositId, 1n);

      await expect(
        savingCore
          .connect(other)
          .withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 2n);

      await expect(
        savingCore
          .connect(other)
          .earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 2n);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(2n);

      expect(
        (await savingCore.getDeposit(2n)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);
    });
  });

  describe("Manual renewal vault rollback", function () {
    it("fully rolls back when the vault is underfunded", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const availableInterest = interest - 1n;
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();
      await fundVault(fixture, availableInterest);

      const totalSupplyBefore = await token.totalSupply();

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          vault,
          "InsufficientVaultBalance",
        )
        .withArgs(availableInterest, interest);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(availableInterest);

      expect(
        await token.balanceOf(other.address),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );

      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });

    it("fully rolls back when VaultManager is paused", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, owner, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();
      await fundVault(fixture, interest);

      const totalSupplyBefore = await token.totalSupply();

      await vault.connect(owner).pause();
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      ).to.be.revertedWithCustomError(
        vault,
        "EnforcedPause",
      );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(interest);

      expect(
        await token.balanceOf(other.address),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );

      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });
  });

  describe("Manual renewal safe-mint rollback", function () {
    it("rolls back interest, deposit state, and new certificate when the current owner cannot receive ERC721", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      const MockNonERC721Receiver =
        await ethers.getContractFactory(
          "MockNonERC721Receiver",
        );

      const nonReceiver =
        await MockNonERC721Receiver.deploy(
          await token.getAddress(),
          savingCoreAddress,
        );

      await nonReceiver.waitForDeployment();

      const nonReceiverAddress =
        await nonReceiver.getAddress();

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          nonReceiverAddress,
          depositId,
        );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        nonReceiverAddress,
      );

      await fundVault(fixture, interest);

      const totalSupplyBefore =
        await token.totalSupply();

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        nonReceiver.manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "ERC721InvalidReceiver",
        )
        .withArgs(nonReceiverAddress);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        nonReceiverAddress,
      );

      expect(
        await savingCore.balanceOf(nonReceiverAddress),
      ).to.equal(1n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(interest);

      expect(
        await token.balanceOf(nonReceiverAddress),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );
    });
  });

  describe("Manual renewal token reentrancy protection", function () {
    it("blocks token callback reentrancy while completing the original renewal", async function () {
      const [owner, feeReceiver, other] =
        await ethers.getSigners();

      const MockReentrantToken =
        await ethers.getContractFactory(
          "MockReentrantToken",
        );

      const token = await MockReentrantToken.deploy();
      await token.waitForDeployment();

      const VaultManager =
        await ethers.getContractFactory("VaultManager");

      const vault = await VaultManager.deploy(
        await token.getAddress(),
        owner.address,
        feeReceiver.address,
      );

      await vault.waitForDeployment();

      const SavingCore =
        await ethers.getContractFactory("SavingCore");

      const savingCore = await SavingCore.deploy(
        await token.getAddress(),
        await vault.getAddress(),
        owner.address,
      );

      await savingCore.waitForDeployment();

      const savingCoreAddress =
        await savingCore.getAddress();

      const vaultAddress = await vault.getAddress();

      await vault
        .connect(owner)
        .authorizeSavingCore(savingCoreAddress);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const depositId = 1n;
      const newDepositId = 2n;
      const principal = amount("1000");

      await token.mint(other.address, principal);

      await token
        .connect(other)
        .approve(savingCoreAddress, principal);

      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const deposit =
        await savingCore.getDeposit(depositId);

      const interest = calculateInterest(
        deposit.principal,
        deposit.aprBpsAtOpen,
        deposit.tenorDays,
      );

      await token.mint(owner.address, interest);

      await token
        .connect(owner)
        .approve(vaultAddress, interest);

      await vault.connect(owner).fundVault(interest);

      const totalSupplyBefore =
        await token.totalSupply();

      await token.configureManualRenewReentry(
        savingCoreAddress,
        vaultAddress,
        depositId,
        1n,
        true,
      );

      await time.setNextBlockTimestamp(
        deposit.maturityAt,
      );

      await expect(
        savingCore
          .connect(other)
          .manualRenew(depositId, 1n),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          newDepositId,
          principal + interest,
          1n,
        );

      expect(await token.reentryAttempted()).to.equal(true);
      expect(await token.reentrySucceeded()).to.equal(false);

      expect(
        await token.lastReentryErrorSelector(),
      ).to.equal(
        ethers
          .id("ReentrancyGuardReentrantCall()")
          .slice(0, 10),
      );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(2n);

      expect(
        (await savingCore.getDeposit(newDepositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal + interest);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);

      expect(
        await token.balanceOf(other.address),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );

      expect(
        await savingCore.ownerOf(newDepositId),
      ).to.equal(other.address);
    });
  });

  describe("Manual renewal NFT callback reentrancy protection", function () {
    it("blocks receiver callback reentrancy while minting the renewed certificate", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      const MockDepositReceiver =
        await ethers.getContractFactory(
          "MockDepositReceiver",
        );

      const receiver = await MockDepositReceiver.deploy(
        await token.getAddress(),
        savingCoreAddress,
      );

      await receiver.waitForDeployment();

      const receiverAddress = await receiver.getAddress();

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          receiverAddress,
          depositId,
        );

      await fundVault(fixture, interest);

      const totalSupplyBefore = await token.totalSupply();

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        receiver.manualRenew(depositId, 1n, true),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          1n,
        );

      expect(await receiver.reentryAttempted()).to.equal(true);
      expect(await receiver.reentrySucceeded()).to.equal(false);

      expect(
        await receiver.lastReentryErrorSelector(),
      ).to.equal(
        ethers
          .id("ReentrancyGuardReentrantCall()")
          .slice(0, 10),
      );

      expect(await receiver.callbackOperator()).to.equal(
        receiverAddress,
      );

      expect(await receiver.callbackFrom()).to.equal(
        ethers.ZeroAddress,
      );

      expect(await receiver.callbackTokenId()).to.equal(2n);
      expect(await receiver.callbackData()).to.equal("0x");

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(2n);

      expect(
        (await savingCore.getDeposit(2n)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        receiverAddress,
      );

      expect(await savingCore.ownerOf(2n)).to.equal(
        receiverAddress,
      );

      expect(
        await savingCore.balanceOf(receiverAddress),
      ).to.equal(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal + interest);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);

      expect(
        await token.balanceOf(receiverAddress),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );
    });
  });

  describe("Manual renewal VaultManager authorization rollback", function () {
    it("rolls back manual renewal when SavingCore is not authorized by VaultManager", async function () {
      const fixture = await loadFixture(
        deploySavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest);

      const totalSupplyBefore =
        await token.totalSupply();

      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore
          .connect(other)
          .manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          vault,
          "UnauthorizedSavingCore",
        )
        .withArgs(savingCoreAddress);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(interest);

      expect(
        await token.balanceOf(other.address),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );

      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });
  });

  describe("Permissionless auto-renew core flow and boundary", function () {
    it("compounds one funded term at the exact grace-period end without transferring ownership to the caller", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        owner,
        other,
      } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const newDepositId = 2n;
      const newPrincipal = principal + interest;
      const gracePeriod = await savingCore.GRACE_PERIOD();
      const graceEndsAt = maturityAt + gracePeriod;
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest);

      const userBalanceBefore = await token.balanceOf(
        other.address,
      );
      const savingCoreBalanceBefore = await token.balanceOf(
        savingCoreAddress,
      );
      const vaultBalanceBefore = await token.balanceOf(
        vaultAddress,
      );
      const totalSupplyBefore = await token.totalSupply();

      await time.setNextBlockTimestamp(graceEndsAt);

      const transaction = await savingCore
        .connect(owner)
        .autoRenew(depositId);

      await expect(transaction)
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          newDepositId,
          newPrincipal,
          1n,
        );

      await expect(transaction)
        .to.emit(vault, "InterestPaid")
        .withArgs(
          savingCoreAddress,
          savingCoreAddress,
          interest,
        );

      await expect(transaction)
        .to.emit(savingCore, "Transfer")
        .withArgs(
          ethers.ZeroAddress,
          other.address,
          newDepositId,
        );

      const receipt = await transaction.wait();
      expect(receipt).to.not.equal(null);

      const transactionBlock = await ethers.provider.getBlock(
        receipt!.blockNumber,
      );
      expect(transactionBlock).to.not.equal(null);

      const renewedAt = BigInt(transactionBlock!.timestamp);
      const oldDeposit = await savingCore.getDeposit(depositId);
      const newDeposit = await savingCore.getDeposit(
        newDepositId,
      );

      expect(renewedAt).to.equal(graceEndsAt);
      expect(oldDeposit.status).to.equal(3n);
      expect(oldDeposit.principal).to.equal(principal);
      expect(oldDeposit.maturityAt).to.equal(maturityAt);

      expect(newDeposit.planId).to.equal(oldDeposit.planId);
      expect(newDeposit.principal).to.equal(newPrincipal);
      expect(newDeposit.startedAt).to.equal(renewedAt);
      expect(newDeposit.maturityAt).to.equal(
        renewedAt +
          oldDeposit.tenorDays * SECONDS_PER_DAY,
      );
      expect(newDeposit.tenorDays).to.equal(
        oldDeposit.tenorDays,
      );
      expect(newDeposit.aprBpsAtOpen).to.equal(
        oldDeposit.aprBpsAtOpen,
      );
      expect(newDeposit.penaltyBpsAtOpen).to.equal(
        oldDeposit.penaltyBpsAtOpen,
      );
      expect(newDeposit.status).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(
        newDepositId,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.ownerOf(newDepositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        2n,
      );
      expect(await savingCore.balanceOf(owner.address)).to.equal(
        0n,
      );

      expect(await token.balanceOf(other.address)).to.equal(
        userBalanceBefore,
      );
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        savingCoreBalanceBefore + interest,
      );
      expect(await token.balanceOf(vaultAddress)).to.equal(
        vaultBalanceBefore - interest,
      );
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      const savingCoreEventNames = receipt!.logs
        .filter(
          (log) =>
            log.address.toLowerCase() ===
            savingCoreAddress.toLowerCase(),
        )
        .map((log) => {
          try {
            return (
              savingCore.interface.parseLog(log)?.name ?? null
            );
          } catch {
            return null;
          }
        })
        .filter(
          (name): name is string => name !== null,
        );

      expect(savingCoreEventNames).to.include("Renewed");
      expect(savingCoreEventNames).to.include("Transfer");
      expect(savingCoreEventNames).to.not.include(
        "DepositOpened",
      );
      expect(savingCoreEventNames).to.not.include("Withdrawn");
    });

    it("rejects auto-renew one second before the grace-period end without changing state", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, anotherAccount, other } =
        fixture;
      const { depositId, principal, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const gracePeriod = await savingCore.GRACE_PERIOD();
      const graceEndsAt = maturityAt + gracePeriod;
      const beforeGraceEnd = graceEndsAt - 1n;
      const savingCoreAddress = await savingCore.getAddress();

      await time.setNextBlockTimestamp(beforeGraceEnd);

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "AutoRenewalTooEarly",
        )
        .withArgs(
          depositId,
          graceEndsAt,
          beforeGraceEnd,
        );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);
      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });
  });

  describe("Permissionless auto-renew validation and pause behavior", function () {
    it("rejects zero and nonexistent deposit identifiers", async function () {
      const { savingCore, other } = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );

      await expect(
        savingCore.connect(other).autoRenew(0n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(0n);

      await expect(
        savingCore.connect(other).autoRenew(1n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(1n);

      expect(await savingCore.depositCount()).to.equal(0n);
    });

    it("blocks auto-renew while SavingCore is paused without changing state", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        savingCore,
        owner,
        anotherAccount,
        other,
      } = fixture;
      const { depositId, principal, maturityAt } =
        await openDefaultMaturityDeposit(fixture);
      const gracePeriod = await savingCore.GRACE_PERIOD();
      const graceEndsAt = maturityAt + gracePeriod;
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).pause();
      await time.setNextBlockTimestamp(graceEndsAt);

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      ).to.be.revertedWithCustomError(
        savingCore,
        "EnforcedPause",
      );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);
      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });
  });

  describe("Permissionless auto-renew snapshots and delayed execution", function () {
    it("uses old deposit snapshots after the original plan APR changes and the plan is disabled", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        savingCore,
        owner,
        other,
        anotherAccount,
      } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const oldDepositBefore =
        await savingCore.getDeposit(depositId);

      await savingCore
        .connect(owner)
        .updatePlan(1n, 900n);

      await savingCore
        .connect(owner)
        .disablePlan(1n);

      const currentPlan = await savingCore.getPlan(1n);

      expect(currentPlan.aprBps).to.equal(900n);
      expect(currentPlan.enabled).to.equal(false);

      await fundVault(fixture, interest);

      const gracePeriod = await savingCore.GRACE_PERIOD();
      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          1n,
        );

      const oldDepositAfter =
        await savingCore.getDeposit(depositId);
      const newDeposit = await savingCore.getDeposit(2n);

      expect(oldDepositAfter.status).to.equal(3n);

      expect(newDeposit.planId).to.equal(
        oldDepositBefore.planId,
      );
      expect(newDeposit.principal).to.equal(
        principal + interest,
      );
      expect(newDeposit.tenorDays).to.equal(
        oldDepositBefore.tenorDays,
      );
      expect(newDeposit.aprBpsAtOpen).to.equal(
        oldDepositBefore.aprBpsAtOpen,
      );
      expect(newDeposit.penaltyBpsAtOpen).to.equal(
        oldDepositBefore.penaltyBpsAtOpen,
      );
      expect(newDeposit.status).to.equal(0n);

      expect(newDeposit.aprBpsAtOpen).to.equal(
        BigInt(DEFAULT_APR_BPS),
      );
      expect(newDeposit.aprBpsAtOpen).to.not.equal(
        currentPlan.aprBps,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.ownerOf(2n)).to.equal(
        other.address,
      );
      expect(
        await savingCore.balanceOf(anotherAccount.address),
      ).to.equal(0n);
    });

    it("creates only one new term when auto-renew is triggered several terms late", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const oldDeposit =
        await savingCore.getDeposit(depositId);
      const gracePeriod = await savingCore.GRACE_PERIOD();
      const tenorSeconds =
        oldDeposit.tenorDays * SECONDS_PER_DAY;

      const delayedAt =
        maturityAt +
        gracePeriod +
        tenorSeconds * 3n +
        123n;

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest);

      const totalSupplyBefore = await token.totalSupply();

      await time.setNextBlockTimestamp(delayedAt);

      const transaction = await savingCore
        .connect(anotherAccount)
        .autoRenew(depositId);

      await expect(transaction)
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          oldDeposit.planId,
        );

      await expect(transaction)
        .to.emit(vault, "InterestPaid")
        .withArgs(
          savingCoreAddress,
          savingCoreAddress,
          interest,
        );

      const receipt = await transaction.wait();
      expect(receipt).to.not.equal(null);

      const transactionBlock = await ethers.provider.getBlock(
        receipt!.blockNumber,
      );
      expect(transactionBlock).to.not.equal(null);

      const executedAt = BigInt(
        transactionBlock!.timestamp,
      );
      const newDeposit = await savingCore.getDeposit(2n);

      expect(executedAt).to.equal(delayedAt);
      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(3n);

      expect(newDeposit.principal).to.equal(
        principal + interest,
      );
      expect(newDeposit.startedAt).to.equal(delayedAt);
      expect(newDeposit.maturityAt).to.equal(
        delayedAt + tenorSeconds,
      );
      expect(newDeposit.status).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);
      expect(await savingCore.ownerOf(2n)).to.equal(
        other.address,
      );

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal + interest);
      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );
    });
  });

  describe("Permissionless auto-renew deposit limits and zero interest", function () {
    it("does not reapply the original plan maximum when compounded principal exceeds it", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        owner,
        other,
        anotherAccount,
      } = fixture;

      const principal = amount("1000");
      const savingCoreAddress = await savingCore.getAddress();

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        principal,
        principal,
        DEFAULT_PENALTY_BPS,
        true,
      );

      await token.mint(other.address, principal);

      await token
        .connect(other)
        .approve(savingCoreAddress, principal);

      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const oldDeposit = await savingCore.getDeposit(1n);
      const interest = calculateInterest(
        oldDeposit.principal,
        oldDeposit.aprBpsAtOpen,
        oldDeposit.tenorDays,
      );
      const newPrincipal = principal + interest;
      const plan = await savingCore.getPlan(1n);

      expect(interest).to.be.greaterThan(0n);
      expect(newPrincipal).to.be.greaterThan(
        plan.maxDeposit,
      );

      await fundVault(fixture, interest);

      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        oldDeposit.maturityAt + gracePeriod,
      );

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(1n),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          1n,
          2n,
          newPrincipal,
          1n,
        );

      const renewedDeposit = await savingCore.getDeposit(2n);

      expect(
        (await savingCore.getDeposit(1n)).status,
      ).to.equal(3n);
      expect(renewedDeposit.principal).to.equal(
        newPrincipal,
      );
      expect(renewedDeposit.principal).to.be.greaterThan(
        plan.maxDeposit,
      );
      expect(renewedDeposit.status).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);
      expect(await savingCore.ownerOf(2n)).to.equal(
        other.address,
      );
      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(newPrincipal);
      expect(
        await token.balanceOf(await vault.getAddress()),
      ).to.equal(0n);
    });

    it("skips the vault payout when interest rounds to zero and succeeds while VaultManager is paused", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        owner,
        other,
        anotherAccount,
      } = fixture;

      const principal = 1n;
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await savingCore.connect(owner).createPlan(
        1,
        1,
        0n,
        0n,
        DEFAULT_PENALTY_BPS,
        true,
      );

      await token.mint(other.address, principal);

      await token
        .connect(other)
        .approve(savingCoreAddress, principal);

      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const oldDeposit = await savingCore.getDeposit(1n);
      const interest = calculateInterest(
        oldDeposit.principal,
        oldDeposit.aprBpsAtOpen,
        oldDeposit.tenorDays,
      );

      expect(interest).to.equal(0n);

      await vault.connect(owner).pause();

      const totalSupplyBefore = await token.totalSupply();
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        oldDeposit.maturityAt + gracePeriod,
      );

      const transaction = await savingCore
        .connect(anotherAccount)
        .autoRenew(1n);

      await expect(transaction)
        .to.emit(savingCore, "Renewed")
        .withArgs(
          1n,
          2n,
          principal,
          1n,
        );

      await expect(transaction).to.not.emit(
        vault,
        "InterestPaid",
      );

      const newDeposit = await savingCore.getDeposit(2n);

      expect(
        (await savingCore.getDeposit(1n)).status,
      ).to.equal(3n);
      expect(newDeposit.principal).to.equal(principal);
      expect(newDeposit.status).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);
      expect(await savingCore.ownerOf(1n)).to.equal(
        other.address,
      );
      expect(await savingCore.ownerOf(2n)).to.equal(
        other.address,
      );

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);
      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );
    });
  });

  describe("Permissionless auto-renew ownership and terminal lifecycle", function () {
    it("mints the renewed certificate to the current NFT owner after ownership transfer", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        savingCore,
        owner,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          anotherAccount.address,
          depositId,
        );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        anotherAccount.address,
      );

      await fundVault(fixture, interest);

      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await expect(
        savingCore
          .connect(owner)
          .autoRenew(depositId),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          1n,
        );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(3n);
      expect(
        (await savingCore.getDeposit(2n)).status,
      ).to.equal(0n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        anotherAccount.address,
      );
      expect(await savingCore.ownerOf(2n)).to.equal(
        anotherAccount.address,
      );

      expect(
        await savingCore.balanceOf(anotherAccount.address),
      ).to.equal(2n);
      expect(await savingCore.balanceOf(other.address)).to.equal(
        0n,
      );
      expect(await savingCore.balanceOf(owner.address)).to.equal(
        0n,
      );
    });

    it("rejects repeated renewal and withdrawals after auto-renew settles the old deposit", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        savingCore,
        owner,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);

      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await savingCore
        .connect(anotherAccount)
        .autoRenew(depositId);

      await expect(
        savingCore
          .connect(owner)
          .autoRenew(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 3n);

      await expect(
        savingCore
          .connect(other)
          .withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 3n);

      await expect(
        savingCore
          .connect(other)
          .earlyWithdraw(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 3n);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(3n);
      expect(
        (await savingCore.getDeposit(2n)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);
      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.ownerOf(2n)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        2n,
      );
    });

    it("rejects auto-renew when maturity withdrawal settles first after the grace period", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest);

      const totalSupplyBefore = await token.totalSupply();
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await savingCore
        .connect(other)
        .withdrawAtMaturity(depositId);

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "DepositNotActive",
        )
        .withArgs(depositId, 1n);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(1n);
      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(0n);
      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);
      expect(await token.balanceOf(other.address)).to.equal(
        principal + interest,
      );
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );
    });
  });

  describe("Permissionless auto-renew VaultManager rollback", function () {
    it("fully rolls back when the vault is underfunded", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      const availableInterest = interest - 1n;
      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, availableInterest);

      const totalSupplyBefore = await token.totalSupply();
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      )
        .to.be.revertedWithCustomError(
          vault,
          "InsufficientVaultBalance",
        )
        .withArgs(availableInterest, interest);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);
      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);
      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(availableInterest);
      expect(await token.balanceOf(other.address)).to.equal(
        0n,
      );
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });

    it("fully rolls back positive-interest auto-renew when VaultManager is paused", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        owner,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest);
      await vault.connect(owner).pause();

      const totalSupplyBefore = await token.totalSupply();
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      ).to.be.revertedWithCustomError(
        vault,
        "EnforcedPause",
      );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);
      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);
      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(interest);
      expect(await token.balanceOf(other.address)).to.equal(
        0n,
      );
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });

    it("fully rolls back when SavingCore is not authorized by VaultManager", async function () {
      const fixture = await loadFixture(
        deploySavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await fundVault(fixture, interest);

      const totalSupplyBefore = await token.totalSupply();
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      )
        .to.be.revertedWithCustomError(
          vault,
          "UnauthorizedSavingCore",
        )
        .withArgs(savingCoreAddress);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);
      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);
      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(interest);
      expect(await token.balanceOf(other.address)).to.equal(
        0n,
      );
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );
      expect(await savingCore.balanceOf(other.address)).to.equal(
        1n,
      );
    });
  });

  describe("Permissionless auto-renew safe-mint rollback", function () {
    it("rolls back interest, deposit state, and the new certificate when the current owner cannot receive ERC721", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      const MockNonERC721Receiver =
        await ethers.getContractFactory(
          "MockNonERC721Receiver",
        );

      const nonReceiver =
        await MockNonERC721Receiver.deploy(
          await token.getAddress(),
          savingCoreAddress,
        );

      await nonReceiver.waitForDeployment();

      const nonReceiverAddress =
        await nonReceiver.getAddress();

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          nonReceiverAddress,
          depositId,
        );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        nonReceiverAddress,
      );

      await fundVault(fixture, interest);

      const totalSupplyBefore = await token.totalSupply();
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "ERC721InvalidReceiver",
        )
        .withArgs(nonReceiverAddress);

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(0n);
      expect(await savingCore.depositCount()).to.equal(1n);

      await expect(
        savingCore.getDeposit(2n),
      )
        .to.be.revertedWithCustomError(
          savingCore,
          "InvalidDepositId",
        )
        .withArgs(2n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        nonReceiverAddress,
      );
      expect(
        await savingCore.balanceOf(nonReceiverAddress),
      ).to.equal(1n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal);
      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(interest);
      expect(
        await token.balanceOf(nonReceiverAddress),
      ).to.equal(0n);
      expect(
        await token.balanceOf(anotherAccount.address),
      ).to.equal(0n);
      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );
    });
  });

  describe("Permissionless auto-renew reentrancy protection", function () {
    it("blocks token callback reentrancy while completing the original auto-renew", async function () {
      const [owner, feeReceiver, other, anotherAccount] =
        await ethers.getSigners();

      const MockReentrantToken =
        await ethers.getContractFactory(
          "MockReentrantToken",
        );

      const token = await MockReentrantToken.deploy();
      await token.waitForDeployment();

      const VaultManager =
        await ethers.getContractFactory("VaultManager");

      const vault = await VaultManager.deploy(
        await token.getAddress(),
        owner.address,
        feeReceiver.address,
      );

      await vault.waitForDeployment();

      const SavingCore =
        await ethers.getContractFactory("SavingCore");

      const savingCore = await SavingCore.deploy(
        await token.getAddress(),
        await vault.getAddress(),
        owner.address,
      );

      await savingCore.waitForDeployment();

      const savingCoreAddress =
        await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      await vault
        .connect(owner)
        .authorizeSavingCore(savingCoreAddress);

      await savingCore.connect(owner).createPlan(
        DEFAULT_TENOR_DAYS,
        DEFAULT_APR_BPS,
        DEFAULT_MIN_DEPOSIT,
        DEFAULT_MAX_DEPOSIT,
        DEFAULT_PENALTY_BPS,
        true,
      );

      const depositId = 1n;
      const newDepositId = 2n;
      const principal = amount("1000");

      await token.mint(other.address, principal);

      await token
        .connect(other)
        .approve(savingCoreAddress, principal);

      await savingCore
        .connect(other)
        .openDeposit(1n, principal);

      const oldDeposit =
        await savingCore.getDeposit(depositId);

      const interest = calculateInterest(
        oldDeposit.principal,
        oldDeposit.aprBpsAtOpen,
        oldDeposit.tenorDays,
      );

      await token.mint(owner.address, interest);

      await token
        .connect(owner)
        .approve(vaultAddress, interest);

      await vault.connect(owner).fundVault(interest);

      const totalSupplyBefore =
        await token.totalSupply();

      await token.configureAutoRenewReentry(
        savingCoreAddress,
        vaultAddress,
        depositId,
        true,
      );

      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        oldDeposit.maturityAt + gracePeriod,
      );

      await expect(
        savingCore
          .connect(anotherAccount)
          .autoRenew(depositId),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          newDepositId,
          principal + interest,
          1n,
        );

      expect(await token.reentryAttempted()).to.equal(true);
      expect(await token.reentrySucceeded()).to.equal(false);

      expect(
        await token.lastReentryErrorSelector(),
      ).to.equal(
        ethers
          .id("ReentrancyGuardReentrantCall()")
          .slice(0, 10),
      );

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(3n);

      expect(
        (await savingCore.getDeposit(newDepositId)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal + interest);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);

      expect(await token.balanceOf(other.address)).to.equal(
        0n,
      );

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );

      expect(await savingCore.ownerOf(depositId)).to.equal(
        other.address,
      );

      expect(
        await savingCore.ownerOf(newDepositId),
      ).to.equal(other.address);
    });

    it("blocks ERC721 receiver callback reentrancy while minting the renewed certificate", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        vault,
        savingCore,
        other,
        anotherAccount,
      } = fixture;
      const {
        depositId,
        principal,
        maturityAt,
        interest,
      } = await openDefaultMaturityDeposit(fixture);

      const savingCoreAddress = await savingCore.getAddress();
      const vaultAddress = await vault.getAddress();

      const MockDepositReceiver =
        await ethers.getContractFactory(
          "MockDepositReceiver",
        );

      const receiver = await MockDepositReceiver.deploy(
        await token.getAddress(),
        savingCoreAddress,
      );

      await receiver.waitForDeployment();

      const receiverAddress = await receiver.getAddress();

      await savingCore
        .connect(other)
        .transferFrom(
          other.address,
          receiverAddress,
          depositId,
        );

      await fundVault(fixture, interest);

      const totalSupplyBefore = await token.totalSupply();
      const gracePeriod = await savingCore.GRACE_PERIOD();

      await time.setNextBlockTimestamp(
        maturityAt + gracePeriod,
      );

      await expect(
        receiver.autoRenew(depositId, true),
      )
        .to.emit(savingCore, "Renewed")
        .withArgs(
          depositId,
          2n,
          principal + interest,
          1n,
        );

      expect(await receiver.reentryAttempted()).to.equal(true);
      expect(await receiver.reentrySucceeded()).to.equal(false);

      expect(
        await receiver.lastReentryErrorSelector(),
      ).to.equal(
        ethers
          .id("ReentrancyGuardReentrantCall()")
          .slice(0, 10),
      );

      expect(await receiver.callbackOperator()).to.equal(
        receiverAddress,
      );

      expect(await receiver.callbackFrom()).to.equal(
        ethers.ZeroAddress,
      );

      expect(await receiver.callbackTokenId()).to.equal(2n);
      expect(await receiver.callbackData()).to.equal("0x");

      expect(
        (await savingCore.getDeposit(depositId)).status,
      ).to.equal(3n);

      expect(
        (await savingCore.getDeposit(2n)).status,
      ).to.equal(0n);

      expect(await savingCore.depositCount()).to.equal(2n);

      expect(await savingCore.ownerOf(depositId)).to.equal(
        receiverAddress,
      );

      expect(await savingCore.ownerOf(2n)).to.equal(
        receiverAddress,
      );

      expect(
        await savingCore.balanceOf(receiverAddress),
      ).to.equal(2n);

      expect(
        await token.balanceOf(savingCoreAddress),
      ).to.equal(principal + interest);

      expect(
        await token.balanceOf(vaultAddress),
      ).to.equal(0n);

      expect(
        await token.balanceOf(receiverAddress),
      ).to.equal(0n);

      expect(
        await token.balanceOf(anotherAccount.address),
      ).to.equal(0n);

      expect(await token.totalSupply()).to.equal(
        totalSupplyBefore,
      );
    });
  });

  describe("C2 reserved-interest lifecycle", function () {
    it("reserves snapshot interest when opening an undercollateralized deposit", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, other } = fixture;

      await createDefaultPlan(fixture);

      const principal = amount("1000");
      const interest = calculateInterest(
        principal,
        BigInt(DEFAULT_APR_BPS),
        BigInt(DEFAULT_TENOR_DAYS),
      );

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(await savingCore.getAddress(), principal);

      await expect(
        savingCore.connect(other).openDeposit(1n, principal),
      )
        .to.emit(savingCore, "InterestReserved")
        .withArgs(1n, interest, interest);

      expect(await savingCore.totalReservedInterest()).to.equal(
        interest,
      );
      expect(await vault.totalReservedInterest()).to.equal(interest);
      expect(await vault.availableLiquidity()).to.equal(0n);
      expect(await vault.fundingShortfall()).to.equal(interest);
    });

    it("does not create a phantom reserve when interest rounds to zero", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, vault, savingCore, owner, other } = fixture;

      await savingCore.connect(owner).createPlan(
        1n,
        1n,
        0n,
        0n,
        0n,
        true,
      );

      const principal = 1n;

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(await savingCore.getAddress(), principal);
      await savingCore.connect(other).openDeposit(1n, principal);

      expect(await savingCore.totalReservedInterest()).to.equal(0n);
      expect(await vault.totalReservedInterest()).to.equal(0n);
      expect(await vault.fundingShortfall()).to.equal(0n);
    });

    it("uses APR snapshots and ignores later disabling and NFT transfer", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const {
        token,
        savingCore,
        owner,
        other,
        anotherAccount,
      } = fixture;

      await createDefaultPlan(fixture);

      const principal = amount("1000");
      const firstInterest = calculateInterest(
        principal,
        BigInt(DEFAULT_APR_BPS),
        BigInt(DEFAULT_TENOR_DAYS),
      );

      await token.mint(other.address, principal);
      await token
        .connect(other)
        .approve(await savingCore.getAddress(), principal);
      await savingCore.connect(other).openDeposit(1n, principal);

      const updatedApr = 400n;
      await savingCore.connect(owner).updatePlan(1n, updatedApr);

      const secondInterest = calculateInterest(
        principal,
        updatedApr,
        BigInt(DEFAULT_TENOR_DAYS),
      );

      await token.mint(anotherAccount.address, principal);
      await token
        .connect(anotherAccount)
        .approve(await savingCore.getAddress(), principal);
      await savingCore
        .connect(anotherAccount)
        .openDeposit(1n, principal);

      const expectedReserve = firstInterest + secondInterest;

      expect(await savingCore.totalReservedInterest()).to.equal(
        expectedReserve,
      );

      await savingCore.connect(owner).disablePlan(1n);
      await savingCore
        .connect(other)
        .transferFrom(other.address, anotherAccount.address, 1n);

      expect(await savingCore.totalReservedInterest()).to.equal(
        expectedReserve,
      );
    });

    it("rolls back a newly created reserve when deposit opening fails", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { token, savingCore, other } = fixture;

      await createDefaultPlan(fixture);

      const principal = amount("1000");
      await token.mint(other.address, principal);

      await expect(
        savingCore.connect(other).openDeposit(1n, principal),
      ).to.be.reverted;

      expect(await savingCore.totalReservedInterest()).to.equal(0n);
      expect(await savingCore.depositCount()).to.equal(0n);
    });

    it("releases the complete reserve on early withdrawal exactly once", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, interest } =
        await openDefaultMaturityDeposit(fixture);

      expect(await savingCore.totalReservedInterest()).to.equal(
        interest,
      );

      await expect(savingCore.connect(other).earlyWithdraw(depositId))
        .to.emit(savingCore, "ReservedInterestReleased")
        .withArgs(depositId, interest, 0n);

      expect(await savingCore.totalReservedInterest()).to.equal(0n);

      await expect(
        savingCore.connect(other).earlyWithdraw(depositId),
      ).to.be.revertedWithCustomError(
        savingCore,
        "DepositNotActive",
      );

      expect(await savingCore.totalReservedInterest()).to.equal(0n);
    });

    it("consumes the reserve after fully funded maturity settlement", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.emit(savingCore, "ReservedInterestConsumed")
        .withArgs(depositId, interest, 0n);

      expect(await savingCore.totalReservedInterest()).to.equal(0n);
      expect(await savingCore.pendingInterest(depositId)).to.equal(0n);
    });

    it("keeps deferred C1 interest reserved until a successful claim", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { vault, savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore.connect(other).withdrawAtMaturity(depositId);

      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await savingCore.totalReservedInterest()).to.equal(
        interest,
      );
      expect(await vault.fundingShortfall()).to.equal(interest);

      await fundVault(fixture, interest);

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      )
        .to.emit(savingCore, "ReservedInterestConsumed")
        .withArgs(depositId, interest, 0n);

      expect(await savingCore.pendingInterest(depositId)).to.equal(0n);
      expect(await savingCore.totalReservedInterest()).to.equal(0n);
      expect(await vault.totalReservedInterest()).to.equal(0n);
    });

    it("restores pending debt and reserve when a claim remains underfunded", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { vault, savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await time.setNextBlockTimestamp(maturityAt);
      await savingCore.connect(other).withdrawAtMaturity(depositId);

      const available = interest - 1n;
      await fundVault(fixture, available);

      await expect(
        savingCore.connect(other).claimPendingInterest(depositId),
      )
        .to.be.revertedWithCustomError(
          vault,
          "InsufficientVaultBalance",
        )
        .withArgs(available, interest);

      expect(await savingCore.pendingInterest(depositId)).to.equal(
        interest,
      );
      expect(await savingCore.totalReservedInterest()).to.equal(
        interest,
      );
    });

    it("atomically replaces the old reserve during manual renewal", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);
      await time.setNextBlockTimestamp(maturityAt);

      const newPrincipal = principal + interest;
      const newReserve = calculateInterest(
        newPrincipal,
        BigInt(DEFAULT_APR_BPS),
        BigInt(DEFAULT_TENOR_DAYS),
      );

      await savingCore.connect(other).manualRenew(depositId, 1n);

      expect(await savingCore.totalReservedInterest()).to.equal(
        newReserve,
      );
      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        2n,
      );
      expect((await savingCore.getDeposit(2n)).principal).to.equal(
        newPrincipal,
      );
    });

    it("atomically replaces the old reserve during auto-renewal", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { savingCore, other } = fixture;
      const { depositId, principal, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      await fundVault(fixture, interest);

      const gracePeriod = await savingCore.GRACE_PERIOD();
      await time.setNextBlockTimestamp(maturityAt + gracePeriod);

      const newPrincipal = principal + interest;
      const newReserve = calculateInterest(
        newPrincipal,
        BigInt(DEFAULT_APR_BPS),
        BigInt(DEFAULT_TENOR_DAYS),
      );

      await savingCore.connect(other).autoRenew(depositId);

      expect(await savingCore.totalReservedInterest()).to.equal(
        newReserve,
      );
      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        3n,
      );
      expect((await savingCore.getDeposit(2n)).principal).to.equal(
        newPrincipal,
      );
    });

    it("rolls back both old and new reserves when renewal is underfunded", async function () {
      const fixture = await loadFixture(
        deployAuthorizedSavingCoreFixture,
      );
      const { vault, savingCore, other } = fixture;
      const { depositId, maturityAt, interest } =
        await openDefaultMaturityDeposit(fixture);

      const available = interest - 1n;
      await fundVault(fixture, available);
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).manualRenew(depositId, 1n),
      )
        .to.be.revertedWithCustomError(
          vault,
          "InsufficientVaultBalance",
        )
        .withArgs(available, interest);

      expect(await savingCore.totalReservedInterest()).to.equal(
        interest,
      );
      expect(await savingCore.depositCount()).to.equal(1n);
      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
    });

    it("reverts when an internal reserve reduction exceeds aggregate liabilities", async function () {
      const { token, vault, owner } = await loadFixture(
        deploySavingCoreFixture,
      );

      const Harness = await ethers.getContractFactory(
        "MockSavingCoreHarness",
      );
      const harness = await Harness.deploy(
        await token.getAddress(),
        await vault.getAddress(),
        owner.address,
      );

      await harness.waitForDeployment();

      await expect(
        harness.exposeDecreaseReservedInterest(1n),
      )
        .to.be.revertedWithCustomError(
          harness,
          "InsufficientReservedInterest",
        )
        .withArgs(0n, 1n);

      expect(await harness.totalReservedInterest()).to.equal(0n);
    });
  });
});
