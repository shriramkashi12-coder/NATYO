import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [libraryData, setLibraryData] = useState<any>({});
  const [featuredVideo, setFeaturedVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const q = query(collection(db, "videos"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        const sections: any = {};
        
        let firstVideo: any = null;
        let selectedHero: any = null;

        snapshot.forEach(doc => {
          const data = doc.data();
          if (!firstVideo) firstVideo = data;
          if (data.isFeatured) selectedHero = data;
          
          if (!sections[data.section]) sections[data.section] = {};
          if (!sections[data.section][data.title]) sections[data.section][data.title] = [];
          sections[data.section][data.title].push(data);
        });

        setFeaturedVideo(selectedHero || firstVideo);
        setLibraryData(sections);
        setLoading(false);
      } catch (error) {
        console.error(error); setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handlePlay = (videoData: any) => navigate('/show', { state: { title: videoData.title } });

  if (loading) return <div style={{ backgroundColor: '#050505', minHeight: '100vh' }} />;

  const heroBg = featuredVideo?.coverUrl || (featuredVideo ? `https://image.mux.com/${featuredVideo.playbackId}/thumbnail.png?time=10` : '');

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '50px' }}>
      
      {/* Edge-to-Edge Hero Banner */}
      {featuredVideo && (
        <div style={{ 
          position: 'relative',
          width: '100%',
          height: '80vh', // Takes up 80% of the screen height
          backgroundImage: `url('${heroBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-end',
        }}>
          {/* This creates the smooth fade from the image into the black background below */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '60%',
            background: 'linear-gradient(to bottom, rgba(5,5,5,0) 0%, rgba(5,5,5,0.8) 50%, #050505 100%)',
            zIndex: 1
          }} />

          {/* Hero Content aligned to the left like the mockup */}
          <div style={{ position: 'relative', zIndex: 2, padding: '0 5% 40px 5%', maxWidth: '800px' }}>
            <p style={{ color: '#f59e0b', fontWeight: 'bold', letterSpacing: '2px', fontSize: '12px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              Featured Performance
            </p>
            <h1 style={{ fontSize: 'clamp(40px, 6vw, 70px)', margin: '0 0 15px 0', lineHeight: '1.1', textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}>
              {featuredVideo.title}
            </h1>
            <p style={{ color: '#d4d4d8', fontSize: 'clamp(16px, 2vw, 18px)', marginBottom: '30px', textShadow: '1px 1px 5px rgba(0,0,0,0.8)', maxWidth: '600px', lineHeight: '1.5' }}>
              Experience the grace and rhythm of {featuredVideo.section}. Stream the complete technical rehearsal right now.
            </p>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              {/* Premium Gold Play Button */}
              <button onClick={() => handlePlay(featuredVideo)} style={{ background: '#f59e0b', color: '#050505', padding: '14px 36px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}>
                <span>▶</span> Play Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Scrolling Rows */}
      <div style={{ padding: '0 5%', marginTop: '-20px', position: 'relative', zIndex: 10 }}>
        {!loading && Object.keys(libraryData).map(sectionName => (
          <div key={sectionName} style={{ marginBottom: '50px' }}>
            <h3 style={{ fontSize: '20px', margin: '0 0 15px 0', color: '#f4f4f5', fontWeight: '600' }}>
              {sectionName}
            </h3>
            
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none' /* Hides scrollbar on Firefox */ }}>
              
              {Object.keys(libraryData[sectionName]).map(titleName => {
                const episodes = libraryData[sectionName][titleName];
                const firstEpisode = episodes[0]; 
                const cardBg = firstEpisode.coverUrl || `https://image.mux.com/${firstEpisode.playbackId}/thumbnail.png?time=10`;

                return (
                  <div key={titleName} onClick={() => handlePlay(firstEpisode)} style={{ width: '260px', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.2s', borderRadius: '6px', overflow: 'hidden' }}>
                    {/* The Image Container matching the mockup aspect ratio */}
                    <div style={{ height: '146px', background: '#111', position: 'relative', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={cardBg} alt={titleName} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                      {/* Floating duration/parts pill */}
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                        {episodes.length} Part{episodes.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div style={{ padding: '10px 0' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {titleName}
                      </h4>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '13px' }}>
                        {sectionName}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}