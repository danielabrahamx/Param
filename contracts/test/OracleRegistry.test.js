const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OracleRegistry", function () {
  let OracleRegistry, oracle, GovernanceContract, governance, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    GovernanceContract = await ethers.getContractFactory("GovernanceContract");
    governance = await GovernanceContract.deploy(owner.address);
    await governance.waitForDeployment();

    OracleRegistry = await ethers.getContractFactory("OracleRegistry");
    oracle = await OracleRegistry.deploy(governance.target);
    await oracle.waitForDeployment();
  });

  it("Should update and get flood level", async function () {
    const regionId = 1;
    const level = 2500;

    await oracle.updateFloodLevel(regionId, level);
    expect(await oracle.getLatestFloodLevel(regionId)).to.equal(level);
  });

  it("Should only allow authorized to update", async function () {
    const regionId = 1;
    const level = 2500;

    await expect(oracle.connect(user).updateFloodLevel(regionId, level)).to.be.revertedWith("Not authorized");
  });
});