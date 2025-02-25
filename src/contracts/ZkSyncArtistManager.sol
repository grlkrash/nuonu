// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title ZkSyncArtistManager
 * @dev Contract for managing artist funds on zkSync Era
 */
contract ZkSyncArtistManager {
    address public owner;
    
    // Mapping from artist ID to wallet address
    mapping(string => address) public artistWallets;
    
    // Mapping from artist ID to pending funds
    mapping(string => uint256) public pendingFunds;
    
    // Mapping from artist ID to session keys
    mapping(string => address[]) public artistSessionKeys;
    
    // Events
    event ArtistRegistered(string artistId, address walletAddress);
    event SessionKeyAdded(string artistId, address sessionKey);
    event SessionKeyRemoved(string artistId, address sessionKey);
    event FundsReceived(string opportunityId, string artistId, uint256 amount);
    event FundsDistributed(string artistId, address wallet, uint256 amount);
    
    /**
     * @dev Constructor sets the owner to the deployer of the contract
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Modifier to restrict functions to the contract owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    /**
     * @dev Modifier to restrict functions to the artist or their session keys
     * @param artistId The unique identifier for the artist
     */
    modifier onlyArtistOrSessionKey(string memory artistId) {
        bool isAuthorized = false;
        
        // Check if sender is the artist's wallet
        if (msg.sender == artistWallets[artistId]) {
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
     * @dev Register an artist with their wallet address
     * @param artistId The unique identifier for the artist
     * @param walletAddress The artist's wallet address
     */
    function registerArtist(string memory artistId, address walletAddress) public onlyOwner {
        require(walletAddress != address(0), "Invalid wallet address");
        artistWallets[artistId] = walletAddress;
        emit ArtistRegistered(artistId, walletAddress);
    }
    
    /**
     * @dev Add a session key for an artist
     * @param artistId The unique identifier for the artist
     * @param sessionKey The session key to add
     */
    function addSessionKey(string memory artistId, address sessionKey) public onlyOwner {
        require(sessionKey != address(0), "Invalid session key");
        require(artistWallets[artistId] != address(0), "Artist not registered");
        
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
        require(artistWallets[artistId] != address(0), "Artist not registered");
        
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
     * @dev Receive funds for an artist
     * @param opportunityId The unique identifier for the opportunity
     * @param artistId The unique identifier for the artist
     */
    function receiveFunds(string memory opportunityId, string memory artistId) public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(artistWallets[artistId] != address(0), "Artist not registered");
        
        pendingFunds[artistId] += msg.value;
        emit FundsReceived(opportunityId, artistId, msg.value);
    }
    
    /**
     * @dev Distribute pending funds to an artist
     * @param artistId The unique identifier for the artist
     */
    function distributeFunds(string memory artistId) public onlyArtistOrSessionKey(artistId) {
        address artistWallet = artistWallets[artistId];
        require(artistWallet != address(0), "Artist not registered");
        
        uint256 amount = pendingFunds[artistId];
        require(amount > 0, "No funds to distribute");
        
        pendingFunds[artistId] = 0;
        
        (bool success, ) = artistWallet.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsDistributed(artistId, artistWallet, amount);
    }
    
    /**
     * @dev Get the pending funds for an artist
     * @param artistId The unique identifier for the artist
     * @return The amount of pending funds
     */
    function getPendingFunds(string memory artistId) public view returns (uint256) {
        return pendingFunds[artistId];
    }
    
    /**
     * @dev Get the session keys for an artist
     * @param artistId The unique identifier for the artist
     * @return Array of session keys
     */
    function getSessionKeys(string memory artistId) public view returns (address[] memory) {
        return artistSessionKeys[artistId];
    }
    
    /**
     * @dev Check if an address is a valid session key for an artist
     * @param artistId The unique identifier for the artist
     * @param sessionKey The session key to check
     * @return True if the session key is valid, false otherwise
     */
    function isValidSessionKey(string memory artistId, address sessionKey) public view returns (bool) {
        address[] memory sessionKeys = artistSessionKeys[artistId];
        for (uint i = 0; i < sessionKeys.length; i++) {
            if (sessionKeys[i] == sessionKey) {
                return true;
            }
        }
        return false;
    }
} 