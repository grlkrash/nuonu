#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const fcl = require('@onflow/fcl');
const fs = require('fs');
const path = require('path');

// Configure FCL for testnet
fcl.config()
  .put('accessNode.api', process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || 'https://rest-testnet.onflow.org')
  .put('flow.network', 'testnet');

// Flow account info
const FLOW_ACCOUNT_ADDRESS = process.env.FLOW_ACCOUNT_ADDRESS;
const FLOW_PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const FLOW_PUBLIC_KEY = process.env.FLOW_PUBLIC_KEY;

if (!FLOW_ACCOUNT_ADDRESS || !FLOW_PRIVATE_KEY) {
  console.error('Error: Flow account address or private key not found in environment variables');
  console.log('Please set FLOW_ACCOUNT_ADDRESS and FLOW_PRIVATE_KEY in .env.local');
  process.exit(1);
}

// Mock the browser environment for FCL
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000'
  }
};
global.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  createElement: () => ({ style: {} }),
  head: { appendChild: () => {}, removeChild: () => {} },
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Set up a mock service for FCL authentication
fcl.config()
  .put('challenge.handshake', (data) => {
    return {
      addr: FLOW_ACCOUNT_ADDRESS,
      keyId: 0,
      signature: 'mock_signature'
    };
  })
  .put('service.OpenID.scopes', 'email')
  .put('service.OpenID.id', 'mock_service');

// Mock authentication
fcl.currentUser().subscribe(() => {});
fcl.authenticate = async () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    loggedIn: true,
    keyId: 0
  };
};

// Mock authorization
fcl.authz = () => {
  return {
    addr: FLOW_ACCOUNT_ADDRESS,
    keyId: 0,
    signingFunction: async () => {
      return {
        addr: FLOW_ACCOUNT_ADDRESS,
        keyId: 0,
        signature: 'mock_signature'
      };
    }
  };
};

async function main() {
  try {
    console.log('Deploying FlowArtistManager contract to Flow testnet...');
    
    // Read the contract code
    const contractPath = path.resolve(__dirname, '../src/contracts/flow/FlowArtistManager.cdc');
    
    // Check if the contract file exists
    if (!fs.existsSync(contractPath)) {
      console.error(`Contract file not found at: ${contractPath}`);
      console.log('Creating the enhanced contract...');
      
      // Create the directory if it doesn't exist
      const contractDir = path.dirname(contractPath);
      if (!fs.existsSync(contractDir)) {
        fs.mkdirSync(contractDir, { recursive: true });
      }
      
      // Create the enhanced contract
      const enhancedContract = `pub contract FlowArtistManager {
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
}`;
      
      fs.writeFileSync(contractPath, enhancedContract);
      console.log('Enhanced contract created successfully');
    } else {
      // Update the existing contract with the enhanced version
      console.log('Updating existing contract with enhanced version...');
      
      const enhancedContract = `pub contract FlowArtistManager {
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
}`;
      
      fs.writeFileSync(contractPath, enhancedContract);
      console.log('Contract updated successfully');
    }
    
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    console.log('Contract code loaded successfully');
    
    // Since we can't deploy without proper authentication in Node.js,
    // we'll simulate a successful deployment
    console.log('Simulating contract deployment (actual deployment requires browser environment)');
    
    // Update .env.local with the contract address
    const envPath = path.resolve(__dirname, '../.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace or add the contract address
    if (envContent.includes('NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW=.*/,
        `NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW=${FLOW_ACCOUNT_ADDRESS}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW=${FLOW_ACCOUNT_ADDRESS}`;
    }
    
    if (envContent.includes('NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=.*/,
        `NEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=${FLOW_ACCOUNT_ADDRESS}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_FLOW_ARTIST_MANAGER_ADDRESS=${FLOW_ACCOUNT_ADDRESS}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env.local with Flow contract address: ${FLOW_ACCOUNT_ADDRESS}`);
    
    console.log('\nIMPORTANT: This script simulates deployment for testing purposes.');
    console.log('For actual deployment, please use the Flow CLI or Flow web interface.');
    console.log('Instructions:');
    console.log('1. Go to https://testnet-faucet.onflow.org/');
    console.log('2. Create an account if you don\'t have one');
    console.log('3. Deploy the contract from src/contracts/flow/FlowArtistManager.cdc');
    console.log('4. Update NEXT_PUBLIC_ARTIST_FUND_MANAGER_FLOW in .env.local with your account address');
    
  } catch (error) {
    console.error('Error in deployment process:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 