'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, type Signer } from 'ethers';

// Contract ABIs
import ReviewStorageABI from '../abi/ReviewStorage.json';
import ReviewRegistryABI from '../abi/ReviewRegistry.json';

// Import constants from central configuration
import { BASE_SEPOLIA_CHAIN_ID, CONTRACT_ADDRESSES } from '@/config/constants';

// Web3 context interface
interface Web3ContextInterface {
  account: string | null;
  chainId: number | null;
  active: boolean;
  error: Error | null;
  provider: BrowserProvider | null;
  contracts: {
    reviewStorage: Contract | null;
    reviewRegistry: Contract | null;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToBaseSepolia: () => Promise<void>;
}

// Create context
const Web3Context = createContext<Web3ContextInterface>({
  account: null,
  chainId: null,
  active: false,
  error: null,
  provider: null,
  contracts: {
    reviewStorage: null,
    reviewRegistry: null,
  },
  connect: async () => { },
  disconnect: () => { },
  switchToBaseSepolia: async () => { },
});

// Hook for using the Web3 context
export const useWeb3 = () => useContext(Web3Context);

// Provider component
interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [active, setActive] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const [contracts, setContracts] = useState<{
    reviewStorage: Contract | null;
    reviewRegistry: Contract | null;
  }>({
    reviewStorage: null,
    reviewRegistry: null,
  });

  // Initialize contracts
  const initializeContracts = async (provider: BrowserProvider) => {
    const signer = await provider.getSigner();
    const reviewStorage = new Contract(
      CONTRACT_ADDRESSES.reviewStorage,
      ReviewStorageABI.abi,
      signer
    );
    const reviewRegistry = new Contract(
      CONTRACT_ADDRESSES.reviewRegistry,
      ReviewRegistryABI.abi,
      signer
    );

    setContracts({
      reviewStorage,
      reviewRegistry,
    });
  };

  // Connect wallet
  const connect = async () => {
    try {
      setError(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this application');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);

      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(chainId, 16));

      // Create provider
      const provider = new BrowserProvider(window.ethereum);
      setProvider(provider);

      // Initialize contracts
      await initializeContracts(provider);

      setActive(true);
    } catch (error) {
      console.error('Connection error:', error);
      setError(error as Error);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setChainId(null);
    setActive(false);
    setProvider(null);
    setContracts({
      reviewStorage: null,
      reviewRegistry: null,
    });
  };

  // Switch to Base Sepolia network
  const switchToBaseSepolia = async () => {
    if (!window.ethereum) return;

    try {
      // Try to switch to Base Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: 'Base Sepolia Testnet',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Base Sepolia network:', addError);
          throw addError;
        }
      } else {
        console.error('Error switching to Base Sepolia network:', switchError);
        throw switchError;
      }
    }
  };

  // Set up event listeners
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnect();
        }
      };

      const handleChainChanged = (chainId: string) => {
        setChainId(parseInt(chainId, 16));
        // Reload provider and contracts on chain change
        if (provider && window.ethereum) {
          const newProvider = new BrowserProvider(window.ethereum);
          setProvider(newProvider);
          initializeContracts(newProvider);
        }
      };

      const handleDisconnect = () => {
        disconnect();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [provider]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        active,
        error,
        provider,
        contracts,
        connect,
        disconnect,
        switchToBaseSepolia,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export default Web3Context;
