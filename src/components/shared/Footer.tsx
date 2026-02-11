import footerFrieze from '@/assets/footer-frieze.png';

export function Footer() {
  return (
    <footer style={{ background: '#FFFFFF' }}>
      <div className="w-full overflow-hidden">
        <img
          src={footerFrieze}
          alt="Decorative maritime frieze"
          className="w-full object-cover"
          style={{ maxHeight: '200px' }}
        />
      </div>
      <div
        className="mx-auto px-4 py-8 sm:px-6 lg:px-8"
        style={{ maxWidth: '1400px' }}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} NextBlock. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Testnet demo — not financial advice
          </p>
        </div>
      </div>
    </footer>
  );
}
