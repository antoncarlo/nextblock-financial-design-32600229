import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { WalletButton } from './WalletButton';
import { WalletRoleIndicator } from './WalletRoleIndicator';
import { useAdminAddress } from '@/hooks/useAdminAddress';
import logoBlack from '@/assets/logo-black.svg';

export function Header() {
  const { address, isConnected } = useAccount();
  const adminAddress = useAdminAddress();
  const location = useLocation();
  const isAdmin =
    isConnected &&
    address?.toLowerCase() === adminAddress.toLowerCase();

  const linkClass = (path: string) => {
    const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    return `rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-black/8 font-semibold' : 'hover:bg-black/5'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(250, 250, 248, 0.85)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1400px' }}>
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoBlack} alt="NextBlock logo" className="h-8" />
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <div className="nav-pill flex items-center gap-1 px-1 py-1">
              <Link
                to="/"
                className={linkClass('/')}
                style={{ color: 'var(--text-body)' }}
              >
                Vaults
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={linkClass('/admin')}
                  style={{ color: 'var(--text-body)' }}
                >
                  Admin
                </Link>
              )}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <WalletRoleIndicator />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
