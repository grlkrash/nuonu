// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ArtistFundManager is Ownable, ReentrancyGuard {
    // Events
    event ArtistRegistered(address indexed wallet, string indexed artistId);
    event FundsReceived(string indexed grantId, string indexed artistId, uint256 amount);
    event FundsDistributed(string indexed artistId, address indexed wallet, uint256 amount);
    
    // State variables
    mapping(string => address) public artistWallets;
    mapping(string => uint256) public pendingFunds;
    
    constructor() Ownable(msg.sender) {}
    
    // Register an artist's wallet
    function registerArtist(string memory artistId, address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        require(bytes(artistId).length > 0, "Invalid artist ID");
        artistWallets[artistId] = wallet;
        emit ArtistRegistered(wallet, artistId);
    }
    
    // Receive funds for a grant
    function receiveGrant(string memory grantId, string memory artistId) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(artistWallets[artistId] != address(0), "Artist not registered");
        
        pendingFunds[artistId] += msg.value;
        emit FundsReceived(grantId, artistId, msg.value);
    }
    
    // Distribute funds to artist
    function distributeFunds(string memory artistId) external nonReentrant {
        address artistWallet = artistWallets[artistId];
        require(artistWallet != address(0), "Artist not registered");
        
        uint256 amount = pendingFunds[artistId];
        require(amount > 0, "No funds to distribute");
        
        pendingFunds[artistId] = 0;
        
        (bool success, ) = artistWallet.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsDistributed(artistId, artistWallet, amount);
    }
    
    // View pending funds
    function getPendingFunds(string memory artistId) external view returns (uint256) {
        return pendingFunds[artistId];
    }
} 