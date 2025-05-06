'use client';

import { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';

const WalletConnect = () => {
  const { account, chainId, active, error, connect, disconnect, switchToBaseSepolia } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Base Sepolia Chain ID
  const BASE_SEPOLIA_CHAIN_ID = 84532;
  
  // Format address for display
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Handle connect button click
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle network switch button click
  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    try {
      await switchToBaseSepolia();
    } catch (err) {
      console.error('Failed to switch network:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Wallet Connection</h2>
      
      {error && (
        <div className="p-2 mb-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error.message}
        </div>
      )}
      
      {!active ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="btn btn-primary w-full"
        >
          {isConnecting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </div>
          ) : (
            "Connect Wallet"
          )}
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Account:</span>
            <span className="font-mono text-sm">{account ? shortenAddress(account) : 'Not connected'}</span>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Network:</span>
            <span className={`text-sm ${chainId === BASE_SEPOLIA_CHAIN_ID ? 'text-green-600' : 'text-red-600'}`}>
              {chainId === BASE_SEPOLIA_CHAIN_ID ? 'Base Sepolia' : 'Wrong Network'}
            </span>
          </div>
          
          {chainId !== BASE_SEPOLIA_CHAIN_ID && (
            <button
              onClick={handleSwitchNetwork}
              disabled={isSwitching}
              className="btn bg-yellow-500 text-white hover:bg-yellow-600 w-full mb-3"
            >
              {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
            </button>
          )}
          
          <button
            onClick={disconnect}
            className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 w-full"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
