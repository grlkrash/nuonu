import { ethers } from "hardhat"

async function main() {
  console.log("Deploying ArtistFundManager contract...")

  const ArtistFundManager = await ethers.getContractFactory("ArtistFundManager")
  const artistFundManager = await ArtistFundManager.deploy()

  await artistFundManager.waitForDeployment()

  const address = await artistFundManager.getAddress()
  console.log(`ArtistFundManager deployed to: ${address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 