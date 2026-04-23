import { useLocation, useNavigate } from 'react-router-dom';
import MuxPlayer from '@mux/mux-player-react';
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Player() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (!state) return navigate('/home');
    
    const fetchPlaylist = async () => {
      try {
        const q = query(
          collection(db, "videos"),
          where("title", "==", state.title.trim())
        );
        
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data());
        
        docs.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeA - timeB;
        });
        
        setPlaylist(docs);
        setCurrentIndex(docs.findIndex((v: any) => v.playbackId === state.playbackId));
      } catch (error) {
        console.error("Error loading sidebar:", error);
      }
    };
    
    fetchPlaylist();
  }, [state, navigate]);

  if (!state) return null;

  return (
    <div style={{ backgroundColor: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      <style>{`
        .player-container { display: flex; flex: 1; overflow: hidden; }
        .sidebar { width: 320px; background: #0a0a0a; overflow-y: auto; border-right: 1px solid #333; display: flex; flex-direction: column; flex-shrink: 0; }
        .video-section { flex: 1; background: #000; display: flex; flex-direction: column; overflow-y: auto; }
        .video-wrapper { width: 100%; background: #000; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #333; flex-shrink: 0; }
        .sidebar-item:hover { background-color: #111; }
        
        /* Mobile Breakpoint */
        @media (max-width: 850px) {
          .player-container { flex-direction: column; overflow-y: auto; }
          .sidebar { width: 100%; border-right: none; flex: none; height: auto; }
          .video-section { flex: none; height: auto; overflow-y: visible; }
          .video-wrapper { max-height: none; }
        }
      `}</style>

      {/* Top Header */}
      <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505', borderBottom: '1px solid #333', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Using navigate(-1) so it acts like a true back button, taking them exactly where they came from */}
          <button onClick={() => navigate(-1)} style={{ background: '#111', border: '1px solid #333', color: '#a1a1aa', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
            ← Back
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#f4f4f5' }}>{state.title}</h2>
        </div>
      </div>

      <div className="player-container">
        
        {/* Left Sidebar */}
        <div className="sidebar">
          <div style={{ padding: '20px', borderBottom: '1px solid #333', background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 10 }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px' }}>Collection Contents</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#f59e0b' }}>{playlist.length} Part{playlist.length !== 1 ? 's' : ''} Available</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {playlist.map((video, index) => {
              const isActive = currentIndex === index;
              return (
                <div 
                  key={index} 
                  className="sidebar-item"
                  onClick={() => navigate('/player', { state: video, replace: true })}
                  style={{ 
                    padding: '16px 20px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid #333',
                    background: isActive ? '#111' : 'transparent',
                    borderLeft: isActive ? '4px solid #f59e0b' : '4px solid transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '50%', 
                    background: isActive ? '#f59e0b' : '#333', 
                    color: isActive ? '#050505' : '#a1a1aa', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '12px', fontWeight: 'bold', flexShrink: 0 
                  }}>
                    {isActive ? '▶' : (index + 1)}
                  </div>
                  
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: isActive ? '#f4f4f5' : '#d4d4d8', fontWeight: isActive ? 'bold' : 'normal', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {video.videoLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Video */}
        <div className="video-section">
          <div className="video-wrapper">
            <MuxPlayer
              playbackId={state.playbackId}
              metadataVideoTitle={state.title}
              streamType="on-demand"
              accentColor="#f59e0b" // Swapped the Mux player UI to Gold
              style={{ width: '100%', aspectRatio: '16/9', maxHeight: '100%' }}
            />
          </div>
          
          <div style={{ padding: '30px', flex: 1, background: '#050505' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#f4f4f5' }}>{state.videoLabel}</h1>
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '15px' }}>Currently playing from: <strong>{state.title}</strong></p>
            
            {currentIndex !== -1 && currentIndex < playlist.length - 1 && (
              <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #333' }}>
                <button 
                  onClick={() => navigate('/player', { state: playlist[currentIndex + 1], replace: true })}
                  style={{ background: '#f59e0b', color: '#050505', padding: '12px 24px', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                  Play Next: {playlist[currentIndex + 1].videoLabel} →
                </button>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}