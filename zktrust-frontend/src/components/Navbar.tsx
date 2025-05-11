'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scrolling for navbar background change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine active route
  const isHomePage = pathname === '/';
  const isBlockchainPage = pathname === '/blockchain';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
              <span className="text-white font-bold">ZK</span>
            </div>
            <span className={`font-bold text-lg ${isScrolled ? 'text-gray-900' : 'text-gray-800'}`}>
              ZKTrust
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            <Link 
              href="/"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isHomePage 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Standard 
            </Link>
            <Link 
              href="/blockchain"
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                isBlockchainPage 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Base Blockchain
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full">New</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
