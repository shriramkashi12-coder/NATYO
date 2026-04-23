import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MASTER_EMAIL = "test@natyo.com";

export default function Show() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  
  // NEW: Better loading and error states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!state?.title) {
      navigate('/home');
      return;
    }

    const loadData = async (email: string | null) => {
      try {
        const q = query(collection(db, "videos"), where("title", "==", state.title.trim()));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setErrorMsg("No videos found for this title.");
          setLoading(false);
          return;
        }

        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // CRASH-PROOF SORTING: Safely checks for timestamps
        docs.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeA - timeB;
        });
        
        setPlaylist(docs);

        if (email) {
          const purchaseRef = doc(db, "purchases", `${email}_${state.title}`);
          const purchaseSnap = await getDoc(purchaseRef);
          setHasPurchased(purchaseSnap.exists() || email === MASTER_EMAIL);
        }
        setLoading(false);
      } catch (error: any) { 
        console.error(error); 
        setErrorMsg("Error loading collection.");
        setLoading(false); 
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || null);
      loadData(user?.email || null);
    });

    return () => unsubscribe();
  }, [state, navigate]);

  // VISUAL DEBUGGER: Will show text instead of a blank screen
  if (loading) return <div style={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '20px' }}>Loading Collection...</div>;
  if (errorMsg) return <div style={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '20px' }}>{errorMsg}</div>;
  if (playlist.length === 0) return null;

  const primaryVideo = playlist[0]; 
  const coverBg = primaryVideo.coverUrl || `https://image.mux.com/${primaryVideo.playbackId}/thumbnail.png?time=10`;
  const price = primaryVideo.price || 0;
  const isUnlocked = hasPurchased || price === 0;

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ position: 'relative', width: '100%', height: '50vh', backgroundImage: `url('${coverBg}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', background: 'linear-gradient(to bottom, rgba(5,5,5,0.2) 0%, #050505 100%)' }} />
      </div>

      <div style={{ maxWidth: '1200px', margin: '-100px auto 0', position: 'relative', zIndex: 10, padding: '0 5%', display: 'flex', flexWrap: 'wrap', gap: '50px' }}>
        
        <div style={{ flex: '1 1 500px' }}>
          <p style={{ color: '#f59e0b', fontWeight: 'bold', letterSpacing: '2px', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px 0' }}>{primaryVideo.section}</p>
          <h1 style={{ fontSize: 'clamp(40px, 5vw, 60px)', margin: '0 0 20px 0', lineHeight: 1.1 }}>{primaryVideo.title}</h1>
          <p style={{ color: '#a1a1aa', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px', whiteSpace: 'pre-wrap' }}>
            {primaryVideo.description || "Immerse yourself in this exclusive choreography block. Complete technical breakdown and rehearsal footage."}
          </p>

          {isUnlocked ? (
            <button onClick={() => navigate('/player', { state: primaryVideo })} style={{ background: '#f59e0b', color: '#050505', padding: '16px 40px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>▶</span> Start Watching
            </button>
          ) : (
            <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Unlock Collection</h3>
              <p style={{ margin: '0 0 20px 0', color: '#a1a1aa' }}>Get lifetime access to all {playlist.length} parts of this choreography.</p>
              <button 
                onClick={() => navigate('/checkout', { state: { title: primaryVideo.title, price: price } })} 
                style={{ width: '100%', background: '#f59e0b', color: '#050505', padding: '16px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Buy Now for ₹{price}
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 400px', background: '#0a0a0a', borderRadius: '12px', padding: '30px', border: '1px solid #333', alignSelf: 'flex-start', marginBottom: '50px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#f4f4f5' }}>Collection Contents</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {playlist.map((video) => (
              <div 
                key={video.id} 
                onClick={() => isUnlocked && navigate('/player', { state: video })}
                style={{ background: '#111', padding: '20px', borderRadius: '8px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isUnlocked ? 'pointer' : 'not-allowed', opacity: isUnlocked ? 1 : 0.6 }}
              >
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#f4f4f5' }}>{video.videoLabel}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>Video • High Definition</p>
                </div>
                <div style={{ background: isUnlocked ? '#f59e0b' : '#333', color: isUnlocked ? '#050505' : '#71717a', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                  {isUnlocked ? '▶' : '🔒'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}