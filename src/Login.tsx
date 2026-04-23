import { useState } from 'react';
import { auth } from './firebase'; // Only importing auth now
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'; // Imported GoogleAuthProvider directly from Firebase
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e: any) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err: any) {
      setError("Invalid email or password");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider(); // Safely created right here
      await signInWithPopup(auth, provider);
      navigate('/home');
    } catch (err: any) {
      setError("Google sign-in failed");
    }
  };

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: 'white', padding: '20px' }}>
      
      {/* Cinematic Login Card */}
      <div style={{ width: '100%', maxWidth: '400px', background: '#0a0a0a', padding: '40px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ color: '#f59e0b', fontSize: '32px' }}>✦</span> NATYO
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px', marginTop: '10px' }}>Sign in to access the workspace</p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }} 
            onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
            onBlur={(e) => e.target.style.borderColor = '#333'}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }} 
            onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
            onBlur={(e) => e.target.style.borderColor = '#333'}
            required 
          />
          
          {error && <p style={{ color: '#ef4444', margin: '0', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
          
          <button type="submit" style={{ padding: '14px', background: '#f59e0b', color: '#050505', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', transition: 'transform 0.2s' }}>
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
          <span style={{ padding: '0 10px', color: '#71717a', fontSize: '13px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
        </div>

        {/* Google Login */}
        <button onClick={handleGoogleLogin} style={{ width: '100%', padding: '14px', background: '#111', color: '#f4f4f5', fontSize: '15px', fontWeight: 'bold', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f59e0b'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
          Continue with Google
        </button>
        
      </div>
    </div>
  );
}