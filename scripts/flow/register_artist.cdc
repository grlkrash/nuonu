import FlowArtistManager from 0x28736dfc4d9e84c6

transaction(artistId: String, artistAddress: Address, optimismAddress: String) {
    prepare(signer: auth(Storage) &Account) {
        // Register the artist with the FlowArtistManager contract
        FlowArtistManager.registerArtist(
            artistId: artistId,
            address: artistAddress,
            optimismAddress: optimismAddress
        )
    }

    execute {
        log("Artist registered successfully")
    }
} 