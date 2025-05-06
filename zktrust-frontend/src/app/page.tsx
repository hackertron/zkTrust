import dynamic from 'next/dynamic';
import Link from 'next/link';

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
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-2">
            ZKTrust
          </h1>
          <h2 className="text-xl font-medium text-blue-600 mb-4">
            A Zero-Knowledge Verified Review Platform
          </h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Trust reimagined through cryptography. Our platform uses zero-knowledge proofs to verify genuine purchases 
            without exposing sensitive data. Experience absolute authenticity where every review is cryptographically 
            guaranteed - the future of trusted commerce is here.
          </p>
          
          {/* New Base Blockchain Banner */}
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg mx-auto max-w-2xl">
            <h3 className="text-xl font-bold mb-2">✨ New: ZKTrust on Base Blockchain!</h3>
            <p className="mb-4">Experience our next-generation platform with full blockchain integration.</p>
            <Link href="/blockchain" className="inline-block px-6 py-3 bg-white text-blue-600 rounded-md font-semibold hover:bg-blue-50 transition-colors shadow-md">
              Try ZKTrust on Base →
            </Link>
          </div>
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
          <p>© 2025 ZKTrust. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}