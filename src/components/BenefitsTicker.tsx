const badges = [
  "Ethereum L2", "ZK-Rollups", "MPC Custody", "Institutional DeFi",
  "Smart Contracts", "Cross-Chain", "Regulatory Compliant", "ISO 27001",
  "SOC 2 Type II", "Multi-Sig", "Tokenization", "Real-World Assets",
];

const BenefitsTicker = () => (
  <section className="py-6 bg-secondary-section border-y border-foreground/5 overflow-hidden">
    <div className="flex animate-ticker whitespace-nowrap">
      {[...badges, ...badges].map((badge, i) => (
        <span key={i} className="badge-institutional mx-3 flex-shrink-0">
          {badge}
        </span>
      ))}
    </div>
  </section>
);

export default BenefitsTicker;
