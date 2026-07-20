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
      await time.setNextBlockTimestamp(maturityAt);

      await expect(
        savingCore.connect(other).withdrawAtMaturity(depositId),
      )
        .to.be.revertedWithCustomError(
          vault,
          "InsufficientVaultBalance",
        )
        .withArgs(availableInterest, interest);

      expect((await savingCore.getDeposit(depositId)).status).to.equal(
        0n,
      );
      expect(await token.balanceOf(other.address)).to.equal(0n);
      expect(await token.balanceOf(savingCoreAddress)).to.equal(
        principal,
      );
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
});