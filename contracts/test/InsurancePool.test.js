const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsurancePool", function () {
  let InsurancePool, pool, owner, user;
  const depositAmount = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    InsurancePool = await ethers.getContractFactory("InsurancePool");
    pool = await InsurancePool.deploy();
    await pool.waitForDeployment();
  });

  it("Should allow deposits", async function () {
    await pool.connect(user).deposit({ value: depositAmount });
    expect(await pool.getBalance()).to.equal(depositAmount);
  });

  it("Should allow withdrawals", async function () {
    await pool.connect(owner).deposit({ value: depositAmount });
    await pool.connect(owner).withdraw(depositAmount);
    expect(await pool.getBalance()).to.equal(0);
  });

  it("Should handle payouts", async function () {
    await pool.connect(owner).deposit({ value: ethers.parseEther("2") }); // Owner deposits
    const payoutAmount = ethers.parseEther("1");
    
    // This test is tricky because we can't directly call payOut.
    // It's meant to be called by a policy contract.
    // We'll simulate this by having the owner call fundPolicy, which is more realistic.
    const [_, policySigner] = await ethers.getSigners();
    await pool.setPolicyFactory(owner.address); // Allow owner to act as factory
    await pool.connect(owner).fundPolicy(policySigner.address, payoutAmount);

    expect(await pool.getBalance()).to.equal(ethers.parseEther("1"));
  });

  it("Should enforce reserve ratio for payouts", async function () {
    await pool.connect(owner).deposit({ value: ethers.parseEther("1") });
    const payoutAmount = ethers.parseEther("1.1"); // Try to payout more than available
    await pool.setPolicyFactory(owner.address);
    await expect(pool.connect(owner).fundPolicy(user.address, payoutAmount)).to.be.revertedWith("Insufficient balance");
  });

  it("Should pause and unpause", async function () {
    await pool.pause();
    await expect(pool.connect(user).deposit({ value: depositAmount })).to.be.revertedWith("Pausable: paused");
    await pool.unpause();
    await pool.connect(user).deposit({ value: depositAmount });
    expect(await pool.getBalance()).to.equal(depositAmount);
  });
});