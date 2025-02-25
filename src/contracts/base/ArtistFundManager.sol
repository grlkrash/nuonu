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
        bool verified;
    }

    // Events
    event ArtistRegistered(string indexed artistId, address indexed wallet);
    event GrantCreated(string indexed grantId, string title, uint256 amount);
    event GrantAwarded(string indexed grantId, string indexed artistId, uint256 amount);
    event FundsDistributed(string indexed artistId, address indexed wallet, uint256 amount);

    // State variables
    mapping(string => Artist) public artists;
    mapping(string => Grant) public grants;
    mapping(string => mapping(string => bool)) public grantApplications;
    mapping(string => uint256) public pendingFunds;

    Counters.Counter private _grantIds;

    // In OpenZeppelin v4.9.3, Ownable doesn't take constructor arguments
    constructor() {
        // The Ownable constructor in v4.9.3 automatically sets msg.sender as owner
    }

    // Register an artist
    function registerArtist(string memory artistId, address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        require(bytes(artistId).length > 0, "Invalid artist ID");
        require(!artists[artistId].verified, "Artist already registered");

        artists[artistId] = Artist(artistId, wallet, true);
        emit ArtistRegistered(artistId, wallet);
    }

    // Create a new grant
    function createGrant(string memory grantId, string memory title, uint256 amount) external payable {
        require(msg.value == amount, "Incorrect fund amount");
        require(bytes(grantId).length > 0, "Invalid grant ID");
        require(!grants[grantId].active, "Grant already exists");

        grants[grantId] = Grant(grantId, title, amount, msg.sender, true);
        emit GrantCreated(grantId, title, amount);
    }

    // Award grant to artist
    function awardGrant(string memory grantId, string memory artistId) external onlyOwner {
        require(grants[grantId].active, "Grant not active");
        require(artists[artistId].verified, "Artist not verified");
        require(!grantApplications[grantId][artistId], "Already awarded");

        Grant storage grant = grants[grantId];
        grantApplications[grantId][artistId] = true;
        pendingFunds[artistId] += grant.amount;

        emit GrantAwarded(grantId, artistId, grant.amount);
    }

    // Distribute funds to artist
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

    // View functions
    function getArtist(string memory artistId) external view returns (Artist memory) {
        return artists[artistId];
    }

    function getGrant(string memory grantId) external view returns (Grant memory) {
        return grants[grantId];
    }

    function getPendingFunds(string memory artistId) external view returns (uint256) {
        return pendingFunds[artistId];
    }

    // Receive function to accept ETH
    receive() external payable {}
} 