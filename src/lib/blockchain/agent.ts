import { AgentKit, CdpWalletProvider } from '@coinbase/agentkit';
import { artistFundActionProvider, zkSyncArtistFundActionProvider, flowArtistFundActionProvider } from './action-providers';
import { cdpWalletManager } from './cdp-wallet';
import fs from 'fs';
import path from 'path';

// Configure wallet data file
const WALLET_DATA_FILE = path.join(process.cwd(), 'wallet_data.txt');

/**
 * Agent Manager - Singleton for managing the AI agent
 */
class AgentManager {
  private agentKit: any = null;
  private walletProvider: any = null;
  private isInitialized = false;

  /**
   * Initialize the agent with CDP Agentkit
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return this.agentKit;
      }

      // Read existing wallet data if available
      let walletDataStr: string | null = null;
      if (fs.existsSync(WALLET_DATA_FILE)) {
        try {
          walletDataStr = fs.readFileSync(WALLET_DATA_FILE, 'utf8');
        } catch (error) {
          console.error('Error reading wallet data:', error);
        }
      }

      // Configure CDP Wallet Provider
      const config = {
        apiKeyName: process.env.CDP_API_KEY_NAME || '',
        apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
        cdpWalletData: walletDataStr || undefined,
        networkId: process.env.NETWORK_ID || 'base-sepolia',
      };

      // Initialize wallet provider
      this.walletProvider = await cdpWalletManager.initialize(config);

      // Initialize AgentKit
      this.agentKit = await AgentKit.from({
        walletProvider: this.walletProvider,
        actionProviders: [
          artistFundActionProvider(),
          zkSyncArtistFundActionProvider(),
          flowArtistFundActionProvider(),
        ],
      });

      // Save wallet data for future use
      const exportedWallet = await this.walletProvider.exportWallet();
      fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

      this.isInitialized = true;
      return this.agentKit;
    } catch (error) {
      console.error('Failed to initialize agent:', error);
      throw error;
    }
  }

  /**
   * Get the agent instance
   */
  async getAgent() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.agentKit;
  }

  /**
   * Execute an action with the agent
   */
  async executeAction(actionName: string, params: any) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.agentKit.execute(actionName, params);
  }

  /**
   * Get wallet details
   */
  async getWalletDetails() {
    if (!this.walletProvider) {
      throw new Error('Wallet provider not initialized');
    }
    
    const wallet = await this.walletProvider.get();
    return {
      address: wallet.address,
      network: process.env.NETWORK_ID || 'base-sepolia',
    };
  }
}

// Create singleton instance
export const agentManager = new AgentManager(); 