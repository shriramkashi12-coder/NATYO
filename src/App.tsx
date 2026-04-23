import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Home from './Home';
import Browse from './Browse';
import Player from './Player';
import Admin from './Admin';
import Navbar from './Navbar';
import Show from './Show';
import Checkout from './Checkout';
import Library from './Library';

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Entry Point */}
        <Route path="/" element={<Login />} />
        
        {/* Core Navigation with Navbar */}
        <Route path="/home" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/browse" element={<MainLayout><Browse /></MainLayout>} />
        <Route path="/library" element={<MainLayout><Library /></MainLayout>} />
        
        {/* Storefront & Checkout */}
        <Route path="/show" element={<MainLayout><Show /></MainLayout>} />
        <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
        
        {/* Command Center */}
        <Route path="/admin" element={<MainLayout><Admin /></MainLayout>} />
        
        {/* Full-Screen Player (No Navbar) */}
        <Route path="/player" element={<Player />} />
      </Routes>
    </Router>
  );
}