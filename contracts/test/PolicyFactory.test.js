const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolicyFactory", function () {
  let PolicyFactory, policyFactory, OracleRegistry, oracle, GovernanceContract, governance, InsurancePool, pool, owner, user;

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

    PolicyFactory = await ethers.getContractFactory("PolicyFactory");
    policyFactory = await PolicyFactory.deploy(oracle.target, governance.target, pool.target);
    await policyFactory.waitForDeployment();

    // Grant role to user
    await governance.grantRole(await governance.POLICY_CREATOR_ROLE(), user.address);
  });

  it("Should create a policy with correct premium", async function () {
    const coverage = 1000;
    const expectedPremium = 100; // 1000 * 0.1

    const tx = await policyFactory.connect(user).createPolicy(coverage);
    const receipt = await tx.wait();
    const log = receipt.logs[0];
    const parsedLog = policyFactory.interface.parseLog(log);
    const policyAddress = parsedLog.args.policyAddress;

    expect(parsedLog.args.coverage).to.equal(coverage);
    expect(parsedLog.args.premium).to.equal(expectedPremium);
    expect(parsedLog.args.policyholder).to.equal(user.address);

    const IndividualPolicy = await ethers.getContractFactory("IndividualPolicy");
    const policy = IndividualPolicy.attach(policyAddress);

    expect(await policy.coverage()).to.equal(coverage);
    expect(await policy.premium()).to.equal(expectedPremium);
    expect(await policy.policyholder()).to.equal(user.address);
  });

  it("Should not create policy without role", async function () {
    const [,, otherUser] = await ethers.getSigners();
    const coverage = 1000;
    await expect(policyFactory.connect(otherUser).createPolicy(coverage)).to.be.revertedWith("Not authorized to create policy");
  });
});