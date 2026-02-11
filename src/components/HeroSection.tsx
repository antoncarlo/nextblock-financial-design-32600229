import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <p className="section-label mb-6 text-primary-foreground/60">
            Institutional-Grade Digital Asset Protocol
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-normal leading-[1.1] mb-8 text-primary-foreground max-w-4xl mx-auto">
            The Future of
            <br />
            Institutional Finance
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-12 leading-relaxed font-sans">
            NextBlock bridges traditional financial infrastructure with
            next-generation blockchain technology, creating institutional-grade
            solutions for the modern economy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo("waitlist")}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-md text-base font-medium hover:bg-navy-hover transition-colors"
            >
              Request Early Access
            </button>
            <button
              onClick={() => scrollTo("protocol")}
              className="border border-primary-foreground/20 text-primary-foreground px-8 py-4 rounded-md text-base font-medium hover:bg-primary-foreground/10 transition-colors"
            >
              Explore Protocol
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
