'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { WalletButton } from './WalletButton';
import { WalletRoleIndicator } from './WalletRoleIndicator';
import { useAdminAddress } from '@/hooks/useAdminAddress';

export function Header() {
  const { address, isConnected } = useAccount();
  const adminAddress = useAdminAddress();
  const isAdmin =
    isConnected &&
    address?.toLowerCase() === adminAddress.toLowerCase();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(250, 250, 248, 0.85)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1400px' }}>
        {/* Logo + nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--accent-navy)' }}>
              <span className="text-sm font-bold text-white">NB</span>
            </div>
            <span className="logo-text text-lg" style={{ color: 'var(--text-heading)' }}>
              NextBlock
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <div className="nav-pill flex items-center gap-1 px-1 py-1">
              <Link
                href="/"
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/5"
                style={{ color: 'var(--text-body)' }}
              >
                Vaults
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-black/5"
                  style={{ color: 'var(--text-body)' }}
                >
                  Admin
                </Link>
              )}
            </div>
          </nav>
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          <WalletRoleIndicator />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
