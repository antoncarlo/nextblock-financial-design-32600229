import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Layers, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Institutional Custody",
    summary: "Military-grade security with multi-party computation and threshold signatures.",
    detail: "Our custody infrastructure employs MPC technology with geographically distributed key shards, hardware security modules (HSMs), and real-time threat monitoring. Fully insured and audited by leading security firms.",
  },
  {
    icon: Layers,
    title: "Protocol Architecture",
    summary: "Modular layer-2 infrastructure built for regulatory compliance and performance.",
    detail: "NextBlock's protocol stack features a custom ZK-rollup with finality under 2 seconds, native compliance modules for KYC/AML, and interoperability bridges supporting 12+ blockchains.",
  },
  {
    icon: BarChart3,
    title: "Asset Management",
    summary: "Tokenization and portfolio management for real-world and digital assets.",
    detail: "Our asset management suite enables institutions to tokenize traditional instruments, manage diversified crypto portfolios, and access yield strategies — all from a single dashboard with comprehensive reporting.",
  },
];

const FeaturesSection = () => {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <p className="section-label mb-4">Core Capabilities</p>
        <h2 className="text-3xl md:text-5xl font-serif mb-16 max-w-xl">
          Built for the demands of institutional finance
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const isActive = active === i;
            return (
              <div
                key={i}
                className="card-institutional p-8 cursor-pointer"
                onClick={() => setActive(isActive ? null : i)}
              >
                <f.icon className="w-8 h-8 text-primary mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-serif mb-3">{f.title}</h3>
                <p className="text-body-color text-sm leading-relaxed mb-4">{f.summary}</p>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-body-color text-sm leading-relaxed pt-4 border-t border-foreground/5">
                        {f.detail}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="text-primary text-xs font-medium mt-4 inline-block">
                  {isActive ? "Show less" : "Learn more →"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
