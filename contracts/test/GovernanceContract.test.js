const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceContract", function () {
  let GovernanceContract, governance, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    GovernanceContract = await ethers.getContractFactory("GovernanceContract");
    governance = await GovernanceContract.deploy(owner.address);
    await governance.waitForDeployment();
  });

  it("Should set default parameters", async function () {
    expect(await governance.floodThreshold()).to.equal(3000);
    expect(await governance.premiumRate()).to.equal(10);
  });

  it("Should allow admin to update parameters", async function () {
    await governance.updateFloodThreshold(4000);
    expect(await governance.floodThreshold()).to.equal(4000);

    await governance.updatePremiumRate(15);
    expect(await governance.premiumRate()).to.equal(15);
  });

  it("Should not allow non-admin to update parameters", async function () {
    await expect(governance.connect(user).updateFloodThreshold(4000)).to.be.reverted;
  });

  it("Should handle roles", async function () {
    expect(await governance.hasRole(await governance.ADMIN_ROLE(), owner.address)).to.be.true;
    await governance.grantRole(await governance.ORACLE_UPDATER_ROLE(), user.address);
    expect(await governance.hasRole(await governance.ORACLE_UPDATER_ROLE(), user.address)).to.be.true;
  });

  it("Should pause and unpause", async function () {
    await governance.pauseContract();
    expect(await governance.paused()).to.be.true;
    await governance.unpauseContract();
    expect(await governance.paused()).to.be.false;
  });
});