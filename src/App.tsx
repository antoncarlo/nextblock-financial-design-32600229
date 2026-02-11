import { Routes, Route } from 'react-router-dom';
import { Providers } from '@/components/shared/Providers';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { FlowchartLines } from '@/components/decorations/FlowchartLines';
import { DecorativeGrid } from '@/components/decorations/DecorativeGrid';
import { FloatingParallax } from '@/components/decorations/FloatingParallax';
import VaultDiscoveryPage from '@/pages/VaultDiscovery';
import VaultDetailPage from '@/pages/VaultDetail';
import AdminPage from '@/pages/Admin';

function App() {
  return (
    <Providers>
      <div className="relative flex min-h-screen flex-col">
        <DecorativeGrid />
        <FlowchartLines />
        <FloatingParallax />
        <Header />
        <main className="relative z-10 flex-1">
          <Routes>
            <Route path="/" element={<VaultDiscoveryPage />} />
            <Route path="/vault/:address" element={<VaultDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Providers>
  );
}

export default App;
