pub contract FlowArtistManager {
    // Define structures
    pub struct Artist {
        pub let id: String
        pub let address: Address
        pub let verified: Bool
        pub let optimismAddress: String? // Added Optimism address for cross-chain functionality

        init(id: String, address: Address, verified: Bool, optimismAddress: String?) {
            self.id = id
            self.address = address
            self.verified = verified
            self.optimismAddress = optimismAddress
        }
    }

    pub struct Grant {
        pub let id: String
        pub let title: String
        pub let amount: UFix64
        pub let funder: Address
        pub let active: Bool

        init(id: String, title: String, amount: UFix64, funder: Address, active: Bool) {
            self.id = id
            self.title = title
            self.amount = amount
            self.funder = funder
            self.active = active
        }
    }

    // New struct for cross-chain transactions
    pub struct CrossChainTransaction {
        pub let id: String
        pub let artistId: String
        pub let amount: UFix64
        pub let targetChain: String
        pub let targetAddress: String
        pub let status: String // "initiated", "completed", "failed"
        pub let timestamp: UFix64

        init(
            id: String,
            artistId: String,
            amount: UFix64,
            targetChain: String,
            targetAddress: String,
            status: String,
            timestamp: UFix64
        ) {
            self.id = id
            self.artistId = artistId
            self.amount = amount
            self.targetChain = targetChain
            self.targetAddress = targetAddress
            self.status = status
            self.timestamp = timestamp
        }
    }

    // State variables
    pub var artists: {String: Artist}
    pub var grants: {String: Grant}
    pub var grantApplications: {String: {String: Bool}}
    pub var pendingFunds: {String: UFix64}
    pub var crossChainTransactions: {String: CrossChainTransaction} // Added for cross-chain transactions
    pub var optimismAddressToArtistId: {String: String} // Mapping from Optimism address to artist ID
    
    // Events
    pub event ArtistRegistered(artistId: String, address: Address, optimismAddress: String?)
    pub event GrantCreated(grantId: String, title: String, amount: UFix64)
    pub event GrantAwarded(grantId: String, artistId: String, amount: UFix64)
    pub event FundsDistributed(artistId: String, address: Address, amount: UFix64)
    pub event CrossChainTransactionInitiated(
        id: String,
        artistId: String,
        amount: UFix64,
        targetChain: String,
        targetAddress: String
    )
    pub event CrossChainTransactionStatusUpdated(id: String, status: String)
    
    init() {
        self.artists = {}
        self.grants = {}
        self.grantApplications = {}
        self.pendingFunds = {}
        self.crossChainTransactions = {}
        self.optimismAddressToArtistId = {}
    }
    
    // Register an artist with optional Optimism address
    pub fun registerArtist(artistId: String, address: Address, optimismAddress: String?) {
        pre {
            address != nil: "Invalid address"
            artistId.length > 0: "Invalid artist ID"
            self.artists[artistId] == nil || !self.artists[artistId]!.verified: "Artist already registered"
        }
        
        let artist = Artist(id: artistId, address: address, verified: true, optimismAddress: optimismAddress)
        self.artists[artistId] = artist
        
        // If Optimism address is provided, map it to the artist ID
        if optimismAddress != nil && optimismAddress!.length > 0 {
            self.optimismAddressToArtistId[optimismAddress!] = artistId
        }
        
        emit ArtistRegistered(artistId: artistId, address: address, optimismAddress: optimismAddress)
    }
    
    // Backward compatibility for existing code
    pub fun registerArtistLegacy(artistId: String, address: Address) {
        self.registerArtist(artistId: artistId, address: address, optimismAddress: nil)
    }
    
    // Create a new grant
    pub fun createGrant(grantId: String, title: String, amount: UFix64) {
        pre {
            grantId.length > 0: "Invalid grant ID"
            self.grants[grantId] == nil || !self.grants[grantId]!.active: "Grant already exists"
        }
        
        let grant = Grant(
            id: grantId,
            title: title,
            amount: amount,
            funder: self.account.address,
            active: true
        )
        
        self.grants[grantId] = grant
        
        emit GrantCreated(grantId: grantId, title: title, amount: amount)
    }
    
    // Award grant to artist
    pub fun awardGrant(grantId: String, artistId: String) {
        pre {
            self.grants[grantId] != nil && self.grants[grantId]!.active: "Grant not active"
            self.artists[artistId] != nil && self.artists[artistId]!.verified: "Artist not verified"
            self.grantApplications[grantId] == nil || self.grantApplications[grantId]![artistId] == nil || !self.grantApplications[grantId]![artistId]!: "Already awarded"
        }
        
        let grant = self.grants[grantId]!
        
        // Initialize the grant applications mapping if needed
        if self.grantApplications[grantId] == nil {
            self.grantApplications[grantId] = {}
        }
        
        self.grantApplications[grantId]![artistId] = true
        
        // Initialize or update pending funds
        if self.pendingFunds[artistId] == nil {
            self.pendingFunds[artistId] = grant.amount
        } else {
            self.pendingFunds[artistId] = self.pendingFunds[artistId]! + grant.amount
        }
        
        emit GrantAwarded(grantId: grantId, artistId: artistId, amount: grant.amount)
    }
    
    // Distribute funds to artist
    pub fun distributeFunds(artistId: String) {
        pre {
            self.artists[artistId] != nil && self.artists[artistId]!.verified: "Artist not verified"
            self.pendingFunds[artistId] != nil && self.pendingFunds[artistId]! > 0.0: "No funds to distribute"
        }
        
        let amount = self.pendingFunds[artistId]!
        let artistAddress = self.artists[artistId]!.address
        
        // Reset pending funds
        self.pendingFunds[artistId] = 0.0
        
        // In a real implementation, you would transfer FLOW tokens here
        // For this example, we'll just emit the event
        
        emit FundsDistributed(artistId: artistId, address: artistAddress, amount: amount)
    }
    
    // Initiate a cross-chain transaction to Optimism
    pub fun initiateCrossChainTransaction(
        artistId: String,
        amount: UFix64,
        targetChain: String,
        targetAddress: String
    ): String {
        pre {
            self.artists[artistId] != nil && self.artists[artistId]!.verified: "Artist not verified"
            self.pendingFunds[artistId] != nil && self.pendingFunds[artistId]! >= amount: "Insufficient funds"
            amount > 0.0: "Amount must be greater than zero"
            targetAddress.length > 0: "Invalid target address"
        }
        
        // Generate a unique transaction ID
        let txId = "ctx-".concat(artistId).concat("-").concat(self.account.address.toString()).concat("-").concat(getCurrentBlock().timestamp.toString())
        
        // Reduce pending funds
        self.pendingFunds[artistId] = self.pendingFunds[artistId]! - amount
        
        // Create cross-chain transaction record
        let crossChainTx = CrossChainTransaction(
            id: txId,
            artistId: artistId,
            amount: amount,
            targetChain: targetChain,
            targetAddress: targetAddress,
            status: "initiated",
            timestamp: getCurrentBlock().timestamp
        )
        
        self.crossChainTransactions[txId] = crossChainTx
        
        // Emit event
        emit CrossChainTransactionInitiated(
            id: txId,
            artistId: artistId,
            amount: amount,
            targetChain: targetChain,
            targetAddress: targetAddress
        )
        
        return txId
    }
    
    // Update cross-chain transaction status
    pub fun updateCrossChainTransactionStatus(txId: String, status: String) {
        pre {
            self.crossChainTransactions[txId] != nil: "Transaction not found"
            status.length > 0: "Invalid status"
        }
        
        let tx = self.crossChainTransactions[txId]!
        
        // Create updated transaction
        let updatedTx = CrossChainTransaction(
            id: tx.id,
            artistId: tx.artistId,
            amount: tx.amount,
            targetChain: tx.targetChain,
            targetAddress: tx.targetAddress,
            status: status,
            timestamp: tx.timestamp
        )
        
        // Update transaction
        self.crossChainTransactions[txId] = updatedTx
        
        // If the transaction failed, return funds to the artist
        if status == "failed" {
            if self.pendingFunds[tx.artistId] == nil {
                self.pendingFunds[tx.artistId] = tx.amount
            } else {
                self.pendingFunds[tx.artistId] = self.pendingFunds[tx.artistId]! + tx.amount
            }
        }
        
        // Emit event
        emit CrossChainTransactionStatusUpdated(id: txId, status: status)
    }
    
    // Get artist by Optimism address
    pub fun getArtistByOptimismAddress(optimismAddress: String): Artist? {
        let artistId = self.optimismAddressToArtistId[optimismAddress]
        if artistId == nil {
            return nil
        }
        return self.artists[artistId!]
    }
    
    // View functions
    pub fun getArtist(artistId: String): Artist? {
        return self.artists[artistId]
    }
    
    pub fun getGrant(grantId: String): Grant? {
        return self.grants[grantId]
    }
    
    pub fun getPendingFunds(artistId: String): UFix64 {
        if self.pendingFunds[artistId] == nil {
            return 0.0
        }
        return self.pendingFunds[artistId]!
    }
    
    pub fun getCrossChainTransaction(txId: String): CrossChainTransaction? {
        return self.crossChainTransactions[txId]
    }
    
    pub fun getArtistCrossChainTransactions(artistId: String): [CrossChainTransaction] {
        let transactions: [CrossChainTransaction] = []
        
        for txId in self.crossChainTransactions.keys {
            let tx = self.crossChainTransactions[txId]!
            if tx.artistId == artistId {
                transactions.append(tx)
            }
        }
        
        return transactions
    }
}
      