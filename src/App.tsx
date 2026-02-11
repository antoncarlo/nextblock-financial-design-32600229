import { Routes, Route } from 'react-router-dom';
import { Providers } from '@/components/shared/Providers';
import { Header } from '@/components/shared/Header';
import VaultDiscoveryPage from '@/pages/VaultDiscovery';
import VaultDetailPage from '@/pages/VaultDetail';
import AdminPage from '@/pages/Admin';

function App() {
  return (
    <Providers>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<VaultDiscoveryPage />} />
          <Route path="/vault/:address" element={<VaultDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </Providers>
  );
}

export default App;
