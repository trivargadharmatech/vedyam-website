import { getApiBase } from '../api';
import React, { useState, useEffect } from 'react';
import { BookOpen, Key, User, ArrowRight, Sparkles } from 'lucide-react';
import ChariotScene from './ChariotScene';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState([]);

  // Generate random particles for the spiritual/mental aura effect
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: (Math.random() * 10 + 10) + 's',
      animationDelay: (Math.random() * 5) + 's',
      size: Math.random() * 6 + 2 + 'px',
      opacity: Math.random() * 0.5 + 0.3
    }));
    setParticles(newParticles);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          onLogin(data);
        } else {
          // Auto-login after register
          const loginRes = await fetch(getApiBase() + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok) onLogin(loginData);
        }
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to server. Is backend.py running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-epic-container">
      {/* SVG Animated Scene */}
      <ChariotScene />

      {/* The Premium Login Card */}
      <div className="login-epic-card animate-on-scroll visible">
        <div className="card-header">
          <div className="epic-logo-wrapper">
            <BookOpen size={36} className="text-gold" />
          </div>
          <h1 className="brand-name text-shadow">Vedyam<span>AI</span></h1>
          <p className="tagline text-shadow">Awaken your mind. Journey through ancient wisdom.</p>
        </div>

        <div className="card-body">
          <h2 className="form-title text-shadow">
            {isLogin ? 'Begin Your Quest' : 'Join the Epic'}
            <Sparkles size={20} className="inline-icon" />
          </h2>
          
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="input-group-modern">
              <label className="text-shadow">Username</label>
              <div className="input-wrapper">
                <User size={18} className="icon" />
                <input 
                  type="text" 
                  placeholder="Enter your username" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="epic-input"
                />
              </div>
            </div>
            
            <div className="input-group-modern">
              <label className="text-shadow">Password</label>
              <div className="input-wrapper">
                <Key size={18} className="icon" />
                <input 
                  type="password" 
                  placeholder="Enter your password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="epic-input"
                />
              </div>
            </div>

            {error && <div className="error-message-modern">{error}</div>}

            <button type="submit" className="btn-epic-primary" disabled={loading}>
              <span className="btn-text">{loading ? 'Focusing...' : (isLogin ? 'Enter Realm' : 'Sign Up')}</span>
              {!loading && <ArrowRight size={18} className="btn-icon" />}
            </button>
          </form>
        </div>

        <div className="card-footer" style={{ borderTopColor: 'rgba(255,255,255,0.2)' }}>
          <p className="toggle-text" style={{ color: '#e2e8f0' }}>
            {isLogin ? "A new seeker?" : "Already awakened?"}
            <button type="button" className="btn-text-link" onClick={() => setIsLogin(!isLogin)} style={{ color: '#38bdf8' }}>
              {isLogin ? 'Start your journey' : 'Return to realm'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
