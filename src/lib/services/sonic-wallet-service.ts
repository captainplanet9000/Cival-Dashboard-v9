/**
 * Sonic Wallet Integration Service
 * Handles Sonic blockchain wallet connections and transactions
 */

import { MultiChainWallet, MultiChainBalance } from '@/lib/stores/app-store';

export interface SonicConnection {
  endpoint: string;
  chainId: number;
  network: 'mainnet' | 'testnet';
}

export interface SonicWalletAdapter {
  name: string;
  url: string;
  icon: string;
  readyState: 'Installed' | 'NotDetected' | 'Loadable' | 'Unsupported';
  address?: string;
  connected: boolean;
  chainId?: number;
}

export interface SonicTokenBalance {
  contractAddress?: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  priceUSD?: number;
  balanceUSD?: number;
}

export interface SonicTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed?: string;
  cumulativeGasUsed?: string;
  status: number;
  timestamp: number;
  input: string;
  logs?: any[];
  tokenTransfers?: {
    from: string;
    to: string;
    value: string;
    token: {
      address: string;
      symbol: string;
      decimals: number;
    };
  }[];
}

export interface SonicNFT {
  contractAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  metadata?: any;
  collection?: {
    name: string;
    symbol: string;
  };
  owner: string;
}

export interface SonicStakingPosition {
  validatorAddress: string;
  stakedAmount: string;
  rewardsEarned: string;
  delegationId: string;
  status: 'active' | 'undelegating' | 'withdrawn';
  lockupPeriod?: number;
  unlockTime?: number;
}

export interface SonicDeFiPosition {
  protocol: string;
  type: 'liquidity' | 'lending' | 'farming' | 'vault';
  token0?: { symbol: string; amount: string };
  token1?: { symbol: string; amount: string };
  totalValueUSD: number;
  apy?: number;
  rewards?: { symbol: string; amount: string }[];
}

export class SonicWalletService {
  private connection: SonicConnection;
  private connectedWallet: SonicWalletAdapter | null = null;
  private rpcEndpoint: string;

  constructor() {
    this.connection = {
      endpoint: process.env.NEXT_PUBLIC_SONIC_RPC_URL || 'https://rpc.sonic.network',
      chainId: 146, // Sonic mainnet chain ID
      network: 'mainnet'
    };
    this.rpcEndpoint = this.connection.endpoint;
  }

  /**
   * Get available wallet adapters
   */
  async getAvailableWallets(): Promise<SonicWalletAdapter[]> {
    const wallets: SonicWalletAdapter[] = [
      {
        name: 'MetaMask',
        url: 'https://metamask.io',
        icon: 'https://docs.metamask.io/img/metamask-fox.svg',
        readyState: typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask ? 'Installed' : 'NotDetected',
        connected: false
      },
      {
        name: 'WalletConnect',
        url: 'https://walletconnect.com',
        icon: 'https://walletconnect.com/static/logos/walletconnect-logo.svg',
        readyState: 'Loadable',
        connected: false
      },
      {
        name: 'Coinbase Wallet',
        url: 'https://wallet.coinbase.com',
        icon: 'https://wallet.coinbase.com/img/favicon.ico',
        readyState: typeof window !== 'undefined' && (window as any).ethereum?.isCoinbaseWallet ? 'Installed' : 'NotDetected',
        connected: false
      },
      {
        name: 'Trust Wallet',
        url: 'https://trustwallet.com',
        icon: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
        readyState: typeof window !== 'undefined' && (window as any).ethereum?.isTrust ? 'Installed' : 'NotDetected',
        connected: false
      }
    ];

    return wallets;
  }

  /**
   * Connect to a Sonic-compatible wallet
   */
  async connectWallet(walletName: string): Promise<SonicWalletAdapter | null> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      let provider: any = null;
      let adapter: SonicWalletAdapter;

      switch (walletName.toLowerCase()) {
        case 'metamask':
          provider = (window as any).ethereum;
          if (!provider?.isMetaMask) throw new Error('MetaMask not installed');
          
          // Request account access
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          
          // Switch to Sonic network if needed
          await this.switchToSonicNetwork(provider);
          
          adapter = {
            name: 'MetaMask',
            url: 'https://metamask.io',
            icon: 'https://docs.metamask.io/img/metamask-fox.svg',
            readyState: 'Installed',
            address: accounts[0],
            connected: true,
            chainId: await this.getChainId(provider)
          };
          break;

        case 'coinbase wallet':
          provider = (window as any).ethereum;
          if (!provider?.isCoinbaseWallet) throw new Error('Coinbase Wallet not installed');
          
          const coinbaseAccounts = await provider.request({ method: 'eth_requestAccounts' });
          await this.switchToSonicNetwork(provider);
          
          adapter = {
            name: 'Coinbase Wallet',
            url: 'https://wallet.coinbase.com',
            icon: 'https://wallet.coinbase.com/img/favicon.ico',
            readyState: 'Installed',
            address: coinbaseAccounts[0],
            connected: true,
            chainId: await this.getChainId(provider)
          };
          break;

        case 'trust wallet':
          provider = (window as any).ethereum;
          if (!provider?.isTrust) throw new Error('Trust Wallet not installed');
          
          const trustAccounts = await provider.request({ method: 'eth_requestAccounts' });
          await this.switchToSonicNetwork(provider);
          
          adapter = {
            name: 'Trust Wallet',
            url: 'https://trustwallet.com',
            icon: 'https://trustwallet.com/assets/images/media/assets/trust_platform.svg',
            readyState: 'Installed',
            address: trustAccounts[0],
            connected: true,
            chainId: await this.getChainId(provider)
          };
          break;

        case 'walletconnect':
          // WalletConnect integration would require @walletconnect/client
          throw new Error('WalletConnect integration not implemented');

        default:
          throw new Error(`Unsupported wallet: ${walletName}`);
      }

      this.connectedWallet = adapter;
      return adapter;
    } catch (error) {
      console.error('Error connecting to Sonic wallet:', error);
      throw error;
    }
  }

  /**
   * Switch to Sonic network
   */
  private async switchToSonicNetwork(provider: any): Promise<void> {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${this.connection.chainId.toString(16)}` }]
      });
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${this.connection.chainId.toString(16)}`,
            chainName: 'Sonic Mainnet',
            nativeCurrency: {
              name: 'Sonic',
              symbol: 'SONIC',
              decimals: 18
            },
            rpcUrls: [this.rpcEndpoint],
            blockExplorerUrls: ['https://explorer.sonic.network']
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Get chain ID from provider
   */
  private async getChainId(provider: any): Promise<number> {
    const chainId = await provider.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    this.connectedWallet = null;
  }

  /**
   * Get SONIC balance for an address
   */
  async getSONICBalance(address: string): Promise<number> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      // Convert Wei to SONIC (1 SONIC = 1e18 Wei)
      return parseInt(data.result, 16) / 1e18;
    } catch (error) {
      console.error('Error fetching SONIC balance:', error);
      return 0;
    }
  }

  /**
   * Get ERC-20 token balance
   */
  async getTokenBalance(address: string, tokenAddress: string, decimals: number = 18): Promise<number> {
    try {
      // ERC-20 balanceOf function call
      const data = '0x70a08231' + address.slice(2).padStart(64, '0');
      
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: tokenAddress,
            data: data
          }, 'latest']
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error.message);

      const balance = parseInt(result.result, 16);
      return balance / Math.pow(10, decimals);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive wallet balances
   */
  async getWalletBalances(address: string): Promise<MultiChainBalance[]> {
    try {
      const balances: MultiChainBalance[] = [];

      // Get SONIC balance
      const sonicBalance = await this.getSONICBalance(address);
      if (sonicBalance > 0) {
        balances.push({
          id: `sonic-native-${address}`,
          network: 'sonic',
          symbol: 'SONIC',
          balance: sonicBalance,
          balanceUSD: sonicBalance * await this.getTokenPrice('SONIC'),
          address,
          isNative: true,
          decimals: 18
        });
      }

      // Get common token balances
      const commonTokens = await this.getCommonTokens();
      for (const token of commonTokens) {
        const balance = await this.getTokenBalance(address, token.address, token.decimals);
        if (balance > 0) {
          const price = await this.getTokenPrice(token.symbol);
          balances.push({
            id: `sonic-${token.address}-${address}`,
            network: 'sonic',
            symbol: token.symbol,
            balance,
            balanceUSD: balance * price,
            address: token.address,
            isNative: false,
            decimals: token.decimals
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
   * Get transaction history for an address
   */
  async getTransactionHistory(address: string, limit: number = 20): Promise<SonicTransaction[]> {
    try {
      // This would typically use a block explorer API like Etherscan-compatible API
      // For now, we'll return mock data
      const transactions: SonicTransaction[] = [];
      
      for (let i = 0; i < Math.min(limit, 10); i++) {
        transactions.push({
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          blockNumber: 1000000 - i,
          blockHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          transactionIndex: 0,
          from: address,
          to: `0x${Math.random().toString(16).substr(2, 40)}`,
          value: (Math.random() * 10).toString(),
          gas: '21000',
          gasPrice: '20000000000',
          gasUsed: '21000',
          cumulativeGasUsed: '21000',
          status: 1,
          timestamp: Date.now() - (i * 60 * 60 * 1000),
          input: '0x'
        });
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get NFTs owned by address
   */
  async getNFTs(address: string): Promise<SonicNFT[]> {
    try {
      // Mock NFT data - would integrate with NFT indexer
      const nfts: SonicNFT[] = [];
      
      for (let i = 0; i < 3; i++) {
        nfts.push({
          contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          tokenId: i.toString(),
          name: `Sonic NFT #${i}`,
          description: `A unique NFT on Sonic blockchain`,
          image: `https://via.placeholder.com/300?text=NFT${i}`,
          collection: {
            name: 'Sonic Collection',
            symbol: 'SONIC'
          },
          owner: address
        });
      }

      return nfts;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }

  /**
   * Get staking positions
   */
  async getStakingPositions(address: string): Promise<SonicStakingPosition[]> {
    try {
      // Mock staking data - would integrate with Sonic staking contracts
      const positions: SonicStakingPosition[] = [
        {
          validatorAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
          stakedAmount: (Math.random() * 1000).toFixed(2),
          rewardsEarned: (Math.random() * 50).toFixed(4),
          delegationId: `delegation_${Date.now()}`,
          status: 'active',
          lockupPeriod: 30,
          unlockTime: Date.now() + (30 * 24 * 60 * 60 * 1000)
        }
      ];

      return positions;
    } catch (error) {
      console.error('Error fetching staking positions:', error);
      return [];
    }
  }

  /**
   * Get DeFi positions
   */
  async getDeFiPositions(address: string): Promise<SonicDeFiPosition[]> {
    try {
      // Mock DeFi data - would integrate with Sonic DeFi protocols
      const positions: SonicDeFiPosition[] = [
        {
          protocol: 'SonicSwap',
          type: 'liquidity',
          token0: { symbol: 'SONIC', amount: '100.5' },
          token1: { symbol: 'USDC', amount: '2500.75' },
          totalValueUSD: 5001.5,
          apy: 12.5,
          rewards: [{ symbol: 'SWAP', amount: '25.3' }]
        },
        {
          protocol: 'SonicLend',
          type: 'lending',
          token0: { symbol: 'USDC', amount: '1000' },
          totalValueUSD: 1000,
          apy: 8.2
        }
      ];

      return positions;
    } catch (error) {
      console.error('Error fetching DeFi positions:', error);
      return [];
    }
  }

  /**
   * Send SONIC transaction
   */
  async sendSONIC(to: string, amount: number): Promise<string | null> {
    if (!this.connectedWallet?.address) {
      throw new Error('No wallet connected');
    }

    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('Ethereum provider not available');
      }

      const provider = (window as any).ethereum;
      const params = {
        from: this.connectedWallet.address,
        to: to,
        value: '0x' + (amount * 1e18).toString(16),
        gas: '0x5208', // 21000 in hex
        gasPrice: '0x4a817c800' // 20 gwei in hex
      };

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [params]
      });

      return txHash;
    } catch (error) {
      console.error('Error sending SONIC:', error);
      throw error;
    }
  }

  /**
   * Send ERC-20 token transaction
   */
  async sendToken(tokenAddress: string, to: string, amount: number, decimals: number = 18): Promise<string | null> {
    if (!this.connectedWallet?.address) {
      throw new Error('No wallet connected');
    }

    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('Ethereum provider not available');
      }

      const provider = (window as any).ethereum;
      
      // ERC-20 transfer function call data
      const transferData = '0xa9059cbb' + // transfer function selector
        to.slice(2).padStart(64, '0') + // recipient address
        (amount * Math.pow(10, decimals)).toString(16).padStart(64, '0'); // amount

      const params = {
        from: this.connectedWallet.address,
        to: tokenAddress,
        data: transferData,
        gas: '0x186a0', // 100000 in hex
        gasPrice: '0x4a817c800' // 20 gwei in hex
      };

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [params]
      });

      return txHash;
    } catch (error) {
      console.error('Error sending token:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async getCommonTokens(): Promise<Array<{ address: string; symbol: string; decimals: number }>> {
    // Mock common tokens on Sonic - would load from token registry
    return [
      { address: '0x1234567890123456789012345678901234567890', symbol: 'USDC', decimals: 6 },
      { address: '0x2345678901234567890123456789012345678901', symbol: 'USDT', decimals: 6 },
      { address: '0x3456789012345678901234567890123456789012', symbol: 'WETH', decimals: 18 },
      { address: '0x4567890123456789012345678901234567890123', symbol: 'WBTC', decimals: 8 }
    ];
  }

  private async getTokenPrice(symbol: string): Promise<number> {
    try {
      // Mock price data - would integrate with price APIs
      const prices: Record<string, number> = {
        'SONIC': 0.025,
        'USDC': 1.00,
        'USDT': 1.00,
        'WETH': 2400,
        'WBTC': 43000
      };
      return prices[symbol] || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get current connected wallet
   */
  getConnectedWallet(): SonicWalletAdapter | null {
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
    chainId?: number;
    endpoint: string;
    network: string;
  } {
    return {
      connected: this.isConnected(),
      wallet: this.connectedWallet?.name,
      address: this.connectedWallet?.address,
      chainId: this.connectedWallet?.chainId,
      endpoint: this.rpcEndpoint,
      network: this.connection.network
    };
  }
}

// Create and export singleton instance
export const sonicWalletService = new SonicWalletService();
export default sonicWalletService;