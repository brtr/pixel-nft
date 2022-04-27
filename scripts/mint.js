const hre = require("hardhat");

async function main() {
  const NFT = await hre.ethers.getContractFactory("TechBayTest");
  const { CONTRACT_ADDRESS } = process.env;
  const contract = NFT.attach(CONTRACT_ADDRESS);
  const price = "0.01"  // MINT PRICE
  await contract.mint({value: ethers.utils.parseUnits(price, 'ether')});
}
main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});