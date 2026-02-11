import { motion } from "framer-motion";
import veniceImg from "@/assets/venice-illustration.jpg";
import shipsImg from "@/assets/ships-illustration.jpg";

const cards = [
  {
    image: veniceImg,
    label: "Origins",
    title: "The Venetian Model",
    text: "Like the Venetian banking houses that pioneered modern finance, NextBlock creates trusted infrastructure for a new era of digital commerce and asset management.",
  },
  {
    image: shipsImg,
    label: "Connectivity",
    title: "Global Trade Routes",
    text: "Our cross-chain bridges connect disparate networks just as merchant fleets once connected civilizations — enabling seamless flow of value across the digital economy.",
  },
];

const ProtocolSection = () => (
  <section id="protocol" className="py-24 md:py-32 bg-secondary-section">
    <div className="container mx-auto px-6">
      <p className="section-label mb-4">Protocol Stack</p>
      <h2 className="text-3xl md:text-5xl font-serif mb-16 max-w-xl">
        Inspired by centuries of financial innovation
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="card-institutional overflow-hidden group"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-8">
              <span className="section-label text-xs">{card.label}</span>
              <h3 className="text-2xl font-serif mt-2 mb-4">{card.title}</h3>
              <p className="text-body-color text-sm leading-relaxed">{card.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProtocolSection;
