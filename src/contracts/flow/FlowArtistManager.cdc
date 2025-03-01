pub contract FlowArtistManager {
    // Define structures
    pub struct Artist {
        pub let id: String
        pub let address: Address
        pub let verified: Bool

        init(id: String, address: Address, verified: Bool) {
            self.id = id
            self.address = address
            self.verified = verified
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

    // State variables
    pub var artists: {String: Artist}
    pub var grants: {String: Grant}
    pub var grantApplications: {String: {String: Bool}}
    pub var pendingFunds: {String: UFix64}
    
    // Events
    pub event ArtistRegistered(artistId: String, address: Address)
    pub event GrantCreated(grantId: String, title: String, amount: UFix64)
    pub event GrantAwarded(grantId: String, artistId: String, amount: UFix64)
    pub event FundsDistributed(artistId: String, address: Address, amount: UFix64)
    
    init() {
        self.artists = {}
        self.grants = {}
        self.grantApplications = {}
        self.pendingFunds = {}
    }
    
    // Register an artist
    pub fun registerArtist(artistId: String, address: Address) {
        pre {
            address != nil: "Invalid address"
            artistId.length > 0: "Invalid artist ID"
            self.artists[artistId] == nil || !self.artists[artistId]!.verified: "Artist already registered"
        }
        
        let artist = Artist(id: artistId, address: address, verified: true)
        self.artists[artistId] = artist
        
        emit ArtistRegistered(artistId: artistId, address: address)
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
}
      