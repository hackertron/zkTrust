import type { Metadata } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';

// Import the Navbar component with client-side rendering
const Navbar = dynamic(
  () => import('@/components/Navbar'),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'ZKTrust - Zero-Knowledge Verified Reviews',
  description: 'A decentralized review platform using ZK Email proofs for verification on Base blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}