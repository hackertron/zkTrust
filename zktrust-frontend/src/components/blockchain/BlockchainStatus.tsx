'use client';

import { useWeb3 } from '@/context/Web3Context';

const BlockchainStatus = () => {
  const { active, account, chainId, connect, disconnect, switchToBaseSepolia } = useWeb3();
  
  // Base Sepolia Chain ID
  const BASE_SEPOLIA_CHAIN_ID = 84532;
  
  // Format address for display
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      {active ? (
        <>
          {chainId !== BASE_SEPOLIA_CHAIN_ID && (
            <button 
              onClick={switchToBaseSepolia}
              className="px-3 py-1 text-xs rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
            >
              Switch Network
            </button>
          )}
          
          <div className={`text-sm px-3 py-1 rounded-full ${chainId === BASE_SEPOLIA_CHAIN_ID ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {chainId === BASE_SEPOLIA_CHAIN_ID ? 'Base Sepolia' : 'Wrong Network'}
          </div>
          
          <div className="text-xs md:text-sm font-mono bg-gray-100 px-3 py-1 rounded-full">
            {account ? shortenAddress(account) : 'Not connected'}
          </div>
          
          <button 
            onClick={disconnect}
            className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button 
          onClick={connect}
          className="px-3 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default BlockchainStatus;
