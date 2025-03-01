import FlowArtistManager from 0x28736dfc4d9e84c6

transaction(grantId: String, artistId: String) {
    prepare(signer: auth(Storage) &Account) {
        // Award the grant to the artist
        FlowArtistManager.awardGrant(
            grantId: grantId,
            artistId: artistId
        )
    }

    execute {
        log("Grant awarded successfully")
    }
} 