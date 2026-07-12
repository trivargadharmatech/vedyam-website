import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon, Send, Compass, MessageSquare, RotateCcw, Plus, User, Menu, PanelLeft, Copy, Check, Trash2, ArrowLeft } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import tilakLogoImg from './assets/tilak.png';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

// Animated markdown message: renders words one by one on mount
function AnimatedBotMessage({ content, isNew }) {
  const [displayed, setDisplayed] = useState(isNew ? '' : content);
  const animRef = useRef(null);

  useEffect(() => {
    if (!isNew) {
      setDisplayed(content);
      return;
    }
    // Word-by-word reveal
    const words = content.split(' ');
    let i = 0;
    setDisplayed('');
    const step = () => {
      i++;
      setDisplayed(words.slice(0, i).join(' ') + (i < words.length ? ' ' : ''));
      if (i < words.length) {
        animRef.current = setTimeout(step, 18);
      }
    };
    animRef.current = setTimeout(step, 18);
    return () => clearTimeout(animRef.current);
  }, [content, isNew]);

  return (
    <div className="message-content markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{isNew ? displayed : content}</ReactMarkdown>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState('light');
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'explorer'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // History State
  const [chatSessions, setChatSessions] = useState([]);
  const [explorerSessions, setExplorerSessions] = useState([]);

  // Chat State
  const [currentChatId, setCurrentChatId] = useState(Date.now());
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [newestBotIdx, setNewestBotIdx] = useState(-1);
  const scrollContainerRef = useRef(null);

  // Explorer State
  const [currentExploreId, setCurrentExploreId] = useState(Date.now() + 1);
  const [exploreTopic, setExploreTopic] = useState('');
  const [explorePath, setExplorePath] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isExploreLoading, setIsExploreLoading] = useState(false);
  const explorerTopRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('shastrabot-theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') document.body.classList.add('dark');

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('shastrabot-theme', newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  // Scroll to bottom of chat safely (instant, no smooth scroll lock)
  useEffect(() => {
    if (activeTab === 'chat' && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length, isChatLoading, activeTab]);

  // Scroll to top of explorer answer when new answer arrives
  useEffect(() => {
    if (activeTab === 'explorer' && currentAnswer && explorerTopRef.current) {
      explorerTopRef.current.scrollIntoView(); // instant
    }
  }, [currentAnswer, activeTab]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleChatSend = async () => {
    if (!inputValue.trim() || isChatLoading) return;
    
    const userMessage = inputValue;
    setInputValue('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsChatLoading(true);

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = import.meta.env.VITE_API_URL || (isLocal ? '' : 'https://vedyam-backend.onrender.com');
      const response = await fetch(`${apiUrl}/api/chat_stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: newMessages }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botContent = '';
      let sources = [];
      let messageAdded = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'token') {
                setIsChatLoading(false); // First token arrived, stop loading animation
                botContent += data.content;
                
                if (!messageAdded) {
                  setMessages(prev => [...prev, { role: 'bot', content: botContent }]);
                  setNewestBotIdx(newMessages.length);
                  messageAdded = true;
                } else {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'bot', content: botContent };
                    return updated;
                  });
                }
              } else if (data.type === 'sources' && data.content && data.content.length > 0) {
                let citationText = '\n\n📚 **Sources:**\n';
                data.content.forEach((src, i) => {
                  const filename = src.split('/').pop().split('\\').pop();
                  citationText += `${i + 1}. ${filename}\n`;
                });
                botContent += citationText;
                
                if (!messageAdded) {
                  setMessages(prev => [...prev, { role: 'bot', content: botContent }]);
                  setNewestBotIdx(newMessages.length);
                  messageAdded = true;
                } else {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'bot', content: botContent };
                    return updated;
                  });
                }
              } else if (data.type === 'error') {
                setIsChatLoading(false);
                botContent += "\n\n" + data.content;
                
                if (!messageAdded) {
                  setMessages(prev => [...prev, { role: 'bot', content: botContent }]);
                  setNewestBotIdx(newMessages.length);
                  messageAdded = true;
                } else {
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'bot', content: botContent };
                    return updated;
                  });
                }
              }
            } catch (e) {
              console.error("Error parsing stream JSON", e, dataStr);
            }
          }
        }
      }

      setMessages(prev => {
        const finalMessages = [...prev];
        if (finalMessages.length === 2) {
          updateSessionHistory(currentChatId, userMessage.substring(0, 30) + '...', finalMessages, 'chat');
        } else {
          updateSessionHistory(currentChatId, null, finalMessages, 'chat');
        }
        return finalMessages;
      });

    } catch (error) {
      console.error('Chat error:', error);
      setIsChatLoading(false);
      setMessages(prev => [...prev, { role: 'bot', content: 'Connection error. Make sure the backend server is running.' }]);
    }
  };

  const handleExplore = async (topicToExplore) => {
    if (!topicToExplore.trim() || isExploreLoading) return;
    
    setIsExploreLoading(true);
    setSuggestions([]);
    setCurrentAnswer('');

    const newPath = [...explorePath, topicToExplore];
    setExplorePath(newPath);

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = import.meta.env.VITE_API_URL || (isLocal ? '' : 'https://vedyam-backend.onrender.com');
      const response = await fetch(`${apiUrl}/api/explore_stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicToExplore, path: explorePath }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let explorerContent = '';
      let finalSuggestions = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'token') {
                setIsExploreLoading(false);
                explorerContent += data.content;
                setCurrentAnswer(explorerContent);
              } else if (data.type === 'suggestions') {
                finalSuggestions = data.content;
                setSuggestions(finalSuggestions);
              } else if (data.type === 'error') {
                setIsExploreLoading(false);
                explorerContent += "\n\n" + data.content;
                setCurrentAnswer(explorerContent);
              }
            } catch (e) {
              console.error("Error parsing explore stream JSON", e, dataStr);
            }
          }
        }
      }
      
      updateSessionHistory(currentExploreId, newPath[0], { path: newPath, answer: explorerContent, suggestions: finalSuggestions }, 'explorer');
      
    } catch (error) {
      console.error('Explore error:', error);
      setIsExploreLoading(false);
      setCurrentAnswer(prev => prev + "\\n\\nFailed to connect to the knowledge explorer.");
    } finally {
      setExploreTopic(''); 
    }
  };

  const updateSessionHistory = (id, newTitle, content, type) => {
    if (type === 'chat') {
      setChatSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], messages: content };
          if (newTitle) updated[existingIndex].title = newTitle;
          return updated;
        }
        return [{ id, title: newTitle || 'New Chat', messages: content }, ...prev];
      });
    } else {
      setExplorerSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...content };
          if (newTitle) updated[existingIndex].title = newTitle;
          return updated;
        }
        return [{ id, title: newTitle || 'Exploration', ...content }, ...prev];
      });
    }
  };

  const loadSession = (session, type) => {
    if (type === 'chat') {
      setActiveTab('chat');
      setCurrentChatId(session.id);
      setMessages(session.messages);
    } else {
      setActiveTab('explorer');
      setCurrentExploreId(session.id);
      setExplorePath(session.path);
      setCurrentAnswer(session.answer);
      setSuggestions(session.suggestions);
    }
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteSession = (e, id, type) => {
    e.stopPropagation();
    if (type === 'chat') {
      setChatSessions(prev => prev.filter(s => s.id !== id));
      if (currentChatId === id) startNewChat('chat');
    } else {
      setExplorerSessions(prev => prev.filter(s => s.id !== id));
      if (currentExploreId === id) startNewChat('explorer');
    }
  };

  const startNewChat = (targetTab = activeTab) => {
    if (targetTab === 'chat') {
      setCurrentChatId(Date.now());
      setMessages([]);
      setActiveTab('chat');
    } else {
      setCurrentExploreId(Date.now());
      setExploreTopic('');
      setExplorePath([]);
      setCurrentAnswer('');
      setSuggestions([]);
      setActiveTab('explorer');
    }
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <>
      {showIntro && <SplashScreen onComplete={() => setShowIntro(false)} />}
      <div className={`app-container ${theme}`}>
        {/* Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="dashboard-layout">
        
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="nav-btn" style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }} onClick={() => window.location.href = '/'} title="Return to Website">
            <ArrowLeft size={16} /> Return
          </button>
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="logo-container">
            <img src={tilakLogoImg} id="mobile-target-logo" className="sidebar-logo" alt="Tilak" />
            <h1>ShastraBot</h1>
          </div>
          <button className="icon-btn" onClick={() => startNewChat()}>
            <Plus size={24} />
          </button>
        </div>

        {/* Sidebar */}
        <aside className={`sidebar glass-panel ${!sidebarOpen ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <div className="logo-container">
              <img src={tilakLogoImg} id="desktop-target-logo" className="sidebar-logo" alt="Tilak" />
              <h1>ShastraBot</h1>
            </div>
            <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Close Sidebar">
              <PanelLeft size={20} />
            </button>
          </div>
          <div style={{ padding: '0 16px', marginBottom: '16px' }}>
            <button className="nav-btn" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border-color)', backgroundColor: 'transparent' }} onClick={() => window.location.href = '/'}>
              <ArrowLeft size={18} /> Return to Main Website
            </button>
          </div>

          <div className="sidebar-content">
            <button className="new-chat-btn" onClick={() => startNewChat()}>
              <Plus size={18} /> New {activeTab === 'chat' ? 'Chat' : 'Exploration'}
            </button>

            <nav className="sidebar-nav">
              <p className="nav-label">Features</p>
              <button 
                className={`nav-btn ${activeTab === 'chat' && messages.length === 0 ? 'active' : ''}`}
                onClick={() => startNewChat('chat')}
              >
                <MessageSquare size={18} /> Chat Home
              </button>
              <button 
                className={`nav-btn ${activeTab === 'explorer' && explorePath.length === 0 ? 'active' : ''}`}
                onClick={() => startNewChat('explorer')}
              >
                <Compass size={18} /> Explorer Home
              </button>

              {chatSessions.length > 0 && (
                <>
                  <p className="nav-label" style={{marginTop: '20px'}}>Chat History</p>
                  {chatSessions.map(session => (
                    <div key={session.id} className={`history-item ${currentChatId === session.id && activeTab === 'chat' ? 'active' : ''}`} onClick={() => loadSession(session, 'chat')}>
                      <MessageSquare size={16} className="history-icon" />
                      <span className="history-title">{session.title}</span>
                      <button className="delete-btn" onClick={(e) => deleteSession(e, session.id, 'chat')} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </>
              )}

              {explorerSessions.length > 0 && (
                <>
                  <p className="nav-label" style={{marginTop: '20px'}}>Explorer History</p>
                  {explorerSessions.map(session => (
                    <div key={session.id} className={`history-item ${currentExploreId === session.id && activeTab === 'explorer' ? 'active' : ''}`} onClick={() => loadSession(session, 'explorer')}>
                      <Compass size={16} className="history-icon" />
                      <span className="history-title">{session.title}</span>
                      <button className="delete-btn" onClick={(e) => deleteSession(e, session.id, 'explorer')} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button className="theme-toggle-sidebar" onClick={toggleTheme}>
              {theme === 'light' ? (
                <><Moon size={18} /> <span>Dark Mode</span></>
              ) : (
                <><Sun size={18} /> <span>Light Mode</span></>
              )}
            </button>
          </div>
        </aside>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

        {/* Main Content */}
        <main className="main-content">
          {!sidebarOpen && (
            <button className="floating-sidebar-btn" onClick={() => setSidebarOpen(true)} title="Open Sidebar">
              <PanelLeft size={20} />
            </button>
          )}
          
          {activeTab === 'chat' && (
            <div className="chat-layout">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><img src={tilakLogoImg} className="sidebar-logo large" alt="Tilak" /></div>
                  <h2>Wisdom from Hindu Scriptures</h2>
                  <p>Explore the profound teachings of the Bhagavad Gita, Vedas, and Upanishads.</p>
                  
                  <div className="suggestions-grid empty-cards">
                    <button className="card-btn" onClick={() => setInputValue('What is the true meaning of Dharma?')}>
                      <span className="card-icon">⚖️</span>
                      <div className="card-text">
                        <strong>Dharma</strong>
                        <span>What is its true meaning?</span>
                      </div>
                    </button>
                    <button className="card-btn" onClick={() => setInputValue('Explain the concept of Karma step by step')}>
                      <span className="card-icon">🔄</span>
                      <div className="card-text">
                        <strong>Karma</strong>
                        <span>Explain the concept step by step</span>
                      </div>
                    </button>
                    <button className="card-btn" onClick={() => setInputValue('Who is Lord Krishna in the Mahabharata?')}>
                      <span className="card-icon">🦚</span>
                      <div className="card-text">
                        <strong>Lord Krishna</strong>
                        <span>Who is He in the Mahabharata?</span>
                      </div>
                    </button>
                    <button className="card-btn" onClick={() => setInputValue('What do the Upanishads teach about the soul (Atman)?')}>
                      <span className="card-icon">✨</span>
                      <div className="card-text">
                        <strong>Atman</strong>
                        <span>What do the Upanishads teach?</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="scroll-container" ref={scrollContainerRef}>
                  <div className="messages-list">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`message-row ${msg.role}`}>
                        {msg.role === 'bot' && (
                          <div className="avatar bot-avatar"><img src={tilakLogoImg} className="sidebar-logo" alt="Tilak" /></div>
                        )}
                        <div className={`message-bubble ${msg.role}`}>
                          {msg.role === 'bot' ? (
                            <AnimatedBotMessage
                              content={msg.content}
                              isNew={false} // Disable fake typing since we are using real token streaming
                            />
                          ) : (
                            <div className="message-content">{msg.content}</div>
                          )}
                          {msg.role === 'bot' && (
                            <button className="copy-btn" onClick={() => handleCopy(msg.content, idx)} title="Copy message">
                              {copiedIndex === idx ? <Check size={14} color="#e8640c" /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="avatar user-avatar"><User size={16} /></div>
                        )}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="message-row bot">
                        <div className="avatar bot-avatar"><img src={tilakLogoImg} className="sidebar-logo" alt="Tilak" /></div>
                        <div className="message-bubble bot loading">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="input-area-wrapper">
                <div className="input-glass advanced-input">
                  <textarea 
                    placeholder="Ask about the scriptures..." 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                    rows={1}
                  />
                  <div className="input-actions">
                    <span className="hint-text">Press Enter to send, Shift+Enter for new line</span>
                    <button 
                      className={`send-btn ${inputValue.trim() ? 'active' : ''}`}
                      onClick={handleChatSend}
                      disabled={!inputValue.trim() || isChatLoading}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'explorer' && (
            <div className="explorer-layout">
              <div className="explorer-header-area">
                <div className="explorer-title">
                  <Compass size={24} style={{color: '#e8640c'}} />
                  <h2>Knowledge Explorer</h2>
                </div>
                <p>Build your own tree of wisdom by following interconnected concepts.</p>
                
                <div className="input-glass explorer-input advanced-input">
                  <input 
                    type="text" 
                    placeholder="e.g. Prana, Maya, Brahman..." 
                    value={exploreTopic}
                    onChange={(e) => setExploreTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExplore(exploreTopic)}
                  />
                  <button 
                    className={`send-btn ${exploreTopic.trim() ? 'active' : ''}`}
                    onClick={() => handleExplore(exploreTopic)}
                    disabled={!exploreTopic.trim() || isExploreLoading}
                  >
                    <Compass size={18} />
                  </button>
                  <button className="icon-btn reset-path-btn" onClick={() => startNewChat('explorer')} title="Reset Path">
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>

              <div className="scroll-container explorer-scroll">
                <div className="explorer-inner-wrapper">
                  {explorePath.length > 0 && (
                    <div className="breadcrumb glass-panel" ref={explorerTopRef}>
                      <span className="path-icon">🗺</span> 
                      {explorePath.map((p, i) => (
                        <span key={i}>
                          <span className="path-item">{p}</span>
                          {i < explorePath.length - 1 && <span className="path-arrow">›</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {isExploreLoading ? (
                    <div className="message-bubble bot loading explore-loading">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  ) : currentAnswer && (
                    <div className="explorer-results">
                      <div className="glass-panel answer-panel">
                        <div className="answer-content markdown-body">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentAnswer}</ReactMarkdown>
                        </div>
                      </div>

                      {suggestions.length > 0 && (
                        <div className="suggestions-container">
                          <h4>✦ Explore further</h4>
                          <div className="suggestions-grid">
                            {suggestions.map((s, i) => (
                              <button 
                                key={i} 
                                className="suggestion-btn glass-panel"
                                onClick={() => handleExplore(s)}
                              >
                                <div className="sugg-text">{s}</div>
                                <div className="sugg-arrow">→</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
        </main>
      </div>
    </div>
  </>
);
}

export default App;
