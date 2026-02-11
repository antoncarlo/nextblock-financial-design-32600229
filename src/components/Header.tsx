import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = ["Protocol", "Features", "About", "Vision", "Waitlist"];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <AnimatePresence>
          {!scrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="logo-text text-foreground text-lg"
            >
              NEXTBLOCK
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav Pill - Desktop */}
        <nav className="nav-pill hidden md:flex items-center gap-1 px-2 py-1.5 mx-auto">
          {scrolled && (
            <span className="logo-text text-foreground text-sm px-3">NB</span>
          )}
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => scrollTo(item)}
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground rounded-full transition-colors hover:bg-foreground/5"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span className={`block w-5 h-0.5 bg-foreground transition-transform ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-transform ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        {/* CTA */}
        <button
          onClick={() => scrollTo("waitlist")}
          className="hidden md:block bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:bg-navy-hover transition-colors"
        >
          Join Waitlist
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden nav-pill mx-4 mt-2 p-4 flex flex-col gap-2"
          >
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item)}
                className="px-4 py-3 text-sm font-medium text-foreground/70 hover:text-foreground rounded-lg transition-colors hover:bg-foreground/5 text-left"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => scrollTo("waitlist")}
              className="bg-primary text-primary-foreground px-5 py-3 rounded-md text-sm font-medium mt-2"
            >
              Join Waitlist
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
