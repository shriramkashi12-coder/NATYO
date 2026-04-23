import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
// NEW: Added updateDoc to allow admins to edit the document with a reply
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const MASTER_EMAIL = "test@natyo.com";

export default function Show() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'questions'>('overview');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // State for the Questions System
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: State for Admin Replies
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Load Video Data
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

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || null);
      loadData(user?.email || null);
    });

    return () => unsubscribeAuth();
  }, [state, navigate]);

  // Real-time listener for Questions
  useEffect(() => {
    if (!state?.title) return;

    const qRef = collection(db, "questions");
    const q = query(qRef, where("title", "==", state.title.trim()));

    const unsubscribeQuestions = onSnapshot(q, (snapshot) => {
      const fetchedQuestions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      fetchedQuestions.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA; 
      });
      
      setQuestionsList(fetchedQuestions);
    });

    return () => unsubscribeQuestions();
  }, [state]);

  // Function to save a new question
  const handlePostQuestion = async () => {
    if (!questionText.trim() || !userEmail) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "questions"), {
        title: state.title.trim(),
        userEmail: userEmail,
        text: questionText.trim(),
        createdAt: serverTimestamp()
      });
      setQuestionText(""); 
    } catch (error) {
      console.error("Error posting question:", error);
      alert("Failed to post question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Function to save the Admin's reply to a specific question
  const handlePostReply = async (questionId: string) => {
    if (!replyText.trim()) return;
    setIsReplying(true);

    try {
      // Find the specific question and update it with the adminReply field
      const qRef = doc(db, "questions", questionId);
      await updateDoc(qRef, {
        adminReply: replyText.trim()
      });
      
      // Close the reply box and clear text
      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply. Please try again.");
    } finally {
      setIsReplying(false);
    }
  };

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
          <h1 style={{ fontSize: 'clamp(40px, 5vw, 60px)', margin: '0 0 30px 0', lineHeight: 1.1 }}>{primaryVideo.title}</h1>
          
          <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid #222', marginBottom: '30px' }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{ 
                background: 'none', border: 'none', padding: '0 0 10px 0', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
                color: activeTab === 'overview' ? '#f59e0b' : '#a1a1aa',
                borderBottom: activeTab === 'overview' ? '2px solid #f59e0b' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('questions')}
              style={{ 
                background: 'none', border: 'none', padding: '0 0 10px 0', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
                color: activeTab === 'questions' ? '#f59e0b' : '#a1a1aa',
                borderBottom: activeTab === 'questions' ? '2px solid #f59e0b' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              Questions
            </button>
          </div>

          {/* TAB 1: OVERVIEW CONTENT */}
          {activeTab === 'overview' && (
            <div>
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
          )}

          {/* TAB 2: QUESTIONS CONTENT */}
          {activeTab === 'questions' && (
            <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
              
              {/* Dynamic Questions List */}
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                {questionsList.length === 0 ? (
                  <p style={{ color: '#a1a1aa', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                    No questions yet. Be the first to ask!
                  </p>
                ) : (
                  questionsList.map((q) => {
                    // Check if current logged-in user is the Admin
                    const isCurrentUserAdmin = userEmail === MASTER_EMAIL;
                    
                    return (
                      <div key={q.id} style={{ paddingBottom: '15px', borderBottom: '1px solid #1a1a1a', marginBottom: '15px' }}>
                        
                        {/* The Original Question */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <strong style={{ color: '#f59e0b', fontSize: '13px' }}>{q.userEmail}</strong>
                        </div>
                        <p style={{ margin: '8px 0 10px 0', fontSize: '14px', color: '#ddd', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {q.text}
                        </p>

                        {/* NEW: The Nested Admin Reply (shows if it exists) */}
                        {q.adminReply && (
                          <div style={{ 
                            marginTop: '10px', padding: '15px', backgroundColor: 'rgba(245, 158, 11, 0.05)', 
                            borderLeft: '3px solid #f59e0b', borderRadius: '0 8px 8px 0' 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <strong style={{ color: '#f59e0b', fontSize: '13px' }}>{MASTER_EMAIL}</strong>
                              <span style={{ backgroundColor: '#f59e0b', color: '#000', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px', letterSpacing: '1px' }}>
                                INSTRUCTOR
                              </span>
                            </div>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#fff', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {q.adminReply}
                            </p>
                          </div>
                        )}

                        {/* NEW: Reply Trigger Button (Only visible to Admin, and only if no reply exists) */}
                        {isCurrentUserAdmin && !q.adminReply && replyingTo !== q.id && (
                          <button 
                            onClick={() => setReplyingTo(q.id)}
                            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '12px', cursor: 'pointer', padding: 0, marginTop: '5px', textDecoration: 'underline' }}
                          >
                            Reply to this question
                          </button>
                        )}

                        {/* NEW: Admin Reply Input Box */}
                        {replyingTo === q.id && (
                          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#111', borderRadius: '6px', border: '1px solid #333' }}>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your official reply..."
                              style={{ width: '100%', height: '60px', backgroundColor: '#000', color: '#fff', border: '1px solid #222', borderRadius: '4px', padding: '8px', marginBottom: '8px', resize: 'none', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                onClick={() => handlePostReply(q.id)}
                                disabled={isReplying || !replyText.trim()}
                                style={{ padding: '6px 12px', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                              >
                                {isReplying ? 'Saving...' : 'Save Reply'}
                              </button>
                              <button 
                                onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

              {/* User Input Area */}
              <div style={{ marginTop: '10px' }}>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Ask a question about this performance..."
                  style={{ 
                    width: '100%', height: '80px', backgroundColor: '#111', color: '#fff', 
                    border: '1px solid #333', borderRadius: '6px', padding: '12px', 
                    marginBottom: '12px', resize: 'none', outline: 'none', boxSizing: 'border-box'
                  }}
                />
                <button 
                  onClick={handlePostQuestion}
                  disabled={isSubmitting || !questionText.trim()}
                  style={{ 
                    width: '100%', padding: '12px', 
                    backgroundColor: (isSubmitting || !questionText.trim()) ? '#333' : '#f59e0b', 
                    color: (isSubmitting || !questionText.trim()) ? '#777' : '#000', 
                    border: 'none', borderRadius: '6px', 
                    cursor: (isSubmitting || !questionText.trim()) ? 'not-allowed' : 'pointer', 
                    fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s'
                  }}>
                  {isSubmitting ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* PLAYLIST PANEL */}
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
