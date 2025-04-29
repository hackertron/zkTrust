import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZK Email Review Platform',
  description: 'A decentralized review platform using ZK Email for verification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}