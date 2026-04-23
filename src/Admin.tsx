import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// 🛑 MUST MATCH YOUR ADMIN EMAIL
const MASTER_EMAIL = "test@natyo.com";

export default function Admin() {
  const navigate = useNavigate();
  
  // Video Form States
  const [section, setSection] = useState('');
  const [title, setTitle] = useState('');
  const [videoLabel, setVideoLabel] = useState('');
  const [playbackId, setPlaybackId] = useState('');
  const [coverUrl, setCoverUrl] = useState(''); 
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  
  // NEW: Analytics States
  const [purchases, setPurchases] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [refreshToggle, setRefreshToggle] = useState(0); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== MASTER_EMAIL) navigate('/home'); 
      else {
        fetchVideos();
        fetchAnalytics(); // Fetch financial data
      }
    });

    const fetchVideos = async () => {
      try {
        const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setVideos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) { console.error(error); }
    };

    // NEW: Fetch and calculate sales data
    const fetchAnalytics = async () => {
      try {
        const q = query(collection(db, "purchases"), orderBy("purchasedAt", "desc"));
        const snapshot = await getDocs(q);
        const purchaseData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setPurchases(purchaseData);
        
        // Calculate Total Revenue
        const revenue = purchaseData.reduce((sum, item) => sum + (Number(item.pricePaid) || 0), 0);
        setTotalRevenue(revenue);
        
        setLoading(false);
      } catch (error) { 
        console.error("Error fetching analytics:", error); 
        setLoading(false);
      }
    };

    return () => unsubscribe();
  }, [navigate, refreshToggle]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!section || !title || !playbackId) return setStatus("Missing fields");
    setStatus("Saving...");
    
    const payload = {
      section: section.trim(),
      title: title.trim(),
      videoLabel: videoLabel.trim() || "Full Video",
      playbackId: playbackId.trim(),
      coverUrl: coverUrl.trim(),
      description: description.trim(), 
      price: Number(price) || 0,       
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "videos", editingId), payload);
        setStatus("Updated successfully!");
        setEditingId(null);
      } else {
        await addDoc(collection(db, "videos"), { ...payload, isFeatured: false, createdAt: serverTimestamp() });
        setStatus("Uploaded successfully!");
      }
      setSection(''); setTitle(''); setVideoLabel(''); setPlaybackId(''); setCoverUrl(''); setDescription(''); setPrice('');
      setRefreshToggle(p => p + 1);
    } catch (error: any) { setStatus("Error: " + error.message); }
  };

  const handleEditClick = (video: any) => {
    setSection(video.section); setTitle(video.title); setVideoLabel(video.videoLabel);
    setPlaybackId(video.playbackId); setCoverUrl(video.coverUrl || ''); 
    setDescription(video.description || ''); setPrice(video.price || '');
    setEditingId(video.id); setStatus("Editing mode active");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null); setSection(''); setTitle(''); setVideoLabel(''); setPlaybackId(''); setCoverUrl(''); setDescription(''); setPrice('');
    setStatus("Edit cancelled");
  };

  const handleDelete = async (id: string, t: string) => {
    if (window.confirm(`Delete "${t}"?`)) {
      await deleteDoc(doc(db, "videos", id));
      if (editingId === id) handleCancelEdit();
      setRefreshToggle(p => p + 1);
    }
  };

  const handleSetHero = async (id: string, currentTitle: string) => {
    if (window.confirm(`Pin "${currentTitle}" to Hero?`)) {
      const featuredQuery = query(collection(db, "videos"), where("isFeatured", "==", true));
      const featuredSnap = await getDocs(featuredQuery);
      await Promise.all(featuredSnap.docs.map(d => updateDoc(doc(db, "videos", d.id), { isFeatured: false })));
      await updateDoc(doc(db, "videos", id), { isFeatured: true });
      setRefreshToggle(p => p + 1);
    }
  };

  if (loading) return <div style={{ backgroundColor: '#050505', minHeight: '100vh' }} />;

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh', padding: 'clamp(20px, 5vw, 50px)', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '60px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', margin: 0, color: '#f4f4f5' }}>Command Center</h1>
          <button onClick={() => navigate('/home')} style={{ background: 'transparent', color: '#a1a1aa', border: '1px solid #333', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}>Go to Home</button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* NEW: FINANCIAL ANALYTICS DASHBOARD */}
        {/* ---------------------------------------------------------------- */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 15px 0', color: '#f4f4f5' }}>Performance Overview</h2>
          
          {/* Top Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '12px', border: '1px solid #333', borderLeft: '4px solid #10b981' }}>
              <p style={{ margin: '0 0 5px 0', color: '#a1a1aa', fontSize: '14px' }}>Total Revenue</p>
              <h3 style={{ margin: 0, fontSize: '28px', color: '#10b981' }}>₹{totalRevenue.toLocaleString()}</h3>
            </div>
            
            <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '12px', border: '1px solid #333', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0 0 5px 0', color: '#a1a1aa', fontSize: '14px' }}>Total Collections Sold</p>
              <h3 style={{ margin: 0, fontSize: '28px', color: '#f59e0b' }}>{purchases.length}</h3>
            </div>
          </div>

          {/* Recent Transactions Ledger */}
          <div style={{ background: '#0a0a0a', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', background: '#111', borderBottom: '1px solid #333' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f4f4f5' }}>Recent Transactions</h3>
            </div>
            {purchases.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#71717a' }}>No sales recorded yet.</div>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: '#a1a1aa', fontSize: '12px', borderBottom: '1px solid #222' }}>
                      <th style={{ padding: '12px 20px', fontWeight: 'normal' }}>User Email</th>
                      <th style={{ padding: '12px 20px', fontWeight: 'normal' }}>Collection</th>
                      <th style={{ padding: '12px 20px', fontWeight: 'normal' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((sale) => (
                      <tr key={sale.id} style={{ borderBottom: '1px solid #222', fontSize: '14px' }}>
                        <td style={{ padding: '12px 20px', color: '#f4f4f5' }}>{sale.userEmail}</td>
                        <td style={{ padding: '12px 20px', color: '#a1a1aa' }}>{sale.title}</td>
                        <td style={{ padding: '12px 20px', color: '#10b981', fontWeight: 'bold' }}>₹{sale.pricePaid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* ---------------------------------------------------------------- */}

        {/* Existing Content Management Section */}
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 350px', background: '#0a0a0a', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
            <h2 style={{ color: editingId ? '#10b981' : '#f59e0b', fontSize: '22px', marginTop: 0 }}>{editingId ? 'Edit Content' : 'Add Content'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Section (e.g., Kathak)" value={section} onChange={e => setSection(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', outline: 'none' }} />
              <input type="text" placeholder="Main Title (e.g., Angikam)" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', outline: 'none' }} />
              <textarea placeholder="Choreography Description & Details" value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', outline: 'none', resize: 'vertical' }} />
              <input type="number" placeholder="Price (e.g. 499) - Leave 0 for Free" value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', outline: 'none' }} />
              <input type="text" placeholder="Video Label (e.g., Part 1)" value={videoLabel} onChange={e => setVideoLabel(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', outline: 'none' }} />
              <input type="text" placeholder="Mux Playback ID" value={playbackId} onChange={e => setPlaybackId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', outline: 'none' }} />
              <input type="text" placeholder="Optional: Custom Cover Image URL" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '6px', background: '#050505', color: 'white', border: '1px solid #333', outline: 'none' }} />

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '16px', background: editingId ? '#10b981' : '#f59e0b', color: '#050505', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{editingId ? 'Update Video' : 'Upload Video'}</button>
                {editingId && <button type="button" onClick={handleCancelEdit} style={{ padding: '16px', background: '#333', color: '#f4f4f5', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>}
              </div>
              <p style={{ textAlign: 'center', color: '#a1a1aa', margin: '5px 0 0 0', fontSize: '13px' }}>{status}</p>
            </form>
          </div>

          <div style={{ flex: '2 1 400px', background: '#0a0a0a', padding: '30px', borderRadius: '12px', border: '1px solid #333', maxHeight: '70vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '22px', marginTop: 0, color: '#f4f4f5' }}>Manage Catalog</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {videos.map((v) => (
                <div key={v.id} style={{ background: '#050505', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', border: '1px solid #333', borderLeft: v.isFeatured ? '4px solid #f59e0b' : '1px solid #333' }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#f4f4f5' }}>{v.title} <span style={{ color: '#10b981', fontSize: '14px' }}>{v.price > 0 ? `(₹${v.price})` : '(Free)'}</span></h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>{v.section} • {v.videoLabel}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleSetHero(v.id, v.title)} style={{ background: '#111', color: '#f59e0b', border: '1px solid #f59e0b', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>🌟 Hero</button>
                    <button onClick={() => handleEditClick(v)} style={{ background: '#111', color: '#a1a1aa', border: '1px solid #333', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(v.id, v.title)} style={{ background: '#111', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}