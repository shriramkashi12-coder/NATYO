import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!state?.title || !state?.price) return navigate('/home');
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserEmail(user?.email || null));
    return () => unsubscribe();
  }, [state, navigate]);

  const handleSimulatePayment = async () => {
    if (!userEmail) return alert("Must be logged in");
    setProcessing(true);
    
    // Simulate a 1.5 second loading spinner for the bank gateway
    setTimeout(async () => {
      try {
        // Write the digital receipt to Firebase
        await setDoc(doc(db, "purchases", `${userEmail}_${state.title}`), {
          userEmail: userEmail,
          title: state.title,
          pricePaid: state.price,
          purchasedAt: serverTimestamp()
        });
        
        // Kick them back to the Show page to see their unlocked videos!
        navigate('/show', { state: { title: state.title }, replace: true });
      } catch (error) { console.error(error); setProcessing(false); }
    }, 1500);
  };

  if (!state) return null;

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', paddingTop: '100px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '450px', background: '#0a0a0a', padding: '40px', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
        
        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', textAlign: 'center' }}>Secure Checkout</h2>
        <p style={{ margin: '0 0 30px 0', color: '#a1a1aa', textAlign: 'center' }}>You are purchasing a lifetime license.</p>

        <div style={{ background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#a1a1aa' }}>Collection:</span>
            <span style={{ fontWeight: 'bold' }}>{state.title}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '10px', marginTop: '10px' }}>
            <span style={{ color: '#f4f4f5', fontSize: '18px' }}>Total Due:</span>
            <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 'bold' }}>₹{state.price}</span>
          </div>
        </div>

        <button 
          onClick={handleSimulatePayment} 
          disabled={processing}
          style={{ width: '100%', padding: '16px', background: processing ? '#333' : '#f59e0b', color: processing ? '#a1a1aa' : '#050505', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: processing ? 'wait' : 'pointer' }}
        >
          {processing ? 'Processing Secure Payment...' : `Simulate Payment (₹${state.price})`}
        </button>
        
        <p style={{ textAlign: 'center', color: '#71717a', fontSize: '12px', marginTop: '20px' }}>
          🔒 Encrypted using DummyData™ SSL
        </p>
      </div>
    </div>
  );
}