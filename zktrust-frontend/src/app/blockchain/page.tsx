import dynamic from 'next/dynamic';

// Import components with client-side rendering only
const BlockchainProofGenerator = dynamic(
  () => import('@/components/BlockchainProofGenerator'),
  { ssr: false }
);

// Import the ReviewList component with client-side rendering
const ReviewList = dynamic(
  () => import('@/components/ReviewList'),
  { ssr: false }
);

export default function BlockchainPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            ZKTrust on Base
          </h1>
          <h2 className="text-xl font-medium text-blue-600 mb-4">
            Zero-Knowledge Verified Reviews on the Base Blockchain
          </h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the next generation of our review platform with full blockchain integration.
            Verify purchases and submit reviews directly on the Base blockchain for maximum
            transparency and trust.
          </p>
        </header>
        
        <div className="card fadeIn mb-16">
          {/* BlockchainProofGenerator will be loaded client-side only */}
          <BlockchainProofGenerator />
        </div>
        
        <div className="card fadeIn">
          {/* ReviewList will be loaded client-side only */}
          <ReviewList />
        </div>
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 ZKTrust. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
