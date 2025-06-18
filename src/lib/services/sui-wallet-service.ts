/**
 * Sui Wallet Integration Service
 * Handles Sui blockchain wallet connections and transactions
 */

import { MultiChainWallet, MultiChainBalance } from '@/lib/stores/app-store';

export interface SuiConnection {
  endpoint: string;
  network: 'mainnet' | 'testnet' | 'devnet';
}

export interface SuiWalletAdapter {
  name: string;
  url: string;
  icon: string;
  readyState: 'Installed' | 'NotDetected' | 'Loadable' | 'Unsupported';
  address?: string;
  connected: boolean;
  features: string[];
}

export interface SuiCoinBalance {
  coinType: string;
  totalBalance: string;
  lockedBalance: {
    epochId: number;
    number: string;
  }[];
}

export interface SuiObject {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner: {
    AddressOwner?: string;
    ObjectOwner?: string;
    Shared?: { initial_shared_version: number };
    Immutable?: boolean;
  };
  previousTransaction: string;
  storageRebate: string;
  content?: {
    dataType: string;
    type: string;
    hasPublicTransfer: boolean;
    fields: any;
  };
}

export interface SuiTransaction {
  digest: string;
  transaction: {
    data: {
      messageVersion: string;
      transaction: {
        kind: string;
        inputs: any[];
        transactions: any[];
      };
      sender: string;
      gasData: {
        payment: any[];
        owner: string;
        price: string;
        budget: string;
      };
    };
    txSignatures: string[];
  };
  effects: {
    messageVersion: string;
    status: { status: string };
    executedEpoch: string;
    gasUsed: {
      computationCost: string;
      storageCost: string;
      storageRebate: string;
      nonRefundableStorageFee: string;
    };
    modifiedAtVersions: any[];
    transactionDigest: string;
    created?: any[];
    mutated?: any[];
    deleted?: any[];
    gasObject: {
      owner: any;
      reference: any;
    };
    dependencies: string[];
  };
  checkpoint?: string;
  timestampMs?: string;
}

export interface SuiNFT {
  objectId: string;
  name?: string;
  description?: string;
  image?: string;
  url?: string;
  collection?: string;
  creator?: string;
  type: string;
  attributes?: Record<string, any>;
}

export interface SuiStakeObject {
  objectId: string;
  validatorAddress: string;
  stakedAmount: string;
  earnedAmount: string;
  status: string;
  activationEpoch?: number;
  requestEpoch?: number;
}

export class SuiWalletService {
  private connection: SuiConnection;
  private connectedWallet: SuiWalletAdapter | null = null;
  private rpcEndpoint: string;

  constructor() {
    this.connection = {
      endpoint: process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.mainnet.sui.io',
      network: 'mainnet'
    };
    this.rpcEndpoint = this.connection.endpoint;
  }

  /**
   * Get available wallet adapters
   */
  async getAvailableWallets(): Promise<SuiWalletAdapter[]> {
    const wallets: SuiWalletAdapter[] = [
      {
        name: 'Sui Wallet',
        url: 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil',
        icon: 'https://sui.io/img/sui-logo.svg',
        readyState: typeof window !== 'undefined' && (window as any).suiWallet ? 'Installed' : 'NotDetected',
        connected: false,
        features: ['sui:connect', 'sui:signAndExecuteTransactionBlock']
      },
      {
        name: 'Ethos Wallet',
        url: 'https://ethoswallet.xyz',
        icon: 'https://ethoswallet.xyz/logo.png',
        readyState: typeof window !== 'undefined' && (window as any).ethosWallet ? 'Installed' : 'NotDetected',
        connected: false,
        features: ['sui:connect', 'sui:signAndExecuteTransactionBlock']
      },
      {
        name: 'Suiet Wallet',
        url: 'https://suiet.app',
        icon: 'https://suiet.app/logo.png',
        readyState: typeof window !== 'undefined' && (window as any).suiet ? 'Installed' : 'NotDetected',
        connected: false,
        features: ['sui:connect', 'sui:signAndExecuteTransactionBlock']
      },
      {
        name: 'Martian Wallet',
        url: 'https://martianwallet.xyz',
        icon: 'https://martianwallet.xyz/logo.png',
        readyState: typeof window !== 'undefined' && (window as any).martian ? 'Installed' : 'NotDetected',
        connected: false,
        features: ['sui:connect', 'sui:signAndExecuteTransactionBlock']
      }
    ];

    return wallets;
  }

  /**
   * Connect to a Sui wallet
   */
  async connectWallet(walletName: string): Promise<SuiWalletAdapter | null> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      let wallet: any = null;
      let adapter: SuiWalletAdapter;

      switch (walletName.toLowerCase()) {
        case 'sui wallet':
          wallet = (window as any).suiWallet;
          if (!wallet) throw new Error('Sui Wallet not installed');
          
          const suiResponse = await wallet.connect();
          adapter = {
            name: 'Sui Wallet',
            url: 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil',
            icon: 'https://sui.io/img/sui-logo.svg',
            readyState: 'Installed',
            address: suiResponse.accounts[0],
            connected: true,
            features: ['sui:connect', 'sui:signAndExecuteTransactionBlock']
          };
          break;

        case 'ethos wallet':
          wallet = (window as any).ethosWallet;
          if (!wallet) throw new Error('Ethos Wallet not installed');
          
          const ethosResponse = await wallet.connect();
          adapter = {
            name: 'Ethos Wallet',
            url: 'https://ethoswallet.xyz',
            icon: 'https://ethoswallet.xyz/logo.png',
            readyState: 'Installed',
            address: ethosResponse.accounts[0],
            connected: true,
            features: ['sui:connect', 'sui:signAndExecuteTransactionBlock']
          };
          break;

        case 'suiet wallet':
          wallet = (window as any).suiet;
          if (!wallet) throw new Error('Suiet Wallet not installed');
          
          const suietResponse = await wallet.connect();
          adapter = {
            name: 'Suiet Wallet',
            url: 'https://suiet.app',
            icon: 'https://suiet.app/logo.png',
            readyState: 'Installed',
            address: suietResponse.accounts[0],
            connected: true,
            features: ['sui:connect', 'sui:signAndExecuteTransactionBlock']
          };
          break;

        case 'martian wallet':
          wallet = (window as any).martian;
          if (!wallet) throw new Error('Martian Wallet not installed');
          
          const martianResponse = await wallet.connect();
          adapter = {
            name: 'Martian Wallet',
            url: 'https://martianwallet.xyz',
            icon: 'https://martianwallet.xyz/logo.png',
            readyState: 'Installed',
            address: martianResponse.accounts[0],
            connected: true,
            features: ['sui:connect', 'sui:signAndExecuteTransactionBlock']
          };
          break;

        default:
          throw new Error(`Unsupported wallet: ${walletName}`);
      }

      this.connectedWallet = adapter;
      return adapter;
    } catch (error) {
      console.error('Error connecting to Sui wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    if (this.connectedWallet && typeof window !== 'undefined') {
      try {
        switch (this.connectedWallet.name.toLowerCase()) {
          case 'sui wallet':
            await (window as any).suiWallet?.disconnect();
            break;
          case 'ethos wallet':
            await (window as any).ethosWallet?.disconnect();
            break;
          case 'suiet wallet':
            await (window as any).suiet?.disconnect();
            break;
          case 'martian wallet':
            await (window as any).martian?.disconnect();
            break;
        }
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }
    this.connectedWallet = null;
  }

  /**
   * Get SUI balance for an address
   */
  async getSUIBalance(address: string): Promise<number> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getBalance',
          params: [address, '0x2::sui::SUI']
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      // Convert MIST to SUI (1 SUI = 1e9 MIST)
      return parseInt(data.result.totalBalance) / 1e9;
    } catch (error) {
      console.error('Error fetching SUI balance:', error);
      return 0;
    }
  }

  /**
   * Get all coin balances for an address
   */
  async getAllBalances(address: string): Promise<SuiCoinBalance[]> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getAllBalances',
          params: [address]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return data.result || [];
    } catch (error) {
      console.error('Error fetching all balances:', error);
      return [];
    }
  }

  /**
   * Get comprehensive wallet balances
   */
  async getWalletBalances(address: string): Promise<MultiChainBalance[]> {
    try {
      const balances: MultiChainBalance[] = [];
      const allBalances = await this.getAllBalances(address);

      for (const balance of allBalances) {
        const amount = parseInt(balance.totalBalance) / 1e9; // Convert from MIST
        if (amount > 0) {
          const coinInfo = await this.getCoinInfo(balance.coinType);
          const price = await this.getCoinPrice(coinInfo.symbol);

          balances.push({
            id: `sui-${balance.coinType}-${address}`,
            network: 'sui',
            symbol: coinInfo.symbol,
            balance: amount,
            balanceUSD: amount * price,
            address: balance.coinType,
            isNative: balance.coinType === '0x2::sui::SUI',
            decimals: 9
          });
        }
      }

      return balances;
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      return [];
    }
  }

  /**
   * Get owned objects (including NFTs)
   */
  async getOwnedObjects(address: string, objectType?: string): Promise<SuiObject[]> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getOwnedObjects',
          params: [
            address,
            {
              filter: objectType ? { StructType: objectType } : undefined,
              options: {
                showType: true,
                showOwner: true,
                showPreviousTransaction: true,
                showDisplay: true,
                showContent: true,
                showBcs: false,
                showStorageRebate: true
              }
            }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return data.result.data || [];
    } catch (error) {
      console.error('Error fetching owned objects:', error);
      return [];
    }
  }

  /**
   * Get NFTs owned by address
   */
  async getNFTs(address: string): Promise<SuiNFT[]> {
    try {
      const objects = await this.getOwnedObjects(address);
      const nfts: SuiNFT[] = [];

      for (const obj of objects) {
        // Check if object is likely an NFT based on type
        if (obj.type && this.isNFTType(obj.type)) {
          const metadata = await this.getNFTMetadata(obj.objectId);
          nfts.push({
            objectId: obj.objectId,
            type: obj.type,
            ...metadata
          });
        }
      }

      return nfts;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address: string, limit: number = 20): Promise<SuiTransaction[]> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_queryTransactionBlocks',
          params: [
            {
              filter: { FromAddress: address },
              options: {
                showInput: true,
                showRawInput: false,
                showEffects: true,
                showEvents: true,
                showObjectChanges: false,
                showBalanceChanges: false
              }
            },
            null, // cursor
            limit,
            true // descending order
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return data.result.data || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get staking objects for address
   */
  async getStakeObjects(address: string): Promise<SuiStakeObject[]> {
    try {
      const objects = await this.getOwnedObjects(address, '0x3::staking_pool::StakedSui');
      const stakeObjects: SuiStakeObject[] = [];

      for (const obj of objects) {
        if (obj.content?.fields) {
          stakeObjects.push({
            objectId: obj.objectId,
            validatorAddress: obj.content.fields.pool_id || 'Unknown',
            stakedAmount: obj.content.fields.principal?.toString() || '0',
            earnedAmount: '0', // Would need to calculate from rewards
            status: 'active', // Would need to determine from object state
            activationEpoch: obj.content.fields.stake_activation_epoch
          });
        }
      }

      return stakeObjects;
    } catch (error) {
      console.error('Error fetching stake objects:', error);
      return [];
    }
  }

  /**
   * Send SUI transaction
   */
  async sendSUI(to: string, amount: number): Promise<string | null> {
    if (!this.connectedWallet?.address) {
      throw new Error('No wallet connected');
    }

    try {
      // This would require proper transaction building with @mysten/sui.js
      console.log(`Sending ${amount} SUI to ${to} from ${this.connectedWallet.address}`);
      
      // Mock transaction digest
      return 'mock_sui_transaction_digest_' + Date.now();
    } catch (error) {
      console.error('Error sending SUI:', error);
      throw error;
    }
  }

  /**
   * Send coin transaction
   */
  async sendCoin(coinType: string, to: string, amount: number): Promise<string | null> {
    if (!this.connectedWallet?.address) {
      throw new Error('No wallet connected');
    }

    try {
      console.log(`Sending ${amount} ${coinType} to ${to} from ${this.connectedWallet.address}`);
      
      // Mock transaction digest
      return 'mock_coin_tx_digest_' + Date.now();
    } catch (error) {
      console.error('Error sending coin:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async getCoinInfo(coinType: string): Promise<{ symbol: string; name: string; decimals: number }> {
    // Mock coin registry - would integrate with Sui coin registry
    const coinRegistry: Record<string, { symbol: string; name: string; decimals: number }> = {
      '0x2::sui::SUI': { symbol: 'SUI', name: 'Sui', decimals: 9 },
      '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN': { symbol: 'USDT', name: 'Tether USD', decimals: 6 }
    };

    return coinRegistry[coinType] || {
      symbol: coinType.split('::').pop()?.toUpperCase() || 'UNKNOWN',
      name: 'Unknown Coin',
      decimals: 9
    };
  }

  private async getCoinPrice(symbol: string): Promise<number> {
    try {
      // Mock price data - would integrate with price APIs
      const prices: Record<string, number> = {
        'SUI': 0.85,
        'USDC': 1.00,
        'USDT': 1.00
      };
      return prices[symbol] || 0;
    } catch (error) {
      return 0;
    }
  }

  private isNFTType(type: string): boolean {
    // Heuristics to determine if an object type is an NFT
    const nftPatterns = [
      /::nft::/i,
      /::collectible::/i,
      /::artwork::/i,
      /::token::/i,
      /display<.*>/i
    ];

    return nftPatterns.some(pattern => pattern.test(type));
  }

  private async getNFTMetadata(objectId: string): Promise<Partial<SuiNFT>> {
    try {
      // Mock NFT metadata - would fetch from Sui display or IPFS
      return {
        name: `NFT ${objectId.substring(0, 8)}`,
        description: 'Sample NFT on Sui',
        image: `https://via.placeholder.com/300?text=${objectId.substring(0, 8)}`,
        creator: 'Unknown Creator'
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Get current connected wallet
   */
  getConnectedWallet(): SuiWalletAdapter | null {
    return this.connectedWallet;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!this.connectedWallet?.connected;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    wallet?: string;
    address?: string;
    endpoint: string;
    network: string;
  } {
    return {
      connected: this.isConnected(),
      wallet: this.connectedWallet?.name,
      address: this.connectedWallet?.address,
      endpoint: this.rpcEndpoint,
      network: this.connection.network
    };
  }
}

// Create and export singleton instance
export const suiWalletService = new SuiWalletService();
export default suiWalletService;