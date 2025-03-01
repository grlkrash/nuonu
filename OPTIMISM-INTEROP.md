# Optimism Interoperability Features

This document outlines the Optimism interoperability features implemented in the GRLKRASHai contracts across multiple blockchains (Base, zkSync, and Flow).

## Overview

The contracts now support cross-chain transactions to Optimism, allowing artists to register with an Optimism address and transfer funds between chains. This enables a more seamless experience for artists and users across different blockchain ecosystems.

## Features

### 1. Artist Registration with Optimism Address

Artists can now register with an optional Optimism address, which enables them to receive funds on Optimism.

```solidity
// Example from Base/zkSync contracts
function registerArtist(string memory artistId, address artistAddress, address optimismAddress) public onlyOwner {
    require(bytes(artistId).length > 0, "Invalid artist ID");
    require(artistAddress != address(0), "Invalid artist address");
    
    artists[artistId] = Artist({
        id: artistId,
        walletAddress: artistAddress,
        verified: true,
        optimismAddress: optimismAddress,
        totalFunding: 0
    });
    
    emit ArtistRegistered(artistId, artistAddress, optimismAddress);
}
```

```cadence
// Example from Flow contract
pub fun registerArtist(artistId: String, address: Address, optimismAddress: String?) {
    pre {
        address != nil: "Invalid address"
        artistId.length > 0: "Invalid artist ID"
        self.artists[artistId] == nil || !self.artists[artistId]!.verified: "Artist already registered"
    }
    
    let artist = Artist(id: artistId, address: address, verified: true, optimismAddress: optimismAddress)
    self.artists[artistId] = artist
    
    emit ArtistRegistered(artistId: artistId, address: address)
}
```

### 2. Cross-Chain Transactions

The contracts now support initiating cross-chain transactions to Optimism, allowing funds to be transferred from one chain to another.

```solidity
// Example from Base/zkSync contracts
function initiateCrossChainTransaction(
    string memory artistId,
    uint256 amount,
    string memory targetChain,
    address targetAddress
) public onlyOwner returns (string memory) {
    require(bytes(artistId).length > 0, "Invalid artist ID");
    require(amount > 0, "Amount must be greater than zero");
    require(bytes(targetChain).length > 0, "Invalid target chain");
    require(targetAddress != address(0), "Invalid target address");
    
    Artist storage artist = artists[artistId];
    require(artist.verified, "Artist not verified");
    
    // Generate a unique transaction ID
    string memory txId = string(abi.encodePacked("ctx-", artistId, "-", block.timestamp));
    
    // Create cross-chain transaction record
    crossChainTransactions[txId] = CrossChainTransaction({
        id: txId,
        artistId: artistId,
        amount: amount,
        targetChain: targetChain,
        targetAddress: targetAddress,
        status: "initiated",
        timestamp: block.timestamp
    });
    
    // Emit event
    emit CrossChainTransactionInitiated(
        txId,
        artistId,
        amount,
        targetChain,
        targetAddress
    );
    
    return txId;
}
```

```cadence
// Example from Flow contract
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
```

### 3. Transaction Status Updates

Cross-chain transactions can be updated with status changes, allowing for tracking of the transaction lifecycle.

```solidity
// Example from Base/zkSync contracts
function updateCrossChainTransactionStatus(string memory txId, string memory status) public onlyOwner {
    require(bytes(txId).length > 0, "Invalid transaction ID");
    require(bytes(status).length > 0, "Invalid status");
    
    CrossChainTransaction storage tx = crossChainTransactions[txId];
    require(bytes(tx.id).length > 0, "Transaction not found");
    
    tx.status = status;
    
    emit CrossChainTransactionStatusUpdated(txId, status);
}
```

```cadence
// Example from Flow contract
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
    
    // Emit event
    emit CrossChainTransactionStatusUpdated(id: txId, status: status)
}
```

### 4. Lookup by Optimism Address

Artists can now be looked up by their Optimism address, enabling cross-chain identity verification.

```solidity
// Example from Base/zkSync contracts
function getArtistByOptimismAddress(address optimismAddress) public view returns (Artist memory) {
    for (uint256 i = 0; i < artistIds.length; i++) {
        Artist storage artist = artists[artistIds[i]];
        if (artist.optimismAddress == optimismAddress) {
            return artist;
        }
    }
    
    revert("Artist not found");
}
```

```cadence
// Example from Flow contract
pub fun getArtistByOptimismAddress(optimismAddress: String): Artist? {
    for artistId in self.artists.keys {
        let artist = self.artists[artistId]!
        if artist.optimismAddress == optimismAddress {
            return artist
        }
    }
    return nil
}
```

## Environment Variables

The following environment variables have been added to support Optimism interoperability:

```
NEXT_PUBLIC_OPTIMISM_RPC_URL=https://sepolia.optimism.io
NEXT_PUBLIC_OPTIMISM_CHAIN_ID=11155420
```

## Deployment

To deploy the contracts with Optimism interoperability features, run:

```bash
node scripts/deploy-all.js
```

This script will:
1. Deploy the Base contract with Optimism interoperability
2. Deploy the zkSync contract with Optimism interoperability
3. Deploy the Flow contract with Optimism interoperability
4. Run tests to verify the interoperability features
5. Update environment variables in `.env.local`

## Testing

Individual test scripts are available for each contract:

```bash
# Test Base contract Optimism interoperability
node scripts/test-base-optimism-interop.js

# Test zkSync contract Optimism interoperability
node scripts/test-zksync-optimism-interop.js

# Test Flow contract Optimism interoperability
node scripts/test-flow-optimism-interop.js
```

## Integration with UI

The UI components need to be updated to support the new Optimism interoperability features:

1. Add fields for Optimism address during artist registration
2. Display Optimism address in artist profiles
3. Add UI for initiating cross-chain transactions
4. Display cross-chain transaction history and status

## Future Enhancements

Potential future enhancements for Optimism interoperability:

1. Implement automatic cross-chain transaction verification
2. Add support for more chains beyond Optimism
3. Implement a cross-chain identity system
4. Create a unified dashboard for cross-chain assets and transactions

## Security Considerations

When implementing cross-chain transactions, consider the following security aspects:

1. Ensure proper validation of addresses across chains
2. Implement rate limiting for cross-chain transactions
3. Add multi-signature requirements for large cross-chain transfers
4. Monitor for suspicious cross-chain activity
5. Implement proper error handling for failed cross-chain transactions 