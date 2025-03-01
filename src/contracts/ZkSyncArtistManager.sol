// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ZkSyncArtistManager
 * @dev Contract for managing artist funds on zkSync Era with Optimism interoperability
 */
contract ZkSyncArtistManager is Ownable, ReentrancyGuard {
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
        address optimismAddress; // Added Optimism address for cross-chain functionality
        bool verified;
    }

    struct Application {
        string id;
        string contentHash;
        address artistAddress;
        string grantId;
        uint8 status; // 0: Pending, 1: Approved, 2: Rejected
        uint256 timestamp;
    }

    // New struct for cross-chain transactions
    struct CrossChainTransaction {
        uint256 id;
        string artistId;
        uint256 amount;
        string targetChain;
        address targetAddress;
        string status; // "pending", "completed", "failed"
        uint256 timestamp;
    }

    // Events
    event ArtistRegistered(string indexed artistId, address indexed wallet, address optimismAddress);
    event GrantCreated(string indexed grantId, string title, uint256 amount);
    event GrantAwarded(string indexed grantId, string indexed artistId, uint256 amount);
    event FundsDistributed(string indexed artistId, address indexed wallet, uint256 amount);
    event ApplicationSubmitted(string indexed applicationId, string indexed grantId, address indexed artist);
    event SessionKeyAdded(string indexed artistId, address sessionKey);
    event SessionKeyRemoved(string indexed artistId, address sessionKey);
    // New events for cross-chain transactions
    event CrossChainTransactionInitiated(uint256 indexed txId, string indexed artistId, uint256 amount, string targetChain, address targetAddress);
    event CrossChainTransactionUpdated(uint256 indexed txId, string status);

    // State variables
    mapping(string => Artist) public artists;
    mapping(string => Grant) public grants;
    mapping(string => mapping(string => bool)) public grantApplications;
    mapping(string => uint256) public pendingFunds;
    mapping(string => Application) public applications;
    mapping(string => address[]) public artistSessionKeys;
    // New state variables for cross-chain transactions
    mapping(uint256 => CrossChainTransaction) public crossChainTransactions;
    mapping(address => string) public optimismAddressToArtistId;
    Counters.Counter private _crossChainTxIds;

    Counters.Counter private _grantIds;
    
    /**
     * @dev Constructor sets the owner to the deployer of the contract
     */
    constructor() {
        // The Ownable constructor automatically sets msg.sender as owner
    }
    
    /**
     * @dev Modifier to restrict functions to the artist or their session keys
     * @param artistId The unique identifier for the artist
     */
    modifier onlyArtistOrSessionKey(string memory artistId) {
        bool isAuthorized = false;
        
        // Check if sender is the artist's wallet
        if (msg.sender == artists[artistId].wallet) {
            isAuthorized = true;
        } else {
            // Check if sender is one of the artist's session keys
            address[] memory sessionKeys = artistSessionKeys[artistId];
            for (uint i = 0; i < sessionKeys.length; i++) {
                if (msg.sender == sessionKeys[i]) {
                    isAuthorized = true;
                    break;
                }
            }
        }
        
        require(isAuthorized, "Not authorized");
        _;
    }
    
    /**
     * @dev Register an artist with their wallet address and optional Optimism address
     * @param artistId The unique identifier for the artist
     * @param wallet The artist's wallet address
     * @param optimismAddress The artist's Optimism address (optional)
     */
    function registerArtist(string memory artistId, address wallet, address optimismAddress) public onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        require(bytes(artistId).length > 0, "Invalid artist ID");
        require(!artists[artistId].verified, "Artist already registered");

        artists[artistId] = Artist(artistId, wallet, optimismAddress, true);
        
        // If Optimism address is provided, map it to the artist ID
        if (optimismAddress != address(0)) {
            optimismAddressToArtistId[optimismAddress] = artistId;
        }
        
        emit ArtistRegistered(artistId, wallet, optimismAddress);
    }

    /**
     * @dev Register an artist with their wallet address (backward compatibility)
     * @param artistId The unique identifier for the artist
     * @param wallet The artist's wallet address
     */
    function registerArtist(string memory artistId, address wallet) public onlyOwner {
        registerArtist(artistId, wallet, address(0));
    }

    /**
     * @dev Create a new grant
     * @param grantId The unique identifier for the grant
     * @param title The title of the grant
     * @param amount The amount of the grant
     */
    function createGrant(string memory grantId, string memory title, uint256 amount) external payable {
        require(msg.value == amount, "Incorrect fund amount");
        require(bytes(grantId).length > 0, "Invalid grant ID");
        require(!grants[grantId].active, "Grant already exists");

        grants[grantId] = Grant(grantId, title, amount, msg.sender, true);
        emit GrantCreated(grantId, title, amount);
    }

    /**
     * @dev Award grant to artist
     * @param grantId The unique identifier for the grant
     * @param artistId The unique identifier for the artist
     */
    function awardGrant(string memory grantId, string memory artistId) external onlyOwner {
        require(grants[grantId].active, "Grant not active");
        require(artists[artistId].verified, "Artist not verified");
        require(!grantApplications[grantId][artistId], "Already awarded");

        Grant storage grant = grants[grantId];
        grantApplications[grantId][artistId] = true;
        pendingFunds[artistId] += grant.amount;

        emit GrantAwarded(grantId, artistId, grant.amount);
    }

    /**
     * @dev Submit an application for a grant
     * @param applicationId The unique identifier for the application
     * @param contentHash The hash of the application content
     * @param grantId The unique identifier for the grant
     */
    function submitApplication(string memory applicationId, string memory contentHash, string memory grantId) external {
        require(bytes(applicationId).length > 0, "Invalid application ID");
        require(bytes(contentHash).length > 0, "Invalid content hash");
        require(bytes(grantId).length > 0, "Invalid grant ID");
        require(grants[grantId].active, "Grant not active");
        
        applications[applicationId] = Application(
            applicationId,
            contentHash,
            msg.sender,
            grantId,
            0, // Pending
            block.timestamp
        );
        
        emit ApplicationSubmitted(applicationId, grantId, msg.sender);
    }

    /**
     * @dev Distribute funds to artist
     * @param artistId The unique identifier for the artist
     */
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

    /**
     * @dev Initiate a cross-chain transaction to Optimism
     * @param artistId The unique identifier for the artist
     * @param amount The amount to transfer
     * @param targetChain The target chain (e.g., "optimism")
     * @param targetAddress The target address on the target chain
     * @return The transaction ID
     */
    function initiateCrossChainTransaction(
        string memory artistId, 
        uint256 amount, 
        string memory targetChain, 
        address targetAddress
    ) external onlyOwner nonReentrant returns (uint256) {
        Artist storage artist = artists[artistId];
        require(artist.verified, "Artist not verified");
        require(pendingFunds[artistId] >= amount, "Insufficient funds");
        
        // Reduce pending funds
        pendingFunds[artistId] -= amount;
        
        // Create cross-chain transaction
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
    
    /**
     * @dev Update the status of a cross-chain transaction
     * @param txId The transaction ID
     * @param status The new status ("pending", "completed", "failed")
     */
    function updateCrossChainTransactionStatus(uint256 txId, string memory status) external onlyOwner {
        require(crossChainTransactions[txId].id == txId, "Transaction does not exist");
        
        crossChainTransactions[txId].status = status;
        
        emit CrossChainTransactionUpdated(txId, status);
        
        // If the transaction failed, return funds to the artist
        if (keccak256(bytes(status)) == keccak256(bytes("failed"))) {
            string memory artistId = crossChainTransactions[txId].artistId;
            uint256 amount = crossChainTransactions[txId].amount;
            pendingFunds[artistId] += amount;
        }
    }

    /**
     * @dev Get artist by Optimism address
     * @param optimismAddress The Optimism address
     * @return The artist details
     */
    function getArtistByOptimismAddress(address optimismAddress) external view returns (Artist memory) {
        string memory artistId = optimismAddressToArtistId[optimismAddress];
        require(bytes(artistId).length > 0, "Artist not found");
        return artists[artistId];
    }
    
    /**
     * @dev Get cross-chain transaction details
     * @param txId The transaction ID
     * @return The transaction details
     */
    function getCrossChainTransaction(uint256 txId) external view returns (CrossChainTransaction memory) {
        require(crossChainTransactions[txId].id == txId, "Transaction does not exist");
        return crossChainTransactions[txId];
    }
    
    /**
     * @dev Add a session key for an artist
     * @param artistId The unique identifier for the artist
     * @param sessionKey The session key to add
     */
    function addSessionKey(string memory artistId, address sessionKey) public onlyOwner {
        require(sessionKey != address(0), "Invalid session key");
        require(artists[artistId].verified, "Artist not registered");
        
        // Check if session key already exists
        address[] storage sessionKeys = artistSessionKeys[artistId];
        for (uint i = 0; i < sessionKeys.length; i++) {
            require(sessionKeys[i] != sessionKey, "Session key already exists");
        }
        
        // Add session key
        sessionKeys.push(sessionKey);
        emit SessionKeyAdded(artistId, sessionKey);
    }
    
    /**
     * @dev Remove a session key for an artist
     * @param artistId The unique identifier for the artist
     * @param sessionKey The session key to remove
     */
    function removeSessionKey(string memory artistId, address sessionKey) public onlyOwner {
        require(artists[artistId].verified, "Artist not registered");
        
        // Find and remove session key
        address[] storage sessionKeys = artistSessionKeys[artistId];
        for (uint i = 0; i < sessionKeys.length; i++) {
            if (sessionKeys[i] == sessionKey) {
                // Replace with the last element and pop
                sessionKeys[i] = sessionKeys[sessionKeys.length - 1];
                sessionKeys.pop();
                emit SessionKeyRemoved(artistId, sessionKey);
                return;
            }
        }
        
        revert("Session key not found");
    }
    
    /**
     * @dev Get the application details
     * @param applicationId The unique identifier for the application
     * @return The application details
     */
    function getApplication(string memory applicationId) external view returns (Application memory) {
        return applications[applicationId];
    }

    /**
     * @dev Get the artist details
     * @param artistId The unique identifier for the artist
     * @return The artist details
     */
    function getArtist(string memory artistId) external view returns (Artist memory) {
        return artists[artistId];
    }

    /**
     * @dev Get the grant details
     * @param grantId The unique identifier for the grant
     * @return The grant details
     */
    function getGrant(string memory grantId) external view returns (Grant memory) {
        return grants[grantId];
    }
    
    /**
     * @dev Get the pending funds for an artist
     * @param artistId The unique identifier for the artist
     * @return The pending funds
     */
    function getPendingFunds(string memory artistId) external view returns (uint256) {
        return pendingFunds[artistId];
    }
    
    /**
     * @dev Get the session keys for an artist
     * @param artistId The unique identifier for the artist
     * @return The session keys
     */
    function getSessionKeys(string memory artistId) external view returns (address[] memory) {
        return artistSessionKeys[artistId];
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
} 