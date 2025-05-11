'use client';

import { Web3Provider } from '@/context/Web3Context';

export default function BlockchainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      {children}
    </Web3Provider>
  );
}
