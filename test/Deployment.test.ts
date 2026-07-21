import { expect } from "chai";
import {
  deployments,
  ethers,
  getNamedAccounts,
} from "hardhat";

describe("Local deployment workflow", function () {
  const amount = (value: string) => ethers.parseUnits(value, 6);

  const DEFAULT_TENOR_DAYS = 180n;
  const DEFAULT_APR_BPS = 200n;
  const DEFAULT_MIN_DEPOSIT = amount("100");
  const DEFAULT_MAX_DEPOSIT = amount("10000");
  const DEFAULT_PENALTY_BPS = 750n;
  const EXPECTED_GRACE_PERIOD = 2n * 24n * 60n * 60n;

  const DEMO_USER_ONE_TARGET = amount("5000");
  const DEMO_USER_TWO_TARGET = amount("10000");
  const VAULT_TARGET_BALANCE = amount("25000");

  async function deployLocalDemoFixture() {
    await deployments.fixture(
      ["SeedDemo"],
      {
        fallbackToGlobal: false,
      },
    );

    const namedAccounts = await getNamedAccounts();

    const [
      tokenDeployment,
      vaultDeployment,
      savingCoreDeployment,
    ] = await Promise.all([
      deployments.get("MockUSDC"),
      deployments.get("VaultManager"),
      deployments.get("SavingCore"),
    ]);

    const token = await ethers.getContractAt(
      "MockUSDC",
      tokenDeployment.address,
    );

    const vault = await ethers.getContractAt(
      "VaultManager",
      vaultDeployment.address,
    );

    const savingCore = await ethers.getContractAt(
      "SavingCore",
      savingCoreDeployment.address,
    );

    return {
      namedAccounts,
      tokenDeployment,
      vaultDeployment,
      savingCoreDeployment,
      token,
      vault,
      savingCore,
    };
  }

  it("deploys the three production contracts with bytecode", async function () {
    const {
      tokenDeployment,
      vaultDeployment,
      savingCoreDeployment,
      token,
    } = await deployLocalDemoFixture();

    const addresses = [
      ethers.getAddress(tokenDeployment.address),
      ethers.getAddress(vaultDeployment.address),
      ethers.getAddress(savingCoreDeployment.address),
    ];

    expect(new Set(addresses).size).to.equal(3);

    for (const address of addresses) {
      expect(await ethers.provider.getCode(address)).to.not.equal("0x");
    }

    expect(await token.name()).to.equal("Mock USD Coin");
    expect(await token.symbol()).to.equal("mUSDC");
    expect(await token.decimals()).to.equal(6n);
  });

  it("wires ownership, fee receiver, token, vault, and authorization correctly", async function () {
    const {
      namedAccounts,
      tokenDeployment,
      vaultDeployment,
      savingCoreDeployment,
      vault,
      savingCore,
    } = await deployLocalDemoFixture();

    const {
      deployer,
      admin,
      feeReceiver,
      demoUserOne,
      demoUserTwo,
      keeper,
    } = namedAccounts;

    expect(ethers.getAddress(deployer)).to.equal(
      ethers.getAddress(admin),
    );

    const distinctOperationalRoles = [
      admin,
      feeReceiver,
      demoUserOne,
      demoUserTwo,
      keeper,
    ].map((address) => ethers.getAddress(address));

    expect(new Set(distinctOperationalRoles).size).to.equal(
      distinctOperationalRoles.length,
    );

    expect(await vault.token()).to.equal(tokenDeployment.address);
    expect(await vault.owner()).to.equal(admin);
    expect(await vault.pendingOwner()).to.equal(ethers.ZeroAddress);
    expect(await vault.feeReceiver()).to.equal(feeReceiver);
    expect(await vault.savingCore()).to.equal(
      savingCoreDeployment.address,
    );

    expect(await savingCore.token()).to.equal(
      tokenDeployment.address,
    );
    expect(await savingCore.vaultManager()).to.equal(
      vaultDeployment.address,
    );
    expect(await savingCore.owner()).to.equal(admin);
    expect(await savingCore.pendingOwner()).to.equal(
      ethers.ZeroAddress,
    );
  });

  it("preserves the Personal Variant and active contract state", async function () {
    const {
      vault,
      savingCore,
    } = await deployLocalDemoFixture();

    expect(await vault.paused()).to.equal(false);
    expect(await savingCore.paused()).to.equal(false);

    expect(await savingCore.GRACE_PERIOD()).to.equal(
      EXPECTED_GRACE_PERIOD,
    );

    expect(await savingCore.DEFAULT_TENOR_DAYS()).to.equal(
      DEFAULT_TENOR_DAYS,
    );

    expect(await savingCore.DEFAULT_APR_BPS()).to.equal(
      DEFAULT_APR_BPS,
    );

    expect(
      await savingCore.DEFAULT_EARLY_WITHDRAW_PENALTY_BPS(),
    ).to.equal(DEFAULT_PENALTY_BPS);
  });

  it("creates the canonical plan and deterministic demo funding", async function () {
    const {
      namedAccounts,
      token,
      vault,
      savingCore,
    } = await deployLocalDemoFixture();

    const {
      admin,
      demoUserOne,
      demoUserTwo,
    } = namedAccounts;

    const plan = await savingCore.getPlan(1n);

    expect(await savingCore.planCount()).to.equal(1n);
    expect(await savingCore.depositCount()).to.equal(0n);

    expect(plan.tenorDays).to.equal(DEFAULT_TENOR_DAYS);
    expect(plan.aprBps).to.equal(DEFAULT_APR_BPS);
    expect(plan.minDeposit).to.equal(DEFAULT_MIN_DEPOSIT);
    expect(plan.maxDeposit).to.equal(DEFAULT_MAX_DEPOSIT);
    expect(plan.earlyWithdrawPenaltyBps).to.equal(
      DEFAULT_PENALTY_BPS,
    );
    expect(plan.enabled).to.equal(true);

    expect(await token.balanceOf(demoUserOne)).to.equal(
      DEMO_USER_ONE_TARGET,
    );

    expect(await token.balanceOf(demoUserTwo)).to.equal(
      DEMO_USER_TWO_TARGET,
    );

    expect(await token.balanceOf(admin)).to.equal(0n);
    expect(await token.totalSupply()).to.equal(
      DEMO_USER_ONE_TARGET +
        DEMO_USER_TWO_TARGET +
        VAULT_TARGET_BALANCE,
    );

    expect(await vault.vaultBalance()).to.equal(
      VAULT_TARGET_BALANCE,
    );

    expect(await vault.totalReservedInterest()).to.equal(0n);

    expect(await vault.availableLiquidity()).to.equal(
      VAULT_TARGET_BALANCE,
    );

    expect(await vault.fundingShortfall()).to.equal(0n);
  });

  it("restores the seeded snapshot without duplicating state", async function () {
    const firstFixture = await deployLocalDemoFixture();

    const {
      demoUserOne,
    } = firstFixture.namedAccounts;

    const demoUserOneSigner = await ethers.getSigner(demoUserOne);

    await firstFixture.token
      .connect(demoUserOneSigner)
      .mint(demoUserOne, amount("1"));

    expect(
      await firstFixture.token.balanceOf(demoUserOne),
    ).to.equal(amount("5001"));

    const secondFixture = await deployLocalDemoFixture();

    expect(secondFixture.tokenDeployment.address).to.equal(
      firstFixture.tokenDeployment.address,
    );

    expect(secondFixture.vaultDeployment.address).to.equal(
      firstFixture.vaultDeployment.address,
    );

    expect(secondFixture.savingCoreDeployment.address).to.equal(
      firstFixture.savingCoreDeployment.address,
    );

    expect(
      await secondFixture.token.balanceOf(demoUserOne),
    ).to.equal(DEMO_USER_ONE_TARGET);

    expect(await secondFixture.savingCore.planCount()).to.equal(1n);
    expect(await secondFixture.savingCore.depositCount()).to.equal(0n);

    expect(await secondFixture.vault.vaultBalance()).to.equal(
      VAULT_TARGET_BALANCE,
    );

    expect(
      await secondFixture.vault.totalReservedInterest(),
    ).to.equal(0n);

    expect(
      await secondFixture.vault.availableLiquidity(),
    ).to.equal(VAULT_TARGET_BALANCE);

    expect(
      await secondFixture.vault.fundingShortfall(),
    ).to.equal(0n);
  });
});