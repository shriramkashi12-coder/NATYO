import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

// 🛑 MUST MATCH YOUR ADMIN EMAIL EXACTLY
const MASTER_EMAIL = "test@natyo.com";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  // Mobile UI States
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { if (user) setUserEmail(user.email); });
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isAdmin = userEmail === MASTER_EMAIL;
  const isActive = (path: string) => location.pathname === path ? '#f59e0b' : '#a1a1aa';

  return (
    <>
      <nav style={{ 
        background: scrolled || isMobile ? 'rgba(5, 5, 5, 0.98)' : 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)', 
        padding: isMobile ? '15px 5%' : '20px 5%', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, 
        transition: 'background 0.3s ease', borderBottom: isMobile ? '1px solid #222' : 'none'
      }}>
        
        {/* Brand */}
        <h1 onClick={() => navigate('/home')} style={{ margin: 0, fontSize: isMobile ? '20px' : '24px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#f59e0b' }}>✦</span> NATYO
        </h1>
        
        {/* Navigation - Desktop (Hidden on Mobile) */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '30px', fontWeight: '500', fontSize: '14px' }}>
            <span onClick={() => navigate('/home')} style={{ cursor: 'pointer', color: isActive('/home') }}>Home</span>
            <span onClick={() => navigate('/browse')} style={{ cursor: 'pointer', color: isActive('/browse') }}>Browse</span>
            <span onClick={() => navigate('/library')} style={{ cursor: 'pointer', color: isActive('/library') }}>My Library</span>
            {isAdmin && <span onClick={() => navigate('/admin')} style={{ cursor: 'pointer', color: isActive('/admin') }}>Admin</span>}
          </div>
        )}

        {/* Right Side Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {!isMobile ? (
            <>
              <button onClick={() => { signOut(auth); navigate('/'); }} style={{ background: 'transparent', color: '#71717a', border: '1px solid #333', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>
                Sign Out
              </button>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050505', fontWeight: 'bold', fontSize: '12px' }}>
                {userEmail ? userEmail[0].toUpperCase() : 'U'}
              </div>
            </>
          ) : (
            // Mobile Hamburger Icon
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'transparent', color: '#f59e0b', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Dropdown Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: '56px', left: 0, right: 0, background: '#0a0a0a', borderBottom: '1px solid #222', zIndex: 999,
          display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          <span onClick={() => { navigate('/home'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer', color: isActive('/home'), fontSize: '18px', fontWeight: 'bold' }}>Home</span>
          <span onClick={() => { navigate('/browse'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer', color: isActive('/browse'), fontSize: '18px', fontWeight: 'bold' }}>Browse</span>
          <span onClick={() => { navigate('/library'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer', color: isActive('/library'), fontSize: '18px', fontWeight: 'bold' }}>My Library</span>
          
          {isAdmin && <span onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer', color: isActive('/admin'), fontSize: '18px', fontWeight: 'bold' }}>Command Center</span>}
          
          <div style={{ height: '1px', background: '#222', margin: '5px 0' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f4f4f5', fontWeight: 'bold', fontSize: '14px' }}>
                {userEmail ? userEmail[0].toUpperCase() : 'U'}
              </div>
              <span style={{ color: '#a1a1aa', fontSize: '14px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</span>
            </div>
            <button onClick={() => { signOut(auth); navigate('/'); setMobileMenuOpen(false); }} style={{ background: '#111', color: '#ef4444', border: '1px solid #333', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}