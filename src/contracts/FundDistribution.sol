// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FundDistribution
 * @dev Contract for managing and distributing funds to artists
 */
contract FundDistribution is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // Struct to represent a grant
    struct Grant {
        uint256 id;
        string title;
        string description;
        uint256 amount;
        address token; // ERC20 token address (address(0) for native token)
        uint256 deadline;
        address creator;
        bool active;
        uint256 remainingAmount;
        uint256 createdAt;
    }

    // Struct to represent an application
    struct Application {
        uint256 id;
        uint256 grantId;
        address applicant;
        string proposal;
        ApplicationStatus status;
        uint256 requestedAmount;
        uint256 approvedAmount;
        uint256 createdAt;
    }

    // Struct to represent a payment
    struct Payment {
        uint256 id;
        uint256 applicationId;
        address recipient;
        uint256 amount;
        address token;
        uint256 timestamp;
        bytes32 txHash;
    }

    enum ApplicationStatus { Pending, Approved, Rejected, Funded }

    // State variables
    mapping(uint256 => Grant) public grants;
    mapping(uint256 => Application) public applications;
    mapping(uint256 => Payment) public payments;
    mapping(address => mapping(address => uint256)) public artistBalances; // artist => token => balance

    uint256 public nextGrantId = 1;
    uint256 public nextApplicationId = 1;
    uint256 public nextPaymentId = 1;

    // Events
    event GrantCreated(uint256 indexed id, string title, uint256 amount, address token, address creator);
    event GrantUpdated(uint256 indexed id, string title, uint256 amount, bool active);
    event ApplicationSubmitted(uint256 indexed id, uint256 grantId, address applicant, uint256 requestedAmount);
    event ApplicationStatusChanged(uint256 indexed id, ApplicationStatus status, uint256 approvedAmount);
    event PaymentProcessed(uint256 indexed id, uint256 applicationId, address recipient, uint256 amount, address token);
    event FundsDeposited(address indexed token, address depositor, uint256 amount);
    event FundsWithdrawn(address indexed token, address recipient, uint256 amount);

    /**
     * @dev Constructor sets up the roles
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
    }

    /**
     * @dev Deposit native tokens to the contract
     */
    function depositNativeToken() external payable {
        emit FundsDeposited(address(0), msg.sender, msg.value);
    }

    /**
     * @dev Deposit ERC20 tokens to the contract
     * @param token The ERC20 token address
     * @param amount The amount to deposit
     */
    function depositToken(address token, uint256 amount) external {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit FundsDeposited(token, msg.sender, amount);
    }

    /**
     * @dev Create a new grant
     * @param title The grant title
     * @param description The grant description
     * @param amount The total grant amount
     * @param token The ERC20 token address (address(0) for native token)
     * @param deadline The application deadline timestamp
     */
    function createGrant(
        string memory title,
        string memory description,
        uint256 amount,
        address token,
        uint256 deadline
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(amount > 0, "Amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");

        // Check if we have enough balance for this grant
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient native token balance");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
        }

        uint256 grantId = nextGrantId++;
        grants[grantId] = Grant({
            id: grantId,
            title: title,
            description: description,
            amount: amount,
            token: token,
            deadline: deadline,
            creator: msg.sender,
            active: true,
            remainingAmount: amount,
            createdAt: block.timestamp
        });

        emit GrantCreated(grantId, title, amount, token, msg.sender);
    }

    /**
     * @dev Update an existing grant
     * @param grantId The ID of the grant to update
     * @param title The new grant title
     * @param description The new grant description
     * @param amount The new total grant amount
     * @param active Whether the grant is active
     * @param deadline The new application deadline timestamp
     */
    function updateGrant(
        uint256 grantId,
        string memory title,
        string memory description,
        uint256 amount,
        bool active,
        uint256 deadline
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(grantId < nextGrantId, "Grant does not exist");
        Grant storage grant = grants[grantId];
        
        require(bytes(title).length > 0, "Title cannot be empty");
        require(amount >= grant.amount - grant.remainingAmount, "Amount cannot be less than already distributed");
        require(deadline > block.timestamp, "Deadline must be in the future");

        // Check if we need to add more funds
        if (amount > grant.amount) {
            uint256 additionalAmount = amount - grant.amount;
            if (grant.token == address(0)) {
                require(address(this).balance >= additionalAmount, "Insufficient native token balance");
            } else {
                require(IERC20(grant.token).balanceOf(address(this)) >= additionalAmount, "Insufficient token balance");
            }
            grant.remainingAmount += additionalAmount;
        }

        grant.title = title;
        grant.description = description;
        grant.amount = amount;
        grant.active = active;
        grant.deadline = deadline;

        emit GrantUpdated(grantId, title, amount, active);
    }

    /**
     * @dev Submit an application for a grant
     * @param grantId The ID of the grant to apply for
     * @param proposal The application proposal
     * @param requestedAmount The amount requested
     */
    function submitApplication(
        uint256 grantId,
        string memory proposal,
        uint256 requestedAmount
    ) external whenNotPaused nonReentrant {
        require(grantId < nextGrantId, "Grant does not exist");
        Grant storage grant = grants[grantId];
        
        require(grant.active, "Grant is not active");
        require(block.timestamp <= grant.deadline, "Application deadline has passed");
        require(bytes(proposal).length > 0, "Proposal cannot be empty");
        require(requestedAmount > 0 && requestedAmount <= grant.remainingAmount, "Invalid requested amount");

        uint256 applicationId = nextApplicationId++;
        applications[applicationId] = Application({
            id: applicationId,
            grantId: grantId,
            applicant: msg.sender,
            proposal: proposal,
            status: ApplicationStatus.Pending,
            requestedAmount: requestedAmount,
            approvedAmount: 0,
            createdAt: block.timestamp
        });

        emit ApplicationSubmitted(applicationId, grantId, msg.sender, requestedAmount);
    }

    /**
     * @dev Review an application (approve, reject, or fund)
     * @param applicationId The ID of the application to review
     * @param status The new status
     * @param approvedAmount The approved amount (if status is Approved)
     */
    function reviewApplication(
        uint256 applicationId,
        ApplicationStatus status,
        uint256 approvedAmount
    ) external onlyRole(DISTRIBUTOR_ROLE) whenNotPaused nonReentrant {
        require(applicationId < nextApplicationId, "Application does not exist");
        Application storage application = applications[applicationId];
        
        require(application.status == ApplicationStatus.Pending, "Application is not pending");
        
        if (status == ApplicationStatus.Approved) {
            require(approvedAmount > 0 && approvedAmount <= application.requestedAmount, "Invalid approved amount");
            
            Grant storage grant = grants[application.grantId];
            require(approvedAmount <= grant.remainingAmount, "Insufficient grant funds");
            
            application.approvedAmount = approvedAmount;
            application.status = ApplicationStatus.Approved;
        } else if (status == ApplicationStatus.Rejected) {
            application.status = ApplicationStatus.Rejected;
        } else {
            revert("Invalid status");
        }

        emit ApplicationStatusChanged(applicationId, status, approvedAmount);
    }

    /**
     * @dev Process payment for an approved application
     * @param applicationId The ID of the application to fund
     */
    function processPayment(uint256 applicationId) 
        external 
        onlyRole(DISTRIBUTOR_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(applicationId < nextApplicationId, "Application does not exist");
        Application storage application = applications[applicationId];
        
        require(application.status == ApplicationStatus.Approved, "Application is not approved");
        
        Grant storage grant = grants[application.grantId];
        require(grant.active, "Grant is not active");
        require(application.approvedAmount <= grant.remainingAmount, "Insufficient grant funds");

        // Update application status
        application.status = ApplicationStatus.Funded;
        
        // Update grant remaining amount
        grant.remainingAmount -= application.approvedAmount;
        
        // Add to artist balance
        artistBalances[application.applicant][grant.token] += application.approvedAmount;
        
        // Create payment record
        uint256 paymentId = nextPaymentId++;
        payments[paymentId] = Payment({
            id: paymentId,
            applicationId: applicationId,
            recipient: application.applicant,
            amount: application.approvedAmount,
            token: grant.token,
            timestamp: block.timestamp,
            txHash: blockhash(block.number - 1) // This is just a placeholder, in production you'd use an oracle
        });
        
        emit PaymentProcessed(
            paymentId, 
            applicationId, 
            application.applicant, 
            application.approvedAmount, 
            grant.token
        );
        
        emit ApplicationStatusChanged(applicationId, ApplicationStatus.Funded, application.approvedAmount);
    }

    /**
     * @dev Withdraw funds from artist balance
     * @param token The token address (address(0) for native token)
     * @param amount The amount to withdraw
     */
    function withdrawFunds(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(artistBalances[msg.sender][token] >= amount, "Insufficient balance");
        
        // Update balance
        artistBalances[msg.sender][token] -= amount;
        
        // Transfer funds
        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Native token transfer failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
        
        emit FundsWithdrawn(token, msg.sender, amount);
    }

    /**
     * @dev Get grant details
     * @param grantId The ID of the grant
     */
    function getGrant(uint256 grantId) external view returns (Grant memory) {
        require(grantId < nextGrantId, "Grant does not exist");
        return grants[grantId];
    }

    /**
     * @dev Get application details
     * @param applicationId The ID of the application
     */
    function getApplication(uint256 applicationId) external view returns (Application memory) {
        require(applicationId < nextApplicationId, "Application does not exist");
        return applications[applicationId];
    }

    /**
     * @dev Get payment details
     * @param paymentId The ID of the payment
     */
    function getPayment(uint256 paymentId) external view returns (Payment memory) {
        require(paymentId < nextPaymentId, "Payment does not exist");
        return payments[paymentId];
    }

    /**
     * @dev Get artist balance
     * @param artist The artist address
     * @param token The token address
     */
    function getArtistBalance(address artist, address token) external view returns (uint256) {
        return artistBalances[artist][token];
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Withdraw contract funds in case of emergency
     * @param token The token address (address(0) for native token)
     * @param amount The amount to withdraw
     * @param recipient The recipient address
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address recipient
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "Invalid recipient");
        
        if (token == address(0)) {
            require(amount <= address(this).balance, "Insufficient native token balance");
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "Native token transfer failed");
        } else {
            require(amount <= IERC20(token).balanceOf(address(this)), "Insufficient token balance");
            IERC20(token).safeTransfer(recipient, amount);
        }
        
        emit FundsWithdrawn(token, recipient, amount);
    }

    // Function to receive Ether
    receive() external payable {
        emit FundsDeposited(address(0), msg.sender, msg.value);
    }
} 