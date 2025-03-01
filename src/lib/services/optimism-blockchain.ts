import { ethers } from 'ethers';

// Optimism predeploys addresses
const L1_BLOCK_ATTRIBUTES = '0x4200000000000000000000000000000000000015';
const L1_BLOCK_NUMBER = '0x4200000000000000000000000000000000000013';
const SYSTEM_CONFIG = '0x4200000000000000000000000000000000000010';
const L2_TO_L1_MESSAGE_PASSER = '0x4200000000000000000000000000000000000016';
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
  },
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

// Chain IDs
const CHAIN_IDS = {
  OPTIMISM_SEPOLIA: '11155420',
  BASE_SEPOLIA: '84532',
  SEPOLIA: '11155111'
};

// Chain names
const CHAIN_NAMES = {
  [CHAIN_IDS.OPTIMISM_SEPOLIA]: 'Optimism Sepolia',
  [CHAIN_IDS.BASE_SEPOLIA]: 'Base Sepolia',
  [CHAIN_IDS.SEPOLIA]: 'Sepolia'
};

export interface ChainBalance {
  chainId: string;
  chainName: string;
  balance: string;
  symbol: string;
  usdValue: number;
}

export class OptimismBlockchainService {
  private optimismProvider: ethers.providers.JsonRpcProvider;
  private baseProvider: ethers.providers.JsonRpcProvider | null = null;
  private ethPrice: number = 2000; // Default ETH price in USD

  constructor() {
    // Initialize Optimism provider
    const optimismRpcUrl = process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://sepolia.optimism.io';
    this.optimismProvider = new ethers.providers.JsonRpcProvider(optimismRpcUrl);
    
    // Initialize Base provider with the correct Sepolia URL
    try {
      const baseRpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
      this.baseProvider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
      console.log('Base provider initialized with URL:', baseRpcUrl);
    } catch (error) {
      console.error('Error initializing Base provider:', error);
      this.baseProvider = null;
    }
    
    // Update ETH price periodically
    this.updateEthPrice();
  }

  /**
   * Get the L1 block number from the Optimism predeploy
   */
  async getL1BlockNumber(): Promise<number> {
    try {
      const l1BlockNumberContract = new ethers.Contract(
        L1_BLOCK_NUMBER,
        L1_BLOCK_NUMBER_ABI,
        this.optimismProvider
      );
      
      const blockNumber = await l1BlockNumberContract.getL1BlockNumber();
      return blockNumber.toNumber();
    } catch (error) {
      console.error('Error getting L1 Block Number:', error);
      throw new Error('Failed to get L1 Block Number');
    }
  }

  /**
   * Get L1 block attributes from the Optimism predeploy
   */
  async getL1BlockAttributes(): Promise<{
    number: number;
    timestamp: number;
    baseFee: string;
  }> {
    try {
      const l1BlockAttributesContract = new ethers.Contract(
        L1_BLOCK_ATTRIBUTES,
        L1_BLOCK_ATTRIBUTES_ABI,
        this.optimismProvider
      );
      
      const [number, timestamp, baseFee] = await Promise.all([
        l1BlockAttributesContract.number(),
        l1BlockAttributesContract.timestamp(),
        l1BlockAttributesContract.baseFee()
      ]);
      
      return {
        number: number.toNumber(),
        timestamp: timestamp.toNumber(),
        baseFee: ethers.utils.formatUnits(baseFee, 'gwei')
      };
    } catch (error) {
      console.error('Error getting L1 Block Attributes:', error);
      throw new Error('Failed to get L1 Block Attributes');
    }
  }

  /**
   * Get system config from the Optimism predeploy
   */
  async getSystemConfig(): Promise<{
    l1FeeOverhead: string;
    l1FeeScalar: string;
  }> {
    try {
      const systemConfigContract = new ethers.Contract(
        SYSTEM_CONFIG,
        SYSTEM_CONFIG_ABI,
        this.optimismProvider
      );
      
      const [l1FeeOverhead, l1FeeScalar] = await Promise.all([
        systemConfigContract.l1FeeOverhead(),
        systemConfigContract.l1FeeScalar()
      ]);
      
      return {
        l1FeeOverhead: l1FeeOverhead.toString(),
        l1FeeScalar: l1FeeScalar.toString()
      };
    } catch (error) {
      console.error('Error getting System Config:', error);
      throw new Error('Failed to get System Config');
    }
  }

  /**
   * Get ETH balance for an address on Optimism
   */
  async getOptimismBalance(address: string): Promise<string> {
    try {
      const balance = await this.optimismProvider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting Optimism balance:', error);
      throw new Error('Failed to get Optimism balance');
    }
  }

  /**
   * Get ETH balance for an address on Base
   */
  async getBaseBalance(address: string): Promise<string> {
    if (!this.baseProvider) {
      return '0.0';
    }
    
    try {
      const balance = await this.baseProvider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting Base balance:', error);
      return '0.0';
    }
  }

  /**
   * Get aggregated balances across multiple chains
   */
  async getAggregatedBalances(address: string): Promise<ChainBalance[]> {
    try {
      // Get ETH price (in a real app, this would come from an oracle)
      await this.updateEthPrice();
      
      // Get balances from different chains
      const [optimismBalance, baseBalance] = await Promise.all([
        this.getOptimismBalance(address),
        this.getBaseBalance(address)
      ]);
      
      const balances: ChainBalance[] = [];
      
      // Add Optimism balance
      balances.push({
        chainId: CHAIN_IDS.OPTIMISM_SEPOLIA,
        chainName: CHAIN_NAMES[CHAIN_IDS.OPTIMISM_SEPOLIA],
        balance: optimismBalance,
        symbol: 'ETH',
        usdValue: parseFloat(optimismBalance) * this.ethPrice
      });
      
      // Add Base balance if available
      if (this.baseProvider) {
        balances.push({
          chainId: CHAIN_IDS.BASE_SEPOLIA,
          chainName: CHAIN_NAMES[CHAIN_IDS.BASE_SEPOLIA],
          balance: baseBalance,
          symbol: 'ETH',
          usdValue: parseFloat(baseBalance) * this.ethPrice
        });
      }
      
      return balances;
    } catch (error) {
      console.error('Error getting aggregated balances:', error);
      throw new Error('Failed to get aggregated balances');
    }
  }

  /**
   * Initiate a withdrawal from L2 to L1
   */
  async initiateWithdrawal(
    signer: ethers.Signer,
    amount: string,
    targetAddress: string
  ): Promise<ethers.providers.TransactionReceipt> {
    try {
      const l2ToL1MessagePasserContract = new ethers.Contract(
        L2_TO_L1_MESSAGE_PASSER,
        L2_TO_L1_MESSAGE_PASSER_ABI,
        signer
      );
      
      // Prepare withdrawal parameters
      const gasLimit = 100000;
      const data = '0x'; // Empty data for ETH transfer
      const amountWei = ethers.utils.parseEther(amount);
      
      // Execute withdrawal
      const tx = await l2ToL1MessagePasserContract.initiateWithdrawal(
        targetAddress,
        gasLimit,
        data,
        { value: amountWei }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Error initiating withdrawal:', error);
      throw new Error('Failed to initiate withdrawal');
    }
  }

  /**
   * Bridge ETH to another chain
   */
  async bridgeETH(
    signer: ethers.Signer,
    destinationChainId: string,
    amount: string,
    toAddress: string
  ): Promise<ethers.providers.TransactionReceipt> {
    try {
      const superchainTokenBridgeContract = new ethers.Contract(
        SUPERCHAIN_TOKEN_BRIDGE,
        SUPERCHAIN_TOKEN_BRIDGE_ABI,
        signer
      );
      
      // Prepare bridge parameters
      const minGasLimit = 100000;
      const extraData = '0x';
      const amountWei = ethers.utils.parseEther(amount);
      
      // Execute bridge transaction
      const tx = await superchainTokenBridgeContract.bridgeETH(
        parseInt(destinationChainId),
        toAddress,
        amountWei,
        minGasLimit,
        extraData,
        { value: amountWei }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Error bridging ETH:', error);
      throw new Error('Failed to bridge ETH');
    }
  }

  /**
   * Update ETH price from an API (mock implementation)
   */
  private async updateEthPrice(): Promise<void> {
    // In a real app, this would fetch from an API like CoinGecko
    // For now, we'll use a static value
    this.ethPrice = 2000; // $2000 per ETH
  }
} 