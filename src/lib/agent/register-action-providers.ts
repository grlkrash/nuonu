import { AgentKit } from '@coinbase/agentkit';
import {
  ArtistFundActionProvider,
  ZkSyncArtistFundActionProvider,
  FlowArtistFundActionProvider,
  OptimismInteropActionProvider
} from '../blockchain/action-providers';

/**
 * Registers all action providers with the AgentKit instance
 * @param agentKit The AgentKit instance to register the action providers with
 * @returns The AgentKit instance with registered action providers
 */
export function registerActionProviders(agentKit: AgentKit): AgentKit {
  // Initialize action providers with wallet provider from AgentKit
  const walletProvider = agentKit.getWalletProvider();
  
  const artistFundActionProvider = new ArtistFundActionProvider({ walletProvider });
  const zkSyncArtistFundActionProvider = new ZkSyncArtistFundActionProvider({ walletProvider });
  const flowArtistFundActionProvider = new FlowArtistFundActionProvider({ walletProvider });
  const optimismInteropActionProvider = new OptimismInteropActionProvider({ walletProvider });

  // Register action providers with AgentKit
  agentKit.registerActionProvider('artistFundActionProvider', artistFundActionProvider);
  agentKit.registerActionProvider('zkSyncArtistFundActionProvider', zkSyncArtistFundActionProvider);
  agentKit.registerActionProvider('flowArtistFundActionProvider', flowArtistFundActionProvider);
  agentKit.registerActionProvider('optimismInteropActionProvider', optimismInteropActionProvider);

  console.log('Action providers registered successfully');
  
  return agentKit;
}

/**
 * Creates an AgentKit instance with all action providers registered
 * @returns An AgentKit instance with all action providers registered
 */
export function createAgentKitWithActionProviders(): AgentKit {
  const agentKit = new AgentKit();
  return registerActionProviders(agentKit);
}

export default createAgentKitWithActionProviders; 