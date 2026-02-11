import { useState } from "react";
import { motion } from "framer-motion";

const WaitlistSection = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="waitlist" className="py-24 md:py-32 bg-secondary-section">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="section-label mb-4">Early Access</p>
          <h2 className="text-3xl md:text-5xl font-serif mb-6">
            Join the Waitlist
          </h2>
          <p className="text-body-color leading-relaxed">
            Be among the first institutions to access NextBlock's protocol. 
            Early partners receive priority onboarding and dedicated support.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-institutional p-12 text-center"
          >
            <h3 className="text-2xl font-serif mb-3">Thank you</h3>
            <p className="text-body-color">
              We've received your application. Our team will be in touch shortly.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="card-institutional p-8 md:p-12 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="section-label text-xs block mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-md bg-background border border-foreground/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="section-label text-xs block mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-md bg-background border border-foreground/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="john@institution.com"
                />
              </div>
            </div>
            <div>
              <label className="section-label text-xs block mb-2">Organization Type</label>
              <select className="w-full px-4 py-3 rounded-md bg-background border border-foreground/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
                <option>Asset Manager</option>
                <option>Bank / Financial Institution</option>
                <option>Family Office</option>
                <option>Hedge Fund</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="section-label text-xs block mb-2">Message (Optional)</label>
              <textarea
                rows={4}
                className="w-full px-4 py-3 rounded-md bg-background border border-foreground/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                placeholder="Tell us about your use case..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-4 rounded-md text-sm font-medium hover:bg-navy-hover transition-colors"
            >
              Submit Application
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default WaitlistSection;
