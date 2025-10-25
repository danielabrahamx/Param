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
    expect(await pool.userDeposits(user.address)).to.equal(depositAmount);
    expect(await pool.totalLiquidity()).to.equal(depositAmount);
    expect(await pool.totalReserves()).to.equal(depositAmount);
  });

  it("Should allow withdrawals", async function () {
    await pool.connect(user).deposit({ value: depositAmount });
    await pool.connect(user).withdraw(depositAmount);
    expect(await pool.userDeposits(user.address)).to.equal(0);
    expect(await pool.totalLiquidity()).to.equal(0);
    expect(await pool.totalReserves()).to.equal(0);
  });

  it("Should handle payouts", async function () {
    await pool.deposit({ value: ethers.parseEther("2") }); // Owner deposits
    const payoutAmount = ethers.parseEther("1");
    const initialBalance = await ethers.provider.getBalance(user.address);
    await pool.payOut(user.address, payoutAmount);
    const finalBalance = await ethers.provider.getBalance(user.address);
    expect(finalBalance - initialBalance).to.equal(payoutAmount);
    expect(await pool.totalReserves()).to.equal(ethers.parseEther("1"));
  });

  it("Should enforce reserve ratio for payouts", async function () {
    await pool.deposit({ value: ethers.parseEther("1") });
    const payoutAmount = ethers.parseEther("1"); // Requires 1.5 ETH reserves
    await expect(pool.payOut(user.address, payoutAmount)).to.be.revertedWith("Insufficient reserves for payout");
  });

  it("Should pause and unpause", async function () {
    await pool.pause();
    await expect(pool.connect(user).deposit({ value: depositAmount })).to.be.revertedWith("Pausable: paused");
    await pool.unpause();
    await pool.connect(user).deposit({ value: depositAmount });
    expect(await pool.userDeposits(user.address)).to.equal(depositAmount);
  });
});