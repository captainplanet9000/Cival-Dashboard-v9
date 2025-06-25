/**
 * Solana Wallet Integration Service
 * Handles Solana blockchain wallet connections and transactions
 */

import { MultiChainWallet, MultiChainBalance } from '@/lib/stores/app-store';

export interface SolanaConnection {
  endpoint: string;
  commitment: 'confirmed' | 'finalized' | 'processed';
}

export interface SolanaWalletAdapter {
  name: string;
  url: string;
  icon: string;
  readyState: 'Installed' | 'NotDetected' | 'Loadable' | 'Unsupported';
  publicKey?: string;
  connected: boolean;
}

export interface SolanaTokenAccount {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

export interface SolanaTransaction {
  signature: string;
  slot: number;
  blockTime?: number;
  meta?: {
    fee: number;
    preBalances: number[];
    postBalances: number[];
    err?: any;
  };
  transaction: {
    message: {
      accountKeys: string[];
      instructions: any[];
    };
  };
}

export interface SolanaNFT {
  mint: string;
  name?: string;
  symbol?: string;
  uri?: string;
  image?: string;
  description?: string;
  collection?: string;
  floorPrice?: number;
}

export interface SolanaStakeAccount {
  account: string;
  validator: string;
  stakeAmount: number;
  activationEpoch: number;
  deactivationEpoch?: number;
  rewards: number;
  status: 'active' | 'activating' | 'deactivating' | 'inactive';
}

export class SolanaWalletService {
  private connection: SolanaConnection;
  private connectedWallet: SolanaWalletAdapter | null = null;
  private rpcEndpoint: string;

  constructor() {
    this.connection = {
      endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      commitment: 'confirmed'
    };
    this.rpcEndpoint = this.connection.endpoint;
  }

  /**
   * Get available wallet adapters
   */
  async getAvailableWallets(): Promise<SolanaWalletAdapter[]> {
    const wallets: SolanaWalletAdapter[] = [
      {
        name: 'Phantom',
        url: 'https://phantom.app',
        icon: 'https://www.phantom.app/img/phantom-icon.svg',
        readyState: typeof window !== 'undefined' && (window as any).phantom?.solana ? 'Installed' : 'NotDetected',
        connected: false
      },
      {
        name: 'Solflare',
        url: 'https://solflare.com',
        icon: 'https://solflare.com/img/logo.svg',
        readyState: typeof window !== 'undefined' && (window as any).solflare ? 'Installed' : 'NotDetected',
        connected: false
      },
      {
        name: 'Backpack',
        url: 'https://backpack.app',
        icon: 'https://backpack.app/icon.png',
        readyState: typeof window !== 'undefined' && (window as any).backpack ? 'Installed' : 'NotDetected',
        connected: false
      },
      {
        name: 'Glow',
        url: 'https://glow.app',
        icon: 'https://glow.app/icon.png',
        readyState: typeof window !== 'undefined' && (window as any).glow ? 'Installed' : 'NotDetected',
        connected: false
      }
    ];

    return wallets;
  }

  /**
   * Connect to a Solana wallet
   */
  async connectWallet(walletName: string): Promise<SolanaWalletAdapter | null> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object not available');
      }

      let wallet: any = null;
      let adapter: SolanaWalletAdapter;

      switch (walletName.toLowerCase()) {
        case 'phantom':
          wallet = (window as any).phantom?.solana;
          if (!wallet) throw new Error('Phantom wallet not installed');
          
          const phantomResponse = await wallet.connect();
          adapter = {
            name: 'Phantom',
            url: 'https://phantom.app',
            icon: 'https://www.phantom.app/img/phantom-icon.svg',
            readyState: 'Installed',
            publicKey: phantomResponse.publicKey.toString(),
            connected: true
          };
          break;

        case 'solflare':
          wallet = (window as any).solflare;
          if (!wallet) throw new Error('Solflare wallet not installed');
          
          await wallet.connect();
          adapter = {
            name: 'Solflare',
            url: 'https://solflare.com',
            icon: 'https://solflare.com/img/logo.svg',
            readyState: 'Installed',
            publicKey: wallet.publicKey?.toString(),
            connected: wallet.connected
          };
          break;

        case 'backpack':
          wallet = (window as any).backpack;
          if (!wallet) throw new Error('Backpack wallet not installed');
          
          await wallet.connect();
          adapter = {
            name: 'Backpack',
            url: 'https://backpack.app',
            icon: 'https://backpack.app/icon.png',
            readyState: 'Installed',
            publicKey: wallet.publicKey?.toString(),
            connected: wallet.connected
          };
          break;

        default:
          throw new Error(`Unsupported wallet: ${walletName}`);
      }

      this.connectedWallet = adapter;
      return adapter;
    } catch (error) {
      console.error('Error connecting to Solana wallet:', error);
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
          case 'phantom':
            await (window as any).phantom?.solana?.disconnect();
            break;
          case 'solflare':
            await (window as any).solflare?.disconnect();
            break;
          case 'backpack':
            await (window as any).backpack?.disconnect();
            break;
        }
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }
    this.connectedWallet = null;
  }

  /**
   * Get SOL balance for a wallet address
   */
  async getSOLBalance(address: string): Promise<number> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address, { commitment: this.connection.commitment }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      // Convert lamports to SOL (1 SOL = 1e9 lamports)
      return data.result.value / 1e9;
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      return 0;
    }
  }

  /**
   * Get SPL token balances for a wallet
   */
  async getTokenBalances(address: string): Promise<SolanaTokenAccount[]> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            address,
            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, // SPL Token Program
            { encoding: 'jsonParsed', commitment: this.connection.commitment }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return data.result.value.map((account: any) => ({
        mint: account.account.data.parsed.info.mint,
        owner: account.account.data.parsed.info.owner,
        amount: account.account.data.parsed.info.tokenAmount.amount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
        uiAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
        uiAmountString: account.account.data.parsed.info.tokenAmount.uiAmountString
      }));
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }

  /**
   * Get comprehensive wallet balances
   */
  async getWalletBalances(address: string): Promise<MultiChainBalance[]> {
    try {
      const balances: MultiChainBalance[] = [];

      // Get SOL balance
      const solBalance = await this.getSOLBalance(address);
      if (solBalance > 0) {
        balances.push({
          id: `sol-${address}`,
          network: 'solana',
          symbol: 'SOL',
          balance: solBalance,
          balanceUSD: solBalance * await this.getTokenPrice('SOL'),
          address,
          isNative: true,
          decimals: 9
        });
      }

      // Get SPL token balances
      const tokenAccounts = await this.getTokenBalances(address);
      const tokenPrices = await this.getBatchTokenPrices(tokenAccounts.map(t => t.mint));

      for (const account of tokenAccounts) {
        if (account.uiAmount && account.uiAmount > 0) {
          const tokenInfo = await this.getTokenInfo(account.mint);
          const price = tokenPrices[account.mint] || 0;

          balances.push({
            id: `spl-${account.mint}-${address}`,
            network: 'solana',
            symbol: tokenInfo?.symbol || account.mint.substring(0, 8),
            balance: account.uiAmount,
            balanceUSD: account.uiAmount * price,
            address: account.mint,
            isNative: false,
            decimals: account.decimals
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
  async getTransactionHistory(address: string, limit: number = 20): Promise<SolanaTransaction[]> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [address, { limit, commitment: this.connection.commitment }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      // Get detailed transaction data
      const transactions: SolanaTransaction[] = [];
      for (const sig of data.result.slice(0, 10)) { // Limit detailed fetches
        const txData = await this.getTransaction(sig.signature);
        if (txData) transactions.push(txData);
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get detailed transaction data
   */
  async getTransaction(signature: string): Promise<SolanaTransaction | null> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [signature, { encoding: 'jsonParsed', commitment: 'confirmed' }]
        })
      });

      const data = await response.json();
      if (data.error || !data.result) return null;

      return {
        signature,
        slot: data.result.slot,
        blockTime: data.result.blockTime,
        meta: data.result.meta,
        transaction: data.result.transaction
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Get NFTs owned by address
   */
  async getNFTs(address: string): Promise<SolanaNFT[]> {
    try {
      // This is a simplified implementation
      // In production, you'd use services like Metaplex or Moralis
      const tokenAccounts = await this.getTokenBalances(address);
      const nfts: SolanaNFT[] = [];

      for (const account of tokenAccounts) {
        if (account.uiAmount === 1 && account.decimals === 0) {
          // Likely an NFT (amount = 1, decimals = 0)
          const metadata = await this.getNFTMetadata(account.mint);
          if (metadata) {
            nfts.push({
              mint: account.mint,
              ...metadata
            });
          }
        }
      }

      return nfts;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      return [];
    }
  }

  /**
   * Get staking accounts for address
   */
  async getStakeAccounts(address: string): Promise<SolanaStakeAccount[]> {
    try {
      const response = await fetch(this.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getProgramAccounts',
          params: [
            'Stake11111111111111111111111111111111111112', // Stake Program ID
            {
              commitment: this.connection.commitment,
              filters: [
                {
                  memcmp: {
                    offset: 12, // Staker authority offset
                    bytes: address
                  }
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      if (data.error) return [];

      // Parse stake account data
      const stakeAccounts: SolanaStakeAccount[] = [];
      for (const account of data.result) {
        // Simplified parsing - would need proper stake account parsing
        stakeAccounts.push({
          account: account.pubkey,
          validator: 'Unknown', // Would need to parse from account data
          stakeAmount: 0, // Would need to parse from account data
          activationEpoch: 0,
          rewards: 0,
          status: 'active'
        });
      }

      return stakeAccounts;
    } catch (error) {
      console.error('Error fetching stake accounts:', error);
      return [];
    }
  }

  /**
   * Send SOL transaction
   */
  async sendSOL(to: string, amount: number): Promise<string | null> {
    if (!this.connectedWallet?.publicKey) {
      throw new Error('No wallet connected');
    }

    try {
      // This would require proper transaction building with @solana/web3.js
      // For now, this is a placeholder implementation
      console.log(`Sending ${amount} SOL to ${to} from ${this.connectedWallet.publicKey}`);
      
      // Mock transaction signature
      return 'mock_transaction_signature_' + Date.now();
    } catch (error) {
      console.error('Error sending SOL:', error);
      throw error;
    }
  }

  /**
   * Send SPL token transaction
   */
  async sendToken(mint: string, to: string, amount: number): Promise<string | null> {
    if (!this.connectedWallet?.publicKey) {
      throw new Error('No wallet connected');
    }

    try {
      // This would require proper SPL token transaction building
      console.log(`Sending ${amount} ${mint} to ${to} from ${this.connectedWallet.publicKey}`);
      
      // Mock transaction signature
      return 'mock_token_tx_signature_' + Date.now();
    } catch (error) {
      console.error('Error sending token:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async getTokenPrice(symbol: string): Promise<number> {
    try {
      // Mock price data - would integrate with CoinGecko or other price APIs
      const prices: Record<string, number> = {
        'SOL': 65.50,
        'USDC': 1.00,
        'USDT': 1.00,
        'RAY': 1.80,
        'SRM': 0.25
      };
      return prices[symbol] || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getBatchTokenPrices(mints: string[]): Promise<Record<string, number>> {
    // Mock implementation - would batch fetch real prices
    const prices: Record<string, number> = {};
    mints.forEach(mint => {
      prices[mint] = Math.random() * 10; // Mock price
    });
    return prices;
  }

  private async getTokenInfo(mint: string): Promise<{ symbol: string; name: string } | null> {
    try {
      // Mock token info - would fetch from token registry
      const tokenRegistry: Record<string, { symbol: string; name: string }> = {
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin' },
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD' },
        '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', name: 'Raydium' }
      };
      return tokenRegistry[mint] || null;
    } catch (error) {
      return null;
    }
  }

  private async getNFTMetadata(mint: string): Promise<Partial<SolanaNFT> | null> {
    try {
      // Mock NFT metadata - would fetch from Metaplex or IPFS
      return {
        name: `NFT ${mint.substring(0, 8)}`,
        symbol: 'NFT',
        description: 'Sample NFT description',
        image: `https://via.placeholder.com/300?text=${mint.substring(0, 8)}`
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current connected wallet
   */
  getConnectedWallet(): SolanaWalletAdapter | null {
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
    publicKey?: string;
    endpoint: string;
  } {
    return {
      connected: this.isConnected(),
      wallet: this.connectedWallet?.name,
      publicKey: this.connectedWallet?.publicKey,
      endpoint: this.rpcEndpoint
    };
  }
}

// Create and export singleton instance with lazy initialization
let _solanaWalletServiceInstance: SolanaWalletService | null = null;

export const solanaWalletService = {
  get instance(): SolanaWalletService {
    if (!_solanaWalletServiceInstance) {
      _solanaWalletServiceInstance = new SolanaWalletService();
    }
    return _solanaWalletServiceInstance;
  },
  
  // Proxy all methods
  connectWallet: (walletName: string) => solanaWalletService.instance.connectWallet(walletName),
  disconnectWallet: () => solanaWalletService.instance.disconnectWallet(),
  getWalletBalances: (address: string) => solanaWalletService.instance.getWalletBalances(address)
};
export default solanaWalletService;