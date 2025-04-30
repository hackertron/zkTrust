import dynamic from 'next/dynamic';

// Import the ProofGenerator component with client-side rendering only
// This is necessary because the ZK Email SDK uses browser-specific APIs
const ProofGenerator = dynamic(
  () => import('@/components/ProofGenerator'),
  { ssr: false }
);

// Import the ReviewList component with client-side rendering
const ReviewList = dynamic(
  () => import('@/components/ReviewList'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            ZK Email Review Platform
          </h1>
          <div className="h-1 w-20 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Generate cryptographic proofs of purchase confirmations without revealing sensitive email content. 
            Our platform verifies that you received a genuine email from the business domain.
          </p>
        </header>
        
        <div className="card fadeIn mb-16">
          {/* ProofGenerator will be loaded client-side only */}
          <ProofGenerator />
        </div>
        
        <div className="card fadeIn">
          {/* ReviewList will be loaded client-side only */}
          <ReviewList />
        </div>
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 ZK Email Review Platform. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}