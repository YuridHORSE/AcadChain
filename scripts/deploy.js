// scripts/deploy.js
// Run with:
// npx hardhat run scripts/deploy.js --network ganache
// npx hardhat run scripts/deploy.js --network sepolia

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying AcadChain with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const registry = await CredentialRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();

  console.log("✅ CredentialRegistry deployed to:", contractAddress);
  console.log("\n📋 Copy this address into your Angular environment.ts:\n");
  console.log(`  CONTRACT_ADDRESS: '${contractAddress}'`);
  console.log("\n🎓 Deployer wallet is already authorized as an institution.");
  console.log("   To authorize another institution wallet, run:");
  console.log("   await registry.authorizeInstitution('0xWallet', 'Institution Name', 'Region')");
  console.log("\n   If deployed to Sepolia, verify at:");
  console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});