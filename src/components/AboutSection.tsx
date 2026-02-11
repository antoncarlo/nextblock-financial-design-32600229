import { motion } from "framer-motion";

const stats = [
  { value: "$2.4B", label: "Assets Under Advisory" },
  { value: "47", label: "Institutional Partners" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "<2s", label: "Transaction Finality" },
];

const AboutSection = () => (
  <section id="about" className="py-24 md:py-32">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        {/* Left - Editorial Text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label mb-4">About NextBlock</p>
          <h2 className="text-3xl md:text-5xl font-serif mb-8 leading-[1.15]">
            Redefining trust in the digital economy
          </h2>
          <p className="text-body-color leading-relaxed mb-6">
            NextBlock was founded by a team of veterans from Goldman Sachs, 
            JPMorgan, and leading blockchain protocols. Our mission is to build 
            the financial infrastructure that institutions need to participate 
            confidently in the digital asset ecosystem.
          </p>
          <p className="text-body-color leading-relaxed">
            We combine decades of traditional finance expertise with cutting-edge 
            cryptographic research to deliver solutions that meet the highest 
            standards of security, compliance, and performance.
          </p>
        </motion.div>

        {/* Right - Stats Grid */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-2 gap-6"
        >
          {stats.map((stat, i) => (
            <div key={i} className="card-institutional p-8 text-center">
              <div className="stat-number text-3xl md:text-4xl mb-2">{stat.value}</div>
              <p className="section-label text-xs">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  </section>
);

export default AboutSection;
