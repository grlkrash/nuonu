import { CdpWalletProvider } from '@coinbase/agentkit';
import { env } from '../env';

export interface CdpWalletConfig {
  apiKeyName: string;
  apiKeyPrivateKey: string;
  cdpWalletData?: string;
  networkId?: string;
}

/**
 * CDP Wallet Manager - Singleton for managing CDP wallet provider
 */
class CdpWalletManager {
  private walletProvider: any = null;

  /**
   * Initialize the CDP wallet provider
   */
  async initialize(config: CdpWalletConfig) {
    try {
      // If wallet provider already exists, return it
      if (this.walletProvider) {
        return this.walletProvider;
      }

      // Configure CDP Wallet Provider
      this.walletProvider = await CdpWalletProvider.configureWithWallet({
        apiKeyName: config.apiKeyName,
        apiKeyPrivateKey: config.apiKeyPrivateKey,
        cdpWalletData: config.cdpWalletData,
        networkId: config.networkId || 'base-sepolia',
      });

      return this.walletProvider;
    } catch (error) {
      console.error('Failed to initialize CDP wallet provider:', error);
      throw error;
    }
  }

  /**
   * Initialize the CDP wallet provider with environment variables
   */
  async initializeWithEnv() {
    const apiKeyName = process.env.CDP_API_KEY_NAME || '';
    const apiKeyPrivateKey = process.env.CDP_API_KEY_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
    const networkId = process.env.NETWORK_ID || 'base-sepolia';
    
    if (!apiKeyName || !apiKeyPrivateKey) {
      throw new Error('CDP API credentials not configured');
    }
    
    return this.initialize({
      apiKeyName,
      apiKeyPrivateKey,
      networkId,
    });
  }

  /**
   * Get the CDP wallet provider
   */
  getProvider() {
    if (!this.walletProvider) {
      throw new Error('CDP wallet provider not initialized');
    }
    
    return this.walletProvider;
  }

  /**
   * Export wallet data for persistence
   */
  async exportWallet() {
    if (!this.walletProvider) {
      throw new Error('CDP wallet provider not initialized');
    }
    
    return this.walletProvider.exportWallet();
  }
}

// Create singleton instance
export const cdpWalletManager = new CdpWalletManager(); 