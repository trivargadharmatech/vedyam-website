import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ArrowLeft, Play, LayoutDashboard, ChevronLeft, Menu, Send, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [quickChatQuery, setQuickChatQuery] = useState('');
  const [topics, setTopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('selection'); // selection, learning, quiz, qa
  const [activeTab, setActiveTab] = useState('explanation'); // explanation, resources
  const [quizData, setQuizData] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [qaHistory, setQaHistory] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [qaInput, setQaInput] = useState('');
  const [explanation, setExplanation] = useState('');
  const [audioResources, setAudioResources] = useState([]);
  const [videoResources, setVideoResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock topics just to get the flow working based on the existing app.js
  useEffect(() => {
    setTopics([
      { id: "understanding-ramayana", title: "Understanding the Ramayana", category: "Life Topics", tags: ["ramayana", "valmiki", "symbolism"] },
      { id: "self", title: "Self", category: "Life Topics", tags: ["confidence", "resilience", "purpose"] },
      { id: "relationships", title: "Relationships", category: "Life Topics", tags: ["hospitality", "devotion", "service"] },
      { id: "leadership", title: "Leadership", category: "Life Topics", tags: ["strategy", "sacrifice", "responsibility"] },
      { id: "ethics-society", title: "Ethics and Society", category: "Life Topics", tags: ["dharma", "justice", "society"] },
      { id: "nature-existence", title: "Nature and Existence", category: "Life Topics", tags: ["nature", "harmony", "stewardship"] },
    ]);
  }, []);

  const handleSelectTopic = async (topic) => {
    setCurrentTopic(topic);
    setCurrentScreen('learning');
    setLoading(true);
    
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.title })
      });
      const data = await res.json();
      
      if (data.intro || data.narrative) {
        let bulletHtml = '';
        if (Array.isArray(data.takeaways)) {
          bulletHtml = data.takeaways.map(t => `<li>${t}</li>`).join('');
        } else if (typeof data.takeaways === 'string') {
          bulletHtml = `<li>${data.takeaways}</li>`;
        }

        const formattedHtml = `
          <div class="explanation-text">
            <p>${data.intro || ''}</p>
            <h3 style="margin-top:1.5rem; margin-bottom:0.5rem; font-size:1.1rem; color:var(--text-main);">The Story & Narrative</h3>
            <p>${data.narrative || ''}</p>
            <h3 style="margin-top:1.5rem; margin-bottom:0.5rem; font-size:1.1rem; color:var(--text-main);">Spiritual & Historical Context</h3>
            <p>${data.context || ''}</p>
            <div class="takeaway-box" style="margin-top:1.5rem; padding:1.5rem; background:var(--bg-tertiary); border-left:4px solid var(--accent-gold); border-radius:8px;">
              <h4 style="margin-bottom:0.5rem; color:var(--accent-gold);">Key Takeaways</h4>
              <ul style="margin-left:1.5rem; padding-left:1rem; list-style-type:disc;">${bulletHtml}</ul>
            </div>
            <h3 style="margin-top:1.5rem; margin-bottom:0.5rem; font-size:1.1rem; color:var(--text-main);">Summary</h3>
            <p>${data.summary || ''}</p>
          </div>
        `;
        setExplanation(formattedHtml);
      } else {
        setExplanation('Failed to generate explanation. Data format unrecognized.');
      }

      const rRes = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.title })
      });
      const rData = await rRes.json();
      setAudioResources(rData.audios || []);
      setVideoResources(rData.videos || []);

    } catch (e) {
      console.error(e);
      setExplanation('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    setCurrentScreen('quiz');
    setLoading(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: currentTopic.title })
      });
      const data = await res.json();
      setQuizData(data.questions || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendQa = async () => {
    if(!qaInput.trim()) return;
    const newHistory = [...qaHistory, { sender: 'user', text: qaInput }];
    setQaHistory(newHistory);
    const q = qaInput;
    setQaInput('');
    setQaLoading(true);

    try {
      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: currentTopic.title, question: q })
      });
      const data = await res.json();
      setQaHistory([...newHistory, { sender: 'bot', text: data.response || "No response received" }]);
    } catch(e) {
      setQaHistory([...newHistory, { sender: 'bot', text: 'Error connecting to backend.' }]);
    } finally {
      setQaLoading(false);
    }
  };

  const handleQuickLaunch = () => {
    if (quickChatQuery.trim()) {
      navigate('/chatbot', { state: { initialQuery: quickChatQuery } });
    } else {
      navigate('/chatbot');
    }
  };

  const getActiveNodeId = () => {
    let activeNodeId = "ChatInput-Topic";
    if (currentScreen === "learning") {
      if (activeTab === "explanation") activeNodeId = "LLM-Explanation";
      else if (activeTab === "resources") activeNodeId = "CustomComponent-AudioRetrieval";
    } else if (currentScreen === "quiz") {
      activeNodeId = "LLM-Quiz";
    } else if (currentScreen === "qa") {
      activeNodeId = "LLM-ScopedQA";
    }
    return activeNodeId;
  };
  const activeNode = getActiveNodeId();

  return (
    <div className="dashboard-container">
      {/* Sidebar Controls */}
      <motion.aside 
        className="dashboard-sidebar"
        initial={false}
        animate={{ width: isSidebarOpen ? 360 : 80 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>

        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.3 } }} 
              exit={{ opacity: 0, transition: { duration: 0.2 } }} 
              className="sidebar-content-inner"
            >
              <div className="logo-section">
                <div className="logo-icon">V</div>
                <div className="logo-text">
                  <h2>Vedyam AI</h2>
                  <p>Learning Studio</p>
                </div>
              </div>

              <div className="pipeline-card">
                <h3><Download size={18}/> Langflow Pipeline</h3>
                <p>This flow is fully serialized for direct import. Download the JSON, open your local Langflow dashboard, and click 'Upload'.</p>
                <a href="#" className="btn-primary">Download JSON</a>
              </div>

              <div className="pipeline-steps">
                <h4>User Journey Flow</h4>
                <div className={`step-indicator ${currentScreen === 'selection' ? 'active' : 'completed'}`}>
                  <div className="step-number">1</div> Topic Selection
                </div>
                <div className={`step-indicator ${currentScreen === 'learning' ? 'active' : (currentScreen === 'quiz' || currentScreen === 'qa' ? 'completed' : '')}`}>
                  <div className="step-number">2</div> Topic Learning Core
                </div>
                <div className={`step-indicator ${currentScreen === 'quiz' ? 'active' : (currentScreen === 'qa' ? 'completed' : '')}`}>
                  <div className="step-number">3</div> Topic-Scoped Quiz
                </div>
                <div className={`step-indicator ${currentScreen === 'qa' ? 'active' : ''}`}>
                  <div className="step-number">4</div> Topic-Scoped Q&A
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Simulator Content Layout */}
      <main className="simulator-container">
        <header className="dashboard-header">
          <div>
            <h1>Vedyam AI Learning Mode</h1>
            <p>Design, simulate, and export structured educational workflows powered by Langflow</p>
          </div>
          <div className="version-badge" style={{padding: '0.25rem 0.75rem', borderRadius: '99px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.85rem'}}>Version 1.0.0</div>
        </header>

        <motion.div 
          className="chatbot-quick-ask"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <div style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-saffron))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.1rem', color: 'var(--text-main)' }}>Ask ShastraBot</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Get instant answers from ancient wisdom</p>
            </div>
          </div>
          
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="e.g., What is the true meaning of Dharma?" 
              value={quickChatQuery}
              onChange={(e) => setQuickChatQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickLaunch()}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                borderRadius: '99px',
                padding: '0.85rem 3.5rem 0.85rem 1.5rem',
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                outline: 'none',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-gold)';
                e.target.style.boxShadow = '0 0 0 2px rgba(14, 165, 233, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--card-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button 
              onClick={handleQuickLaunch}
              style={{
                position: 'absolute',
                right: '6px',
                background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-saffron))',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>

        <div className="verification-banner animate-on-scroll visible">
          <span><strong>Verification:</strong> Modular pipeline structure complies with the requested schemas.</span>
        </div>

        <div className="workspace-grid">
          {/* COLUMN 1: INTERACTIVE SIMULATOR (APP DEVICE FRAME) */}
          <section className="simulator-device animate-on-scroll visible">
            <div className="device-header">
              <div className="device-title">
                <div className="status-dot"></div>
                <h4>Interactive Simulator</h4>
              </div>
            </div>

            <div className="device-screen">
              {loading && (
                <div className="loading-spinner-container">
                  <div className="loading-spinner"></div>
                  <p style={{marginTop: '1rem', color: 'var(--accent-gold)'}}>AI is thinking...</p>
                </div>
              )}

              {!loading && (
                <AnimatePresence mode="wait">
                  {currentScreen === 'selection' && (
                    <motion.div 
                      key="selection"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="sim-screen active"
                    >
                      <div style={{marginBottom: '1.5rem'}}>
                        <h3 style={{fontSize: '1.25rem', marginBottom: '0.5rem'}}>Select a Learning Topic</h3>
                        <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5}}>Select a topic below to generate a guided learning journey led by an AI Teacher.</p>
                      </div>
                      <div className="topics-grid">
                        {topics.map(topic => (
                          <div key={topic.id} className="topic-item-card" onClick={() => handleSelectTopic(topic)}>
                            <div className="topic-card-header">
                              <span className="topic-category">{topic.category}</span>
                              <ArrowLeft size={16} style={{transform: 'rotate(180deg)', color: 'var(--accent-gold)'}}/>
                            </div>
                            <h4 className="topic-title">{topic.title}</h4>
                            <div className="topic-tags">
                              {topic.tags.map(tag => <span key={tag} className="tag-badge">#{tag}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {currentScreen === 'learning' && currentTopic && (
                    <motion.div 
                      key="learning"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="sim-screen active"
                    >
                      <div className="learning-navigation-header">
                        <div className="back-link" onClick={() => setCurrentScreen('selection')}><ArrowLeft size={16}/> Back to topics</div>
                      </div>
                      <h3 className="learning-title" style={{marginBottom: '1.5rem'}}>{currentTopic.title}</h3>
                      <div className="learning-tabs">
                        <button className={`tab-btn ${activeTab === 'explanation' ? 'active' : ''}`} onClick={() => setActiveTab('explanation')}>Explanation</button>
                        <button className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>Audio/Video</button>
                      </div>
                      
                      {activeTab === 'explanation' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content active">
                          <div className="explanation-text" dangerouslySetInnerHTML={{__html: explanation}} />
                        </motion.div>
                      )}

                      {activeTab === 'resources' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tab-content active">
                          <div className="resources-list">
                            <h4 style={{marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--accent-gold)'}}>Audio Context</h4>
                            {audioResources.map((audio, i) => (
                              <div key={i} className="audio-item">
                                <div className="audio-thumbnail"><Play size={20}/></div>
                                <div className="audio-info">
                                  <div className="audio-title">{audio.title}</div>
                                  <div className="audio-duration">10:00</div>
                                </div>
                                <button className="play-btn"><Play size={16}/></button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      <div className="sticky-footer">
                        <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Step 2 of 4</span>
                        <button className="btn-primary" onClick={handleStartQuiz}>Continue to Quiz</button>
                      </div>
                    </motion.div>
                  )}

                  {currentScreen === 'quiz' && (
                    <motion.div 
                      key="quiz"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="sim-screen active"
                    >
                      <div className="learning-navigation-header">
                        <div className="back-link" onClick={() => setCurrentScreen('learning')}><ArrowLeft size={16}/> Back</div>
                      </div>
                      <h3 className="learning-title" style={{marginBottom: '1.5rem'}}>Topic Quiz</h3>
                      <div className="quiz-container">
                        {quizData.map((q, i) => {
                          const isMcq = q.type === "mcq" || q.type === "tf" || (q.options && q.options.length > 0);
                          return (
                          <div key={i} className="quiz-question-card">
                            <div className="question-meta">Question {i+1}</div>
                            <div className="question-text">{q.question}</div>
                            
                            {isMcq ? (
                              <div className="options-list">
                                {(q.options || []).map((opt, j) => {
                                  let stateClass = "";
                                  if (quizSubmitted) {
                                    if (j === q.answer) stateClass = "correct";
                                    else if (quizAnswers[i] === j) stateClass = "incorrect";
                                  } else if (quizAnswers[i] === j) {
                                    stateClass = "selected";
                                  }
                                  
                                  return (
                                    <div key={j} className={`option-item ${stateClass}`} onClick={() => {
                                      if (!quizSubmitted) setQuizAnswers({...quizAnswers, [i]: j});
                                    }}>
                                      <div className="radio-check"></div>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="fill-blank-container" style={{marginTop: '1rem'}}>
                                <input 
                                  type="text" 
                                  className="text-input-field" 
                                  placeholder="Type your answer here..."
                                  value={quizAnswers[i] || ""}
                                  disabled={quizSubmitted}
                                  style={{
                                    borderColor: quizSubmitted ? (String(quizAnswers[i] || "").toLowerCase() === String(q.answer).toLowerCase() ? 'var(--accent-emerald)' : 'var(--accent-rose)') : 'var(--border-color)',
                                    background: quizSubmitted ? (String(quizAnswers[i] || "").toLowerCase() === String(q.answer).toLowerCase() ? 'rgba(16,185,129,0.05)' : 'rgba(244,63,94,0.05)') : 'transparent',
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid',
                                    color: 'var(--text-main)'
                                  }}
                                  onChange={(e) => {
                                    if (!quizSubmitted) setQuizAnswers({...quizAnswers, [i]: e.target.value});
                                  }}
                                />
                                {quizSubmitted && <p style={{fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--accent-emerald)'}}>Correct Answer: {q.answer}</p>}
                              </div>
                            )}
                          </div>
                        )})}
                      </div>
                      <div className="sticky-footer" style={{display: 'flex', gap: '1rem'}}>
                        {quizSubmitted ? (
                          <>
                            <span style={{fontSize: '1rem', fontWeight: 600, color: 'var(--accent-emerald)', margin: 'auto 0'}}>Score: {quizScore}/{quizData.length}</span>
                            <button className="btn-primary" style={{marginLeft: 'auto', background: 'linear-gradient(135deg, var(--accent-emerald), #059669)', color: '#fff'}} onClick={() => { setCurrentScreen('qa'); setQaHistory([]); }}>
                              Continue to Q&A
                            </button>
                          </>
                        ) : (
                          <>
                            <span style={{fontSize: '0.85rem', color: 'var(--text-muted)', margin: 'auto 0'}}>Step 3 of 4</span>
                            <button className="btn-primary" style={{marginLeft: 'auto'}} onClick={() => {
                              let score = 0;
                              quizData.forEach((q, idx) => {
                                if (q.type === "mcq" || q.type === "tf" || (q.options && q.options.length > 0)) {
                                  if (quizAnswers[idx] === q.answer) score++;
                                } else {
                                  if (String(quizAnswers[idx] || "").trim().toLowerCase() === String(q.answer).trim().toLowerCase()) score++;
                                }
                              });
                              setQuizScore(score);
                              setQuizSubmitted(true);
                            }}>Submit Answers</button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {currentScreen === 'qa' && (
                    <motion.div 
                      key="qa"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="sim-screen active"
                    >
                      <div className="learning-navigation-header">
                        <div className="back-link" onClick={() => setCurrentScreen('selection')}><ArrowLeft size={16}/> Finish Journey</div>
                      </div>
                      <h3 className="learning-title" style={{marginBottom: '1rem'}}>Ask the AI Teacher</h3>
                      <div className="chat-window">
                        <div className="chat-history">
                          <div className="chat-message bot">
                            <div className="message-sender">AI Teacher</div>
                            <div>What questions do you have about {currentTopic?.title}?</div>
                          </div>
                            {qaHistory.map((msg, i) => (
                              <div key={i} className={`chat-message ${msg.sender}`}>
                                <div className="message-sender">{msg.sender === 'user' ? 'You' : 'AI Teacher'}</div>
                                <div>{msg.text}</div>
                              </div>
                            ))}
                            {qaLoading && (
                              <div className="chat-message bot">
                                <div className="message-sender">AI Teacher</div>
                                <div><span className="typing-indicator"><span>.</span><span>.</span><span>.</span></span></div>
                              </div>
                            )}
                        </div>
                        <div className="chat-input-bar">
                          <input 
                            type="text" 
                            placeholder="Type your question..." 
                            value={qaInput} 
                            onChange={(e) => setQaInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendQa()}
                          />
                          <button className="chat-send-btn" onClick={handleSendQa}>Send</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </section>

          {/* COLUMN 2: LANGFLOW PIPELINE BLUEPRINT DIAGRAM */}
          <section className="flow-diagram-panel animate-on-scroll visible" style={{transitionDelay: '0.2s'}}>
            <div className="flow-title-row">
              <h2 style={{fontSize:'1.15rem', color: '#fff'}}>Langflow Backend Blueprint</h2>
              <div className="flow-badge">Active Engine</div>
            </div>
            <p style={{fontSize:'0.85rem', color: 'var(--text-muted)', lineHeight: 1.5}}>This blueprint represents the active nodes being requested in your imported Langflow JSON. Interact with the simulator to see states toggle.</p>
            <div className="flow-canvas">
              <div className="flow-map-graphic">
                
                {/* Topic Input Node */}
                <div className={`visual-node ${activeNode === 'ChatInput-Topic' ? 'active-state' : ''}`} id="node-ChatInput-Topic">
                  <div className="node-header">
                    <span className="node-type">Input Node</span>
                    <span style={{color: 'var(--accent-emerald)'}}>●</span>
                  </div>
                  <div className="node-title">ChatInput-Topic</div>
                  <div className="node-desc">Captures selected topic name and passes payload.</div>
                  <div className="node-connector"></div>
                </div>

                {/* Explanation Generator Node */}
                <div className={`visual-node ${activeNode === 'LLM-Explanation' ? 'active-state' : ''}`} id="node-LLM-Explanation">
                  <div className="node-header">
                    <span className="node-type">LLM Chain</span>
                    <span style={{color: 'var(--accent-gold)'}}>★</span>
                  </div>
                  <div className="node-title">Explanation Generator</div>
                  <div className="node-desc">Prompts model to draft structure: Intro, Story, Takeaways, Summary.</div>
                  <div className="node-connector"></div>
                </div>

                {/* Audio Retrieval Service */}
                <div className={`visual-node ${activeNode === 'CustomComponent-AudioRetrieval' ? 'active-state' : ''}`} id="node-CustomComponent-AudioRetrieval">
                  <div className="node-header">
                    <span className="node-type">Custom Component</span>
                    <span style={{color: '#6366f1'}}>⛭</span>
                  </div>
                  <div className="node-title">Audio Retrieval Service</div>
                  <div className="node-desc">Executes vector search or metadata query on audio catalog.</div>
                  <div className="node-connector"></div>
                </div>

                {/* Video Retrieval Service */}
                <div className={`visual-node ${activeNode === 'CustomComponent-VideoRetrieval' ? 'active-state' : ''}`} id="node-CustomComponent-VideoRetrieval">
                  <div className="node-header">
                    <span className="node-type">Custom Component</span>
                    <span style={{color: '#6366f1'}}>⛭</span>
                  </div>
                  <div className="node-title">Video Retrieval Service</div>
                  <div className="node-desc">Executes vector search or metadata query on video catalog.</div>
                  <div className="node-connector"></div>
                </div>

                {/* Quiz Generator Node */}
                <div className={`visual-node ${activeNode === 'LLM-Quiz' ? 'active-state' : ''}`} id="node-LLM-Quiz">
                  <div className="node-header">
                    <span className="node-type">LLM Chain</span>
                    <span style={{color: 'var(--accent-gold)'}}>★</span>
                  </div>
                  <div className="node-title">AI Quiz Generator</div>
                  <div className="node-desc">Constrains questions to explanation context (MCQ, T/F, Fill-in).</div>
                  <div className="node-connector"></div>
                </div>

                {/* Scoped Q&A Guardrail Node */}
                <div className={`visual-node ${activeNode === 'LLM-ScopedQA' ? 'active-state' : ''}`} id="node-LLM-ScopedQA">
                  <div className="node-header">
                    <span className="node-type">LLM Guardrail</span>
                    <span style={{color: 'var(--accent-rose)'}}>🛡</span>
                  </div>
                  <div className="node-title">Scoped Q&A Router</div>
                  <div className="node-desc">Filters user queries. Rejects queries outside topic context.</div>
                  <div className="node-connector"></div>
                </div>

                {/* Forward Questioning Node */}
                <div className={`visual-node ${activeNode === 'LLM-ForwardQuestioning' ? 'active-state' : ''}`} id="node-LLM-ForwardQuestioning">
                  <div className="node-header">
                    <span className="node-type">LLM Chat Agent</span>
                    <span style={{color: 'var(--accent-gold)'}}>★</span>
                  </div>
                  <div className="node-title">AI Teacher Mentorship</div>
                  <div className="node-desc">Guides user with open-ended reflective dialogues.</div>
                </div>

              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
