import { Routes, Route } from 'react-router-dom';
import { Providers } from '@/components/shared/Providers';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import VaultDiscoveryPage from '@/pages/VaultDiscovery';
import VaultDetailPage from '@/pages/VaultDetail';
import AdminPage from '@/pages/Admin';

function App() {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
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
