const Footer = () => (
  <footer className="bg-footer py-16 md:py-24">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        {/* Brand */}
        <div className="md:col-span-2">
          <span className="logo-text text-primary-foreground text-lg block mb-4">NEXTBLOCK</span>
          <p className="text-primary-foreground/50 text-sm leading-relaxed max-w-sm">
            Institutional-grade digital asset infrastructure, built for the
            demands of modern finance.
          </p>
        </div>

        {/* Links */}
        <div>
          <p className="section-label text-xs text-primary-foreground/30 mb-4">Protocol</p>
          <ul className="space-y-3">
            {["Documentation", "Security", "Governance", "Roadmap"].map((l) => (
              <li key={l}>
                <a href="#" className="text-primary-foreground/50 hover:text-primary-foreground text-sm transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="section-label text-xs text-primary-foreground/30 mb-4">Company</p>
          <ul className="space-y-3">
            {["About", "Careers", "Press", "Contact"].map((l) => (
              <li key={l}>
                <a href="#" className="text-primary-foreground/50 hover:text-primary-foreground text-sm transition-colors">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-primary-foreground/30 text-xs">
          © 2026 NextBlock. All rights reserved.
        </p>
        <div className="flex gap-6">
          {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
            <a key={l} href="#" className="text-primary-foreground/30 hover:text-primary-foreground/50 text-xs transition-colors">
              {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
