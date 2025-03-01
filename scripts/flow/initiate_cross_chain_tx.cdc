import FlowArtistManager from 0x28736dfc4d9e84c6

transaction(artistId: String, amount: UFix64, targetChain: String, targetAddress: String) {
    prepare(signer: auth(Storage) &Account) {
        // First, let's create a grant and award it to have some funds
        let grantId = "grant-cross-chain"
        
        // Create a new grant
        FlowArtistManager.createGrant(
            grantId: grantId,
            title: "Cross-Chain Test Grant",
            amount: amount
        )
        
        // Award the grant to the artist
        FlowArtistManager.awardGrant(
            grantId: grantId,
            artistId: artistId
        )
        
        // Initiate the cross-chain transaction
        let txId = FlowArtistManager.initiateCrossChainTransaction(
            artistId: artistId,
            amount: amount,
            targetChain: targetChain,
            targetAddress: targetAddress
        )
        
        log("Cross-chain transaction initiated with ID: ".concat(txId))
    }

    execute {
        log("Cross-chain transaction initiated successfully")
    }
} 