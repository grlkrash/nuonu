// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title ArtistFundManager
 * @dev Contract for managing funds for artists applying to opportunities
 */
contract ArtistFundManager {
    address public owner;
    
    // Mapping from artist ID to wallet address
    mapping(string => address) public artistWallets;
    
    // Mapping from artist ID to pending funds
    mapping(string => uint256) public pendingFunds;
    
    // Mapping from artist ID to total funds received
    mapping(string => uint256) public totalFundsReceived;
    
    // Events
    event ArtistRegistered(string artistId, address walletAddress);
    event FundsReceived(string grantId, string artistId, uint256 amount);
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
     * @dev Update an artist's wallet address
     * @param artistId The unique identifier for the artist
     * @param newWalletAddress The artist's new wallet address
     */
    function updateArtistWallet(string memory artistId, address newWalletAddress) public onlyOwner {
        require(newWalletAddress != address(0), "Invalid wallet address");
        require(artistWallets[artistId] != address(0), "Artist not registered");
        artistWallets[artistId] = newWalletAddress;
        emit ArtistRegistered(artistId, newWalletAddress);
    }
    
    /**
     * @dev Receive funds for an artist's grant
     * @param grantId The unique identifier for the grant
     * @param artistId The unique identifier for the artist
     */
    function receiveGrant(string memory grantId, string memory artistId) public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        pendingFunds[artistId] += msg.value;
        totalFundsReceived[artistId] += msg.value;
        emit FundsReceived(grantId, artistId, msg.value);
    }
    
    /**
     * @dev Distribute pending funds to an artist
     * @param artistId The unique identifier for the artist
     */
    function distributeFunds(string memory artistId) public onlyOwner {
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
     * @dev Get the total funds received by an artist
     * @param artistId The unique identifier for the artist
     * @return The total amount of funds received
     */
    function getTotalFundsReceived(string memory artistId) public view returns (uint256) {
        return totalFundsReceived[artistId];
    }
    
    /**
     * @dev Get the wallet address for an artist
     * @param artistId The unique identifier for the artist
     * @return The artist's wallet address
     */
    function getArtistWallet(string memory artistId) public view returns (address) {
        return artistWallets[artistId];
    }
    
    /**
     * @dev Check if an artist is registered
     * @param artistId The unique identifier for the artist
     * @return True if the artist is registered, false otherwise
     */
    function isArtistRegistered(string memory artistId) public view returns (bool) {
        return artistWallets[artistId] != address(0);
    }
    
    /**
     * @dev Allow the owner to withdraw any funds accidentally sent to the contract
     */
    function withdrawFunds() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
} 