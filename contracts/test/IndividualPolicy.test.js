const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IndividualPolicy", function () {
  let IndividualPolicy, policy, OracleRegistry, oracle, GovernanceContract, governance, InsurancePool, pool, owner, user;
  const coverage = 1000;
  const premium = 100;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    GovernanceContract = await ethers.getContractFactory("GovernanceContract");
    governance = await GovernanceContract.deploy(owner.address);
    await governance.waitForDeployment();

    InsurancePool = await ethers.getContractFactory("InsurancePool");
    pool = await InsurancePool.deploy();
    await pool.waitForDeployment();

    OracleRegistry = await ethers.getContractFactory("OracleRegistry");
    oracle = await OracleRegistry.deploy(governance.target);
    await oracle.waitForDeployment();

    IndividualPolicy = await ethers.getContractFactory("IndividualPolicy");
    policy = await IndividualPolicy.deploy(coverage, premium, user.address, oracle.target, governance.target, pool.target);
    await policy.waitForDeployment();

    // Fund the pool
    await pool.deposit({ value: premium * 2 }); // Ensure enough reserves
  });

  it("Should store correct values", async function () {
    expect(await policy.coverage()).to.equal(coverage);
    expect(await policy.premium()).to.equal(premium);
    expect(await policy.policyholder()).to.equal(user.address);
    expect(await policy.payoutTriggered()).to.equal(false);
  });

  it("Should not trigger payout if flood level <= 3000", async function () {
    await oracle.updateFloodLevel(1, 2500);
    await expect(policy.triggerPayout()).to.be.revertedWith("Flood level not high enough for payout");
  });

  it("Should trigger payout if flood level > 3000", async function () {
    await oracle.updateFloodLevel(1, 3500);
    const initialBalance = await ethers.provider.getBalance(user.address);
    await policy.triggerPayout();
    const finalBalance = await ethers.provider.getBalance(user.address);
    expect(finalBalance - initialBalance).to.equal(premium);
    expect(await policy.payoutTriggered()).to.equal(true);
  });

  it("Should prevent multiple payouts", async function () {
    await oracle.updateFloodLevel(1, 3500);
    await policy.triggerPayout();
    await expect(policy.triggerPayout()).to.be.revertedWith("Payout already triggered");
  });

  it("Should not trigger payout if contract is paused", async function () {
    await governance.pauseContract();
    await oracle.updateFloodLevel(1, 3500);
    await expect(policy.triggerPayout()).to.be.revertedWith("Contract is paused");
  });
});