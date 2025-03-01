import FlowArtistManager from 0x28736dfc4d9e84c6

transaction(grantId: String, title: String, amount: UFix64) {
    prepare(signer: auth(Storage) &Account) {
        // Create a new grant
        FlowArtistManager.createGrant(
            grantId: grantId,
            title: title,
            amount: amount
        )
    }

    execute {
        log("Grant created successfully")
    }
} 