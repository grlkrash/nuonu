import FlowArtistManager from 0x28736dfc4d9e84c6

transaction(artistId: String) {
    prepare(signer: auth(Storage) &Account) {
        // Distribute funds to the artist
        FlowArtistManager.distributeFunds(
            artistId: artistId
        )
    }

    execute {
        log("Funds distributed successfully")
    }
} 