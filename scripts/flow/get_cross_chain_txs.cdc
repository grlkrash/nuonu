import FlowArtistManager from 0x28736dfc4d9e84c6

access(all) fun main(artistId: String): [String] {
    let transactions = FlowArtistManager.getArtistCrossChainTransactions(artistId: artistId)
    let result: [String] = []
    
    for tx in transactions {
        let txInfo = "ID: ".concat(tx.id)
            .concat(", Amount: ").concat(tx.amount.toString())
            .concat(", Target Chain: ").concat(tx.targetChain)
            .concat(", Target Address: ").concat(tx.targetAddress)
            .concat(", Status: ").concat(tx.status)
        
        result.append(txInfo)
    }
    
    return result
} 