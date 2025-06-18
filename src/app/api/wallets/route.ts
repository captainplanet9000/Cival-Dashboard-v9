import { NextRequest, NextResponse } from 'next/server';
import { backendApi } from '@/lib/api/backend-client';

// Mock wallet data for fallback
const mockWallets = [
  {
    id: 'eth-wallet-1',
    name: 'Main Ethereum Wallet',
    address: '0x742E...7B3A',
    chain: 'ethereum',
    balance: {
      native: 2.456,
      usd_value: 6240.30,
      tokens: [
        { symbol: 'ETH', balance: 2.456, usd_value: 6240.30 },
        { symbol: 'USDC', balance: 1500.00, usd_value: 1500.00 },
        { symbol: 'WBTC', balance: 0.1, usd_value: 4325.00 }
      ]
    },
    status: 'connected',
    last_activity: new Date().toISOString()
  },
  {
    id: 'sol-wallet-1',
    name: 'Main Solana Wallet',
    address: 'DXo8...N9mK',
    chain: 'solana',
    balance: {
      native: 125.8,
      usd_value: 3022.44,
      tokens: [
        { symbol: 'SOL', balance: 125.8, usd_value: 3022.44 },
        { symbol: 'USDC', balance: 800.00, usd_value: 800.00 },
        { symbol: 'RAY', balance: 45.2, usd_value: 126.56 }
      ]
    },
    status: 'connected',
    last_activity: new Date().toISOString()
  },
  {
    id: 'sui-wallet-1',
    name: 'Main Sui Wallet',
    address: '0x3f4...8c2d',
    chain: 'sui',
    balance: {
      native: 1200.5,
      usd_value: 2401.00,
      tokens: [
        { symbol: 'SUI', balance: 1200.5, usd_value: 2401.00 },
        { symbol: 'USDC', balance: 500.00, usd_value: 500.00 }
      ]
    },
    status: 'connected',
    last_activity: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('id');
    const chain = searchParams.get('chain');

    // Try to get real wallet data from backend first
    try {
      const walletsResponse = await backendApi.getWallets();
      if (walletsResponse.data && Array.isArray(walletsResponse.data)) {
        let wallets = walletsResponse.data;

        // Filter by chain if specified
        if (chain) {
          wallets = wallets.filter((w: any) => w.chain === chain);
        }

        // Get specific wallet if ID provided
        if (walletId) {
          const wallet = wallets.find((w: any) => w.id === walletId);
          if (!wallet) {
            return NextResponse.json(
              { success: false, error: 'Wallet not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            data: wallet,
            source: 'backend',
            timestamp: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          success: true,
          data: wallets,
          total: wallets.length,
          source: 'backend',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn('Backend wallets unavailable, using mock data:', error);
    }

    // Fallback to mock data
    let wallets = mockWallets;

    // Filter by chain if specified
    if (chain) {
      wallets = mockWallets.filter(w => w.chain === chain);
    }

    // Get specific wallet if ID provided
    if (walletId) {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) {
        return NextResponse.json(
          { success: false, error: 'Wallet not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: wallet,
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: wallets,
      total: wallets.length,
      source: 'fallback',
      total_value: wallets.reduce((sum, w) => sum + w.balance.usd_value, 0),
      supported_chains: ['ethereum', 'solana', 'sui', 'sonic'],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Wallets API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch wallet data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...walletData } = body;

    if (action === 'create') {
      // Try to create wallet via backend
      try {
        const createResponse = await backendApi.createWallet(walletData);
        if (createResponse.data) {
          return NextResponse.json({
            success: true,
            data: createResponse.data,
            message: 'Wallet created successfully',
            source: 'backend',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Backend wallet creation failed, using mock:', error);
      }

      // Fallback: create mock wallet
      const newWallet = {
        id: `${walletData.chain}-wallet-${Date.now()}`,
        name: walletData.name || `${walletData.chain} Wallet`,
        address: 'mock-address-' + Math.random().toString(36).substr(2, 8),
        chain: walletData.chain,
        balance: {
          native: 0,
          usd_value: 0,
          tokens: []
        },
        status: 'created',
        last_activity: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: newWallet,
        message: 'Wallet created successfully (mock)',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });

    } else if (action === 'transfer') {
      // Try to transfer funds via backend
      try {
        const transferResponse = await backendApi.transferFunds(walletData);
        if (transferResponse.data) {
          return NextResponse.json({
            success: true,
            data: transferResponse.data,
            message: 'Transfer completed successfully',
            source: 'backend',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn('Backend transfer failed, using mock:', error);
      }

      // Fallback: mock transfer
      return NextResponse.json({
        success: true,
        data: {
          transaction_id: 'mock-tx-' + Math.random().toString(36).substr(2, 16),
          from: walletData.from,
          to: walletData.to,
          amount: walletData.amount,
          token: walletData.token,
          status: 'pending',
          estimated_confirmation: '30 seconds'
        },
        message: 'Transfer initiated successfully (mock)',
        source: 'fallback',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Wallet operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process wallet operation',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}