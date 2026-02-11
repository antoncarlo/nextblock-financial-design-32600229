import { motion } from "framer-motion";
import visionBg from "@/assets/vision-bg.jpg";

const VisionSection = () => (
  <section
    id="vision"
    className="relative py-32 md:py-44 overflow-hidden"
  >
    {/* Background */}
    <div className="absolute inset-0">
      <img src={visionBg} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-foreground/70" />
    </div>

    {/* Content */}
    <div className="relative z-10 container mx-auto px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="card-glass max-w-3xl mx-auto p-12 md:p-16"
      >
        <p className="section-label mb-4 text-primary-foreground/50">Our Vision</p>
        <h2 className="text-3xl md:text-5xl font-serif text-primary-foreground mb-8 leading-[1.15]">
          A world where every asset is accessible, transparent, and secure
        </h2>
        <p className="text-primary-foreground/70 leading-relaxed max-w-xl mx-auto">
          We envision a financial system where institutional-grade security is the 
          default, where real-world assets flow freely on-chain, and where compliance 
          enables innovation rather than constraining it.
        </p>
      </motion.div>
    </div>
  </section>
);

export default VisionSection;
