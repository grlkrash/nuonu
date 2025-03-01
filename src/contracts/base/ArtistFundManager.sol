// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ArtistFundManager is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    struct Grant {
        string id;
        string title;
        uint256 amount;
        address funder;
        bool active;
    }

    struct Artist {
        string id;
        address wallet;
        address optimismAddress;
        bool verified;
    }

    struct CrossChainTransaction {
        uint256 id;
        string artistId;
        uint256 amount;
        string targetChain;
        address targetAddress;
        string status;
        uint256 timestamp;
    }

    event ArtistRegistered(string indexed artistId, address indexed wallet, address optimismAddress);
    event GrantCreated(string indexed grantId, string title, uint256 amount);
    event GrantAwarded(string indexed grantId, string indexed artistId, uint256 amount);
    event FundsDistributed(string indexed artistId, address indexed wallet, uint256 amount);
    event CrossChainTransactionInitiated(uint256 indexed txId, string indexed artistId, uint256 amount, string targetChain, address targetAddress);
    event CrossChainTransactionUpdated(uint256 indexed txId, string status);
    event ArtistOptimismAddressUpdated(string indexed artistId, address indexed optimismAddress);

    mapping(string => Artist) public artists;
    mapping(string => Grant) public grants;
    mapping(string => mapping(string => bool)) public grantApplications;
    mapping(string => uint256) public pendingFunds;
    mapping(uint256 => CrossChainTransaction) public crossChainTransactions;
    mapping(address => string) public optimismAddressToArtistId;
    Counters.Counter private _crossChainTxIds;
    Counters.Counter private _grantIds;

    constructor() {
    }

    function registerArtist(string memory artistId, address wallet, address optimismAddress) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        require(bytes(artistId).length > 0, "Invalid artist ID");
        require(!artists[artistId].verified, "Artist already registered");

        artists[artistId] = Artist(artistId, wallet, optimismAddress, true);
        
        if (optimismAddress != address(0)) {
            optimismAddressToArtistId[optimismAddress] = artistId;
        }
        
        emit ArtistRegistered(artistId, wallet, optimismAddress);
    }

    function registerArtistSimple(string memory artistId, address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        require(bytes(artistId).length > 0, "Invalid artist ID");
        require(!artists[artistId].verified, "Artist already registered");

        artists[artistId] = Artist(artistId, wallet, address(0), true);
        
        emit ArtistRegistered(artistId, wallet, address(0));
    }

    function updateArtistOptimismAddress(string memory artistId, address optimismAddress) external onlyOwner {
        require(artists[artistId].verified, "Artist not registered");
        require(optimismAddress != address(0), "Invalid optimism address");
        
        // Update the optimism address
        artists[artistId].optimismAddress = optimismAddress;
        
        // Map the optimism address to the artist ID
        optimismAddressToArtistId[optimismAddress] = artistId;
        
        emit ArtistOptimismAddressUpdated(artistId, optimismAddress);
    }

    function createGrant(string memory grantId, string memory title, uint256 amount) external payable {
        require(msg.value == amount, "Incorrect fund amount");
        require(bytes(grantId).length > 0, "Invalid grant ID");
        require(!grants[grantId].active, "Grant already exists");

        grants[grantId] = Grant(grantId, title, amount, msg.sender, true);
        emit GrantCreated(grantId, title, amount);
    }

    function awardGrant(string memory grantId, string memory artistId) external onlyOwner {
        require(grants[grantId].active, "Grant not active");
        require(artists[artistId].verified, "Artist not verified");
        require(!grantApplications[grantId][artistId], "Already awarded");

        Grant storage grant = grants[grantId];
        grantApplications[grantId][artistId] = true;
        pendingFunds[artistId] += grant.amount;

        emit GrantAwarded(grantId, artistId, grant.amount);
    }

    function distributeFunds(string memory artistId) external nonReentrant {
        Artist storage artist = artists[artistId];
        require(artist.verified, "Artist not verified");
        
        uint256 amount = pendingFunds[artistId];
        require(amount > 0, "No funds to distribute");
        
        pendingFunds[artistId] = 0;
        
        (bool success, ) = artist.wallet.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsDistributed(artistId, artist.wallet, amount);
    }

    function initiateCrossChainTransaction(
        string memory artistId, 
        uint256 amount, 
        string memory targetChain, 
        address targetAddress
    ) external onlyOwner nonReentrant returns (uint256) {
        Artist storage artist = artists[artistId];
        require(artist.verified, "Artist not verified");
        require(pendingFunds[artistId] >= amount, "Insufficient funds");
        
        pendingFunds[artistId] -= amount;
        
        _crossChainTxIds.increment();
        uint256 txId = _crossChainTxIds.current();
        
        crossChainTransactions[txId] = CrossChainTransaction(
            txId,
            artistId,
            amount,
            targetChain,
            targetAddress,
            "pending",
            block.timestamp
        );
        
        emit CrossChainTransactionInitiated(txId, artistId, amount, targetChain, targetAddress);
        
        return txId;
    }
    
    function updateCrossChainTransactionStatus(uint256 txId, string memory status) external onlyOwner {
        require(crossChainTransactions[txId].id == txId, "Transaction does not exist");
        
        crossChainTransactions[txId].status = status;
        
        emit CrossChainTransactionUpdated(txId, status);
        
        if (keccak256(bytes(status)) == keccak256(bytes("failed"))) {
            string memory artistId = crossChainTransactions[txId].artistId;
            uint256 amount = crossChainTransactions[txId].amount;
            pendingFunds[artistId] += amount;
        }
    }

    function getArtistByOptimismAddress(address optimismAddress) external view returns (Artist memory) {
        string memory artistId = optimismAddressToArtistId[optimismAddress];
        require(bytes(artistId).length > 0, "Artist not found");
        return artists[artistId];
    }
    
    function getCrossChainTransaction(uint256 txId) external view returns (CrossChainTransaction memory) {
        require(crossChainTransactions[txId].id == txId, "Transaction does not exist");
        return crossChainTransactions[txId];
    }

    function getArtist(string memory artistId) external view returns (Artist memory) {
        return artists[artistId];
    }

    function getGrant(string memory grantId) external view returns (Grant memory) {
        return grants[grantId];
    }

    function getPendingFunds(string memory artistId) external view returns (uint256) {
        return pendingFunds[artistId];
    }

    receive() external payable {}
} 