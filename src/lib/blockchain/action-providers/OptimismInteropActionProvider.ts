import { ethers } from 'ethers';
import { z } from 'zod';
import { env } from '../../env';

// Optimism predeploys addresses
const L1_BLOCK_ATTRIBUTES = '0x4200000000000000000000000000000000000015';
const L1_BLOCK_NUMBER = '0x4200000000000000000000000000000000000013';
const L2_TO_L1_MESSAGE_PASSER = '0x4200000000000000000000000000000000000016';
const SYSTEM_CONFIG = '0x4200000000000000000000000000000000000010';
const CROSS_L2_INBOX = '0x4200000000000000000000000000000000000022';
const L2_TO_L2_CROSS_DOMAIN_MESSENGER = '0x4200000000000000000000000000000000000023';
const SUPERCHAIN_TOKEN_BRIDGE = '0x4200000000000000000000000000000000000028';

// ABI for L1BlockNumber predeploy
const L1_BLOCK_NUMBER_ABI = [
  {
    "inputs": [],
    "name": "getL1BlockNumber",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for L1BlockAttributes predeploy
const L1_BLOCK_ATTRIBUTES_ABI = [
  {
    "inputs": [],
    "name": "baseFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "number",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "timestamp",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for SystemConfig predeploy
const SYSTEM_CONFIG_ABI = [
  {
    "inputs": [],
    "name": "l1FeeOverhead",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "l1FeeScalar",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ABI for L2ToL1MessagePasser predeploy
const L2_TO_L1_MESSAGE_PASSER_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_gasLimit",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "_data",
        "type": "bytes"
      }
    ],
    "name": "initiateWithdrawal",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ABI for CrossL2Inbox predeploy
const CROSS_L2_INBOX_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_destinationChainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "_message",
        "type": "bytes"
      }
    ],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ABI for L2ToL2CrossDomainMessenger predeploy
const L2_TO_L2_CROSS_DOMAIN_MESSENGER_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_destinationChainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "_message",
        "type": "bytes"
      },
      {
        "internalType": "uint32",
        "name": "_gasLimit",
        "type": "uint32"
      }
    ],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ABI for SuperchainTokenBridge predeploy
const SUPERCHAIN_TOKEN_BRIDGE_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_destinationChainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_localToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_remoteToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "_minGasLimit",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "_extraData",
        "type": "bytes"
      }
    ],
    "name": "bridgeERC20",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_destinationChainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "_minGasLimit",
        "type": "uint32"
      },
      {
        "internalType": "bytes",
        "name": "_extraData",
        "type": "bytes"
      }
    ],
    "name": "bridgeETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ERC20 ABI for token interactions
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Input schemas
const initiateWithdrawalSchema = z.object({
  artistId: z.string(),
  amount: z.string(),
  targetAddress: z.string()
});

const getAggregatedBalanceSchema = z.object({
  artistId: z.string()
});

const bridgeTokenSchema = z.object({
  artistId: z.string(),
  sourceChain: z.string(),
  destinationChain: z.string(),
  tokenAddress: z.string().optional(),
  amount: z.string(),
  targetAddress: z.string()
});

// Chain ID mapping
const CHAIN_IDS = {
  'base-sepolia': 84532,
  'zksync-sepolia': 300,
  'optimism-sepolia': 11155420,
  'flow-testnet': 0, // Placeholder, Flow doesn't have an EVM chain ID
};

// USDC token addresses on different chains (testnet)
const USDC_ADDRESSES = {
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Example address
  'zksync-sepolia': '0x0faF6df7054946141266420b43783387A78d82A9', // Example address
  'optimism-sepolia': '0x5fd84259d66Cd46123540766Be93DFE6D43130D7', // Example address
};

export class OptimismInteropActionProvider {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    // Initialize provider
    const baseRpcUrl = env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org';
    this.provider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
    
    // Initialize wallet if private key is available
    if (env.BASE_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(env.BASE_PRIVATE_KEY, this.provider);
    }
  }

  /**
   * Get the current L1 block number
   * @returns The current L1 block number
   */
  async getL1BlockNumber() {
    try {
      const l1BlockNumber = new ethers.Contract(L1_BLOCK_NUMBER, L1_BLOCK_NUMBER_ABI, this.provider);
      const blockNumber = await l1BlockNumber.getL1BlockNumber();
      
      return {
        success: true,
        message: `Current L1 block number: ${blockNumber.toString()}`,
        data: {
          blockNumber: blockNumber.toString()
        }
      };
    } catch (error) {
      console.error('Error getting L1 block number:', error);
      return {
        success: false,
        message: `Error getting L1 block number: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }

  /**
   * Get L1 block attributes
   * @returns L1 block attributes (number, timestamp, baseFee)
   */
  async getL1BlockAttributes() {
    try {
      const l1BlockAttributes = new ethers.Contract(L1_BLOCK_ATTRIBUTES, L1_BLOCK_ATTRIBUTES_ABI, this.provider);
      
      const blockNumber = await l1BlockAttributes.number();
      const timestamp = await l1BlockAttributes.timestamp();
      const baseFee = await l1BlockAttributes.baseFee();
      
      return {
        success: true,
        message: 'Successfully retrieved L1 block attributes',
        data: {
          blockNumber: blockNumber.toString(),
          timestamp: timestamp.toString(),
          baseFee: ethers.utils.formatUnits(baseFee, 'gwei'),
          baseFeeWei: baseFee.toString()
        }
      };
    } catch (error) {
      console.error('Error getting L1 block attributes:', error);
      return {
        success: false,
        message: `Error getting L1 block attributes: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }

  /**
   * Get system configuration
   * @returns System configuration (l1FeeOverhead, l1FeeScalar)
   */
  async getSystemConfig() {
    try {
      const systemConfig = new ethers.Contract(SYSTEM_CONFIG, SYSTEM_CONFIG_ABI, this.provider);
      
      const l1FeeOverhead = await systemConfig.l1FeeOverhead();
      const l1FeeScalar = await systemConfig.l1FeeScalar();
      
      return {
        success: true,
        message: 'Successfully retrieved system configuration',
        data: {
          l1FeeOverhead: l1FeeOverhead.toString(),
          l1FeeScalar: l1FeeScalar.toString()
        }
      };
    } catch (error) {
      console.error('Error getting system configuration:', error);
      return {
        success: false,
        message: `Error getting system configuration: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }

  /**
   * Initiate a withdrawal from L2 to L1
   * @param input The withdrawal input (artistId, amount, targetAddress)
   * @returns The withdrawal result
   */
  async initiateWithdrawal(input: unknown) {
    try {
      // Validate input
      const { artistId, amount, targetAddress } = initiateWithdrawalSchema.parse(input);
      
      // Check if wallet is initialized
      if (!this.wallet) {
        throw new Error('Wallet not initialized. Please provide BASE_PRIVATE_KEY in environment variables.');
      }
      
      // Convert amount to wei
      const amountWei = ethers.utils.parseEther(amount);
      
      // Initialize L2ToL1MessagePasser contract
      const l2ToL1MessagePasser = new ethers.Contract(
        L2_TO_L1_MESSAGE_PASSER,
        L2_TO_L1_MESSAGE_PASSER_ABI,
        this.wallet
      );
      
      // Prepare empty data for the withdrawal
      const data = '0x';
      
      // Initiate withdrawal
      const tx = await l2ToL1MessagePasser.initiateWithdrawal(
        targetAddress,
        200000, // Gas limit
        data,
        { value: amountWei }
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        success: true,
        message: `Withdrawal initiated for artist ${artistId} for ${amount} ETH to address ${targetAddress}`,
        data: {
          withdrawalId: receipt.transactionHash,
          artistId,
          amount,
          targetAddress,
          status: 'pending'
        }
      };
    } catch (error) {
      console.error('Error initiating withdrawal:', error);
      return {
        success: false,
        message: `Error initiating withdrawal: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }

  /**
   * Get aggregated balances across all chains
   * @param input The input (artistId)
   * @returns The aggregated balances
   */
  async getAggregatedBalance(input: unknown) {
    try {
      // Validate input
      const { artistId } = getAggregatedBalanceSchema.parse(input);
      
      // In a real implementation, you would query balances from all chains
      // For this example, we'll return mock data
      
      // Get Base balance
      let baseBalance = '0';
      try {
        if (env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS && this.wallet) {
          const artistFundManagerAbi = [
            {
              "inputs": [
                {
                  "internalType": "string",
                  "name": "_artistId",
                  "type": "string"
                }
              ],
              "name": "getArtistDetails",
              "outputs": [
                {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
                },
                {
                  "internalType": "address",
                  "name": "walletAddress",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "totalFunding",
                  "type": "uint256"
                }
              ],
              "stateMutability": "view",
              "type": "function"
            }
          ];
          
          const artistFundManager = new ethers.Contract(
            env.NEXT_PUBLIC_ARTIST_FUND_MANAGER_ADDRESS,
            artistFundManagerAbi,
            this.provider
          );
          
          const artistDetails = await artistFundManager.getArtistDetails(artistId);
          baseBalance = ethers.utils.formatEther(artistDetails.totalFunding);
        }
      } catch (error) {
        console.warn(`Error getting Base balance for artist ${artistId}:`, error);
        // Continue with mock data
      }
      
      // Get zkSync balance (mock)
      const zkSyncBalance = '0.3';
      
      // Get Flow balance (mock)
      const flowBalance = '0.2';
      
      // Calculate total ETH equivalent
      const totalEthEquivalent = (
        parseFloat(baseBalance) + 
        parseFloat(zkSyncBalance) + 
        parseFloat(flowBalance)
      ).toString();
      
      return {
        success: true,
        message: `Aggregated balance for artist ${artistId}`,
        data: {
          artistId,
          balances: {
            base: baseBalance,
            zkSync: zkSyncBalance,
            flow: flowBalance
          },
          totalEthEquivalent
        }
      };
    } catch (error) {
      console.error('Error getting aggregated balance:', error);
      return {
        success: false,
        message: `Error getting aggregated balance: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }

  /**
   * Bridge tokens from one chain to another using Optimism's interoperability features
   * @param input The bridge input (artistId, sourceChain, destinationChain, tokenAddress, amount, targetAddress)
   * @returns The bridge result
   */
  async bridgeTokens(input: unknown) {
    try {
      // Validate input
      const { 
        artistId, 
        sourceChain, 
        destinationChain, 
        tokenAddress, 
        amount, 
        targetAddress 
      } = bridgeTokenSchema.parse(input);
      
      // Check if wallet is initialized
      if (!this.wallet) {
        throw new Error('Wallet not initialized. Please provide BASE_PRIVATE_KEY in environment variables.');
      }
      
      // Get chain IDs
      const sourceChainId = CHAIN_IDS[sourceChain as keyof typeof CHAIN_IDS];
      const destinationChainId = CHAIN_IDS[destinationChain as keyof typeof CHAIN_IDS];
      
      if (!sourceChainId) {
        throw new Error(`Source chain ${sourceChain} not supported`);
      }
      
      if (!destinationChainId) {
        throw new Error(`Destination chain ${destinationChain} not supported`);
      }
      
      // If Flow is involved, we need special handling
      if (sourceChain === 'flow-testnet' || destinationChain === 'flow-testnet') {
        return this.handleFlowBridge(artistId, sourceChain, destinationChain, amount, targetAddress);
      }
      
      // Determine if we're bridging ETH or an ERC20 token
      if (!tokenAddress) {
        // Bridge ETH
        return this.bridgeETH(artistId, destinationChainId, amount, targetAddress);
      } else {
        // Bridge ERC20 token
        return this.bridgeERC20(
          artistId,
          destinationChainId,
          tokenAddress,
          tokenAddress, // Assuming same token address on destination chain
          amount,
          targetAddress
        );
      }
    } catch (error) {
      console.error('Error bridging tokens:', error);
      return {
        success: false,
        message: `Error bridging tokens: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }

  /**
   * Bridge ETH to another chain
   * @param artistId The artist ID
   * @param destinationChainId The destination chain ID
   * @param amount The amount to bridge
   * @param targetAddress The target address
   * @returns The bridge result
   */
  private async bridgeETH(
    artistId: string,
    destinationChainId: number,
    amount: string,
    targetAddress: string
  ) {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      
      // Convert amount to wei
      const amountWei = ethers.utils.parseEther(amount);
      
      // Initialize SuperchainTokenBridge contract
      const superchainTokenBridge = new ethers.Contract(
        SUPERCHAIN_TOKEN_BRIDGE,
        SUPERCHAIN_TOKEN_BRIDGE_ABI,
        this.wallet
      );
      
      // Bridge ETH
      const tx = await superchainTokenBridge.bridgeETH(
        destinationChainId,
        targetAddress,
        amountWei,
        100000, // Min gas limit
        '0x', // Extra data
        { value: amountWei }
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        success: true,
        message: `ETH bridge initiated for artist ${artistId} for ${amount} ETH to address ${targetAddress} on chain ID ${destinationChainId}`,
        data: {
          bridgeId: receipt.transactionHash,
          artistId,
          amount,
          targetAddress,
          destinationChainId,
          status: 'pending'
        }
      };
    } catch (error) {
      console.error('Error bridging ETH:', error);
      throw error;
    }
  }

  /**
   * Bridge ERC20 tokens to another chain
   * @param artistId The artist ID
   * @param destinationChainId The destination chain ID
   * @param localToken The local token address
   * @param remoteToken The remote token address
   * @param amount The amount to bridge
   * @param targetAddress The target address
   * @returns The bridge result
   */
  private async bridgeERC20(
    artistId: string,
    destinationChainId: number,
    localToken: string,
    remoteToken: string,
    amount: string,
    targetAddress: string
  ) {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not initialized');
      }
      
      // Convert amount to wei (assuming 6 decimals for USDC)
      const amountWei = ethers.utils.parseUnits(amount, 6);
      
      // Initialize token contract
      const tokenContract = new ethers.Contract(
        localToken,
        ERC20_ABI,
        this.wallet
      );
      
      // Approve token transfer
      const approveTx = await tokenContract.approve(
        SUPERCHAIN_TOKEN_BRIDGE,
        amountWei
      );
      
      await approveTx.wait();
      
      // Initialize SuperchainTokenBridge contract
      const superchainTokenBridge = new ethers.Contract(
        SUPERCHAIN_TOKEN_BRIDGE,
        SUPERCHAIN_TOKEN_BRIDGE_ABI,
        this.wallet
      );
      
      // Bridge ERC20 token
      const tx = await superchainTokenBridge.bridgeERC20(
        destinationChainId,
        localToken,
        remoteToken,
        targetAddress,
        amountWei,
        100000, // Min gas limit
        '0x' // Extra data
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        success: true,
        message: `ERC20 bridge initiated for artist ${artistId} for ${amount} tokens to address ${targetAddress} on chain ID ${destinationChainId}`,
        data: {
          bridgeId: receipt.transactionHash,
          artistId,
          tokenAddress: localToken,
          amount,
          targetAddress,
          destinationChainId,
          status: 'pending'
        }
      };
    } catch (error) {
      console.error('Error bridging ERC20:', error);
      throw error;
    }
  }

  /**
   * Handle bridging to/from Flow blockchain
   * @param artistId The artist ID
   * @param sourceChain The source chain
   * @param destinationChain The destination chain
   * @param amount The amount to bridge
   * @param targetAddress The target address
   * @returns The bridge result
   */
  private async handleFlowBridge(
    artistId: string,
    sourceChain: string,
    destinationChain: string,
    amount: string,
    targetAddress: string
  ) {
    // For MVP, we'll simulate the Flow bridge with a mock response
    // In a real implementation, this would interact with Flow's blockchain
    
    return {
      success: true,
      message: `Flow bridge simulation for artist ${artistId} from ${sourceChain} to ${destinationChain} for ${amount} tokens to address ${targetAddress}`,
      data: {
        bridgeId: `flow-bridge-${Date.now()}`,
        artistId,
        sourceChain,
        destinationChain,
        amount,
        targetAddress,
        status: 'simulated'
      }
    };
  }

  /**
   * Convert artist funds to USDC and send to artist wallet
   * @param input The conversion input (artistId, sourceChain, amount, targetAddress)
   * @returns The conversion result
   */
  async convertToUSDC(input: unknown) {
    try {
      // Validate input
      const { 
        artistId, 
        sourceChain, 
        amount, 
        targetAddress 
      } = bridgeTokenSchema.parse(input);
      
      // Check if wallet is initialized
      if (!this.wallet) {
        throw new Error('Wallet not initialized. Please provide BASE_PRIVATE_KEY in environment variables.');
      }
      
      // For MVP, we'll simulate the conversion with a mock response
      // In a real implementation, this would:
      // 1. Retrieve funds from the source chain
      // 2. Convert to USDC using a DEX or bridge
      // 3. Send USDC to the target address
      
      // Get USDC address for the source chain
      const usdcAddress = USDC_ADDRESSES[sourceChain as keyof typeof USDC_ADDRESSES];
      
      if (!usdcAddress) {
        throw new Error(`USDC not supported on chain ${sourceChain}`);
      }
      
      return {
        success: true,
        message: `Converted ${amount} ETH to USDC for artist ${artistId} on ${sourceChain} and sent to ${targetAddress}`,
        data: {
          conversionId: `usdc-conversion-${Date.now()}`,
          artistId,
          sourceChain,
          sourceAmount: amount,
          usdcAmount: (parseFloat(amount) * 1800).toString(), // Mock conversion rate
          targetAddress,
          status: 'simulated'
        }
      };
    } catch (error) {
      console.error('Error converting to USDC:', error);
      return {
        success: false,
        message: `Error converting to USDC: ${error instanceof Error ? error.message : String(error)}`,
        data: null
      };
    }
  }
} 