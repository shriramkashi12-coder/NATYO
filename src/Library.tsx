import { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

export default function Library() {
  const navigate = useNavigate();
  const [libraryVideos, setLibraryVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        loadUserLibrary(user.email);
      } else {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadUserLibrary = async (email: string) => {
    try {
      // 1. Find all receipts belonging to this user
      const purchasesQuery = query(collection(db, "purchases"), where("userEmail", "==", email));
      const purchasesSnap = await getDocs(purchasesQuery);
      
      if (purchasesSnap.empty) {
        setLibraryVideos([]);
        setLoading(false);
        return;
      }

      // Extract the titles they own
      const ownedTitles = purchasesSnap.docs.map(doc => doc.data().title);

      // 2. Fetch the video data for those specific titles
      const videosQuery = query(collection(db, "videos"));
      const videosSnap = await getDocs(videosQuery);
      
      const userContent: any = {};
      
      videosSnap.forEach(doc => {
        const data = doc.data();
        if (ownedTitles.includes(data.title)) {
          if (!userContent[data.title]) {
            userContent[data.title] = { ...data, partsCount: 1 };
          } else {
            userContent[data.title].partsCount += 1;
          }
        }
      });

      setLibraryVideos(Object.values(userContent));
      setLoading(false);
    } catch (error) {
      console.error("Error loading library:", error);
      setLoading(false);
    }
  };

  if (loading) return <div style={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>Loading Your Vault...</div>;

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', paddingTop: '100px', paddingBottom: '50px', paddingLeft: '5%', paddingRight: '5%' }}>
      
      <div style={{ marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 10px 0', color: '#f4f4f5' }}>My Library</h1>
        <p style={{ margin: 0, color: '#a1a1aa' }}>Your personal collection of unlocked choreography.</p>
      </div>

      {libraryVideos.length === 0 ? (
        <div style={{ background: '#0a0a0a', padding: '50px 20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #333' }}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎬</div>
          <h2 style={{ margin: '0 0 10px 0', color: '#f4f4f5' }}>Your library is empty</h2>
          <p style={{ color: '#a1a1aa', marginBottom: '25px' }}>You haven't unlocked any collections yet.</p>
          <button 
            onClick={() => navigate('/browse')}
            style={{ background: '#f59e0b', color: '#050505', padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' }}>
          {libraryVideos.map((video, idx) => {
            const cardBg = video.coverUrl || `https://image.mux.com/${video.playbackId}/thumbnail.png?time=10`;

            return (
              <div 
                key={idx} 
                onClick={() => navigate('/show', { state: { title: video.title } })} 
                style={{ cursor: 'pointer', transition: 'transform 0.2s', borderRadius: '8px', overflow: 'hidden', background: '#0a0a0a', border: '1px solid #333' }}
              >
                <div style={{ height: '140px', background: '#111', position: 'relative' }}>
                  <img src={cardBg} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {video.partsCount} Part{video.partsCount > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ padding: '15px' }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.title}</h4>
                  <p style={{ margin: 0, color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>✓ Purchased</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}