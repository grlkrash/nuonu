import { expect } from "chai"
import { ethers } from "hardhat"
import { ArtistFundManager } from "../src/artifacts/contracts/base/ArtistFundManager.sol/ArtistFundManager"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

describe("ArtistFundManager", function () {
  let artistFundManager: ArtistFundManager
  let owner: SignerWithAddress
  let artist: SignerWithAddress
  let funder: SignerWithAddress

  const ARTIST_ID = "artist1"
  const GRANT_ID = "grant1"
  const GRANT_TITLE = "Test Grant"
  const GRANT_AMOUNT = ethers.parseEther("1.0")

  beforeEach(async function () {
    [owner, artist, funder] = await ethers.getSigners()

    const ArtistFundManager = await ethers.getContractFactory("ArtistFundManager")
    artistFundManager = await ArtistFundManager.deploy()
    await artistFundManager.waitForDeployment()
  })

  describe("Artist Registration", function () {
    it("Should register an artist", async function () {
      await artistFundManager.registerArtist(ARTIST_ID, artist.address)
      const registeredArtist = await artistFundManager.getArtist(ARTIST_ID)
      
      expect(registeredArtist.wallet).to.equal(artist.address)
      expect(registeredArtist.verified).to.be.true
    })

    it("Should not register the same artist twice", async function () {
      await artistFundManager.registerArtist(ARTIST_ID, artist.address)
      
      await expect(
        artistFundManager.registerArtist(ARTIST_ID, artist.address)
      ).to.be.revertedWith("Artist already registered")
    })
  })

  describe("Grant Management", function () {
    it("Should create a grant", async function () {
      await artistFundManager.connect(funder).createGrant(
        GRANT_ID,
        GRANT_TITLE,
        GRANT_AMOUNT,
        { value: GRANT_AMOUNT }
      )

      const grant = await artistFundManager.getGrant(GRANT_ID)
      expect(grant.title).to.equal(GRANT_TITLE)
      expect(grant.amount).to.equal(GRANT_AMOUNT)
      expect(grant.funder).to.equal(funder.address)
      expect(grant.active).to.be.true
    })

    it("Should award grant to artist", async function () {
      // Register artist
      await artistFundManager.registerArtist(ARTIST_ID, artist.address)

      // Create grant
      await artistFundManager.connect(funder).createGrant(
        GRANT_ID,
        GRANT_TITLE,
        GRANT_AMOUNT,
        { value: GRANT_AMOUNT }
      )

      // Award grant
      await artistFundManager.awardGrant(GRANT_ID, ARTIST_ID)

      const pendingFunds = await artistFundManager.getPendingFunds(ARTIST_ID)
      expect(pendingFunds).to.equal(GRANT_AMOUNT)
    })

    it("Should distribute funds to artist", async function () {
      // Register artist
      await artistFundManager.registerArtist(ARTIST_ID, artist.address)

      // Create and award grant
      await artistFundManager.connect(funder).createGrant(
        GRANT_ID,
        GRANT_TITLE,
        GRANT_AMOUNT,
        { value: GRANT_AMOUNT }
      )
      await artistFundManager.awardGrant(GRANT_ID, ARTIST_ID)

      // Get artist's balance before distribution
      const balanceBefore = await ethers.provider.getBalance(artist.address)

      // Distribute funds
      await artistFundManager.distributeFunds(ARTIST_ID)

      // Get artist's balance after distribution
      const balanceAfter = await ethers.provider.getBalance(artist.address)

      // Verify the artist received the funds
      expect(balanceAfter - balanceBefore).to.equal(GRANT_AMOUNT)
    })
  })
}) 