import { formatUSDC, getSharePriceNumber } from '@/lib/formatting';

interface YieldTickerProps {
  totalAssets: bigint;
  totalSupply: bigint;
}

export function YieldTicker({ totalAssets, totalSupply }: YieldTickerProps) {
  const sharePrice = getSharePriceNumber(totalAssets, totalSupply);
  const pnlPct = ((sharePrice - 1.0) * 100);
  const isPositive = pnlPct >= 0;

  return (
    <div className="card-institutional p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">NAV per Share</p>
          <p className="stat-number mt-1 text-3xl">${sharePrice.toFixed(4)}</p>
        </div>
        <div className="text-right">
          <p className="section-label">P&L</p>
          <p
            className="font-mono-num mt-1 text-xl font-semibold"
            style={{ color: isPositive ? '#059669' : '#DC2626' }}
          >
            {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="section-label">Total Value Locked</span>
        <span className="stat-number text-base">{formatUSDC(totalAssets)}</span>
      </div>
    </div>
  );
}
