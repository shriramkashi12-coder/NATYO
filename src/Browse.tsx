import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Browse() {
  const navigate = useNavigate();
  const [libraryData, setLibraryData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const q = query(collection(db, "videos"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        const sections: any = {};
        const uniqueCategories = new Set<string>();

        snapshot.forEach(doc => {
          const data = doc.data();
          uniqueCategories.add(data.section);
          if (!sections[data.section]) sections[data.section] = {};
          if (!sections[data.section][data.title]) sections[data.section][data.title] = [];
          sections[data.section][data.title].push(data);
        });

        setCategories(['All', ...Array.from(uniqueCategories)]);
        setLibraryData(sections);
        setLoading(false);
      } catch (error) { console.error(error); setLoading(false); }
    };
    loadData();
  }, []);

  const filteredData = Object.keys(libraryData).reduce((acc: any, sectionName: string) => {
    if (activeCategory !== 'All' && sectionName !== activeCategory) return acc;
    const matchingTitles = Object.keys(libraryData[sectionName]).filter(title =>
      title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      sectionName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (matchingTitles.length > 0) {
      acc[sectionName] = {};
      matchingTitles.forEach(title => acc[sectionName][title] = libraryData[sectionName][title]);
    }
    return acc;
  }, {});

  if (loading) return <div style={{ backgroundColor: '#050505', minHeight: '100vh' }} />;

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif', paddingTop: '100px', paddingBottom: '50px', paddingLeft: '5%', paddingRight: '5%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>Browse</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button 
                key={cat} onClick={() => setActiveCategory(cat)}
                style={{ background: activeCategory === cat ? '#f59e0b' : '#111', color: activeCategory === cat ? '#050505' : '#a1a1aa', border: activeCategory === cat ? '1px solid #f59e0b' : '1px solid #333', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <input 
          type="text" placeholder="Search videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '300px', padding: '12px 20px', borderRadius: '25px', border: '1px solid #333', background: '#111', color: 'white', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {Object.keys(filteredData).map(sectionName => (
        <div key={sectionName} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', color: '#f4f4f5', borderLeft: '3px solid #f59e0b', paddingLeft: '10px' }}>{sectionName}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {Object.keys(filteredData[sectionName]).map(titleName => {
              const episodes = filteredData[sectionName][titleName];
              const firstEpisode = episodes[0]; 
              const cardBg = firstEpisode.coverUrl || `https://image.mux.com/${firstEpisode.playbackId}/thumbnail.png?time=10`;

              return (
                <div 
                  key={titleName} 
                  // THIS IS THE NEW MAGIC LINE: It sends them directly to the Showroom!
                  onClick={() => navigate('/show', { state: { title: titleName } })} 
                  style={{ cursor: 'pointer', transition: 'transform 0.2s', borderRadius: '6px', overflow: 'hidden', background: '#0a0a0a' }}
                >
                  <div style={{ height: '124px', background: '#111', position: 'relative', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src={cardBg} alt={titleName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                      {episodes.length} Part{episodes.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ padding: '10px 0' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titleName}</h4>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '13px' }}>{episodes.length > 1 ? 'Collection' : 'Full Video'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}