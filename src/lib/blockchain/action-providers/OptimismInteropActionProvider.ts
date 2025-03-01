import { ethers } from 'ethers';
import { z } from 'zod';
import { env } from '../../env';

// Optimism predeploys addresses
const L1_BLOCK_ATTRIBUTES = '0x4200000000000000000000000000000000000015';
const L1_BLOCK_NUMBER = '0x4200000000000000000000000000000000000013';
const L2_TO_L1_MESSAGE_PASSER = '0x4200000000000000000000000000000000000016';
const SYSTEM_CONFIG = '0x4200000000000000000000000000000000000010';

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

// Input schemas
const initiateWithdrawalSchema = z.object({
  artistId: z.string(),
  amount: z.string(),
  targetAddress: z.string()
});

const getAggregatedBalanceSchema = z.object({
  artistId: z.string()
});

export class OptimismInteropActionProvider {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    // Initialize provider
    const baseRpcUrl = env.NEXT_PUBLIC_BASE_RPC_URL || 'https://goerli.base.org';
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
} 