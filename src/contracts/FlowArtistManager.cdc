// FlowArtistManager.cdc
// Contract for managing artist funds on Flow blockchain

pub contract FlowArtistManager {
    // Events
    pub event ArtistRegistered(artistId: String, address: Address)
    pub event FundsReceived(opportunityId: String, artistId: String, amount: UFix64)
    pub event FundsDistributed(artistId: String, address: Address, amount: UFix64)
    
    // Admin resource that can register artists and distribute funds
    pub resource Admin {
        // Register an artist with their address
        pub fun registerArtist(artistId: String, address: Address) {
            FlowArtistManager.artistAddresses[artistId] = address
            emit ArtistRegistered(artistId: artistId, address: address)
        }
        
        // Distribute funds to an artist
        pub fun distributeFunds(artistId: String) {
            let artistAddress = FlowArtistManager.artistAddresses[artistId] 
                ?? panic("Artist not registered")
            
            let amount = FlowArtistManager.pendingFunds[artistId] ?? 0.0
            if amount <= 0.0 {
                panic("No funds to distribute")
            }
            
            // Reset pending funds
            FlowArtistManager.pendingFunds[artistId] = 0.0
            
            // In a real implementation, this would transfer FLOW tokens
            // to the artist's address
            emit FundsDistributed(artistId: artistId, address: artistAddress, amount: amount)
        }
    }
    
    // Public function to receive funds for an artist
    pub fun receiveFunds(opportunityId: String, artistId: String, amount: UFix64) {
        let artistAddress = self.artistAddresses[artistId] 
            ?? panic("Artist not registered")
        
        if amount <= 0.0 {
            panic("Amount must be greater than 0")
        }
        
        // Add to pending funds
        let currentAmount = self.pendingFunds[artistId] ?? 0.0
        self.pendingFunds[artistId] = currentAmount + amount
        
        // Add to total funds received
        let currentTotal = self.totalFundsReceived[artistId] ?? 0.0
        self.totalFundsReceived[artistId] = currentTotal + amount
        
        emit FundsReceived(opportunityId: opportunityId, artistId: artistId, amount: amount)
    }
    
    // Public function to check if an artist is registered
    pub fun isArtistRegistered(artistId: String): Bool {
        return self.artistAddresses[artistId] != nil
    }
    
    // Public function to get an artist's address
    pub fun getArtistAddress(artistId: String): Address? {
        return self.artistAddresses[artistId]
    }
    
    // Public function to get pending funds for an artist
    pub fun getPendingFunds(artistId: String): UFix64 {
        return self.pendingFunds[artistId] ?? 0.0
    }
    
    // Public function to get total funds received by an artist
    pub fun getTotalFundsReceived(artistId: String): UFix64 {
        return self.totalFundsReceived[artistId] ?? 0.0
    }
    
    // Mappings to store artist data
    access(self) let artistAddresses: {String: Address}
    access(self) let pendingFunds: {String: UFix64}
    access(self) let totalFundsReceived: {String: UFix64}
    
    // Create a new Admin resource and keep it in storage
    init() {
        self.artistAddresses = {}
        self.pendingFunds = {}
        self.totalFundsReceived = {}
        
        // Create admin resource and save it to storage
        self.account.save(<-create Admin(), to: /storage/FlowArtistManagerAdmin)
    }
} 