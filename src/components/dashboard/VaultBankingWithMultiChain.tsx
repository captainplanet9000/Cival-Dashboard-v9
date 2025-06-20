"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Home, Link } from 'lucide-react';

// Import existing components
import VaultBankingDashboard from '@/components/vault/VaultBankingDashboard';
import ComprehensiveWalletDashboard from '@/components/wallet/ComprehensiveWalletDashboard';

export default function VaultBankingWithMultiChain() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Vault Banking & Multi-Chain Wallets</h2>
      </div>
      
      <Tabs defaultValue="vault-banking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vault-banking" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Vault Banking
          </TabsTrigger>
          <TabsTrigger value="multi-chain" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Multi-Chain Wallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vault-banking" className="mt-6">
          <VaultBankingDashboard />
        </TabsContent>

        <TabsContent value="multi-chain" className="mt-6">
          <ComprehensiveWalletDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}