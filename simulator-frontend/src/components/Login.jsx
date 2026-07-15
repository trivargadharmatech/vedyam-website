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

  const handleGoogleOTP = async () => {
    const email = window.prompt('Enter your Gmail address to sign in with Google:');
    if (!email) return;
    
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(getApiBase() + '/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request OTP');
      
      const otp = window.prompt(`OTP sent to ${email}!\\nPlease check your inbox and enter the 6-digit code:`);
      if (!otp) { setLoading(false); return; }
      
      const verifyRes = await fetch(getApiBase() + '/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Invalid OTP');
      
      onLogin(verifyData);
    } catch (err) {
      setError(err.message);
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
            
            <div style={{ margin: '20px 0', textAlign: 'center', color: '#94a3b8' }}>OR</div>
            <button 
              type="button" 
              className="btn-epic-primary" 
              onClick={handleGoogleOTP}
              style={{ background: 'white', color: 'black' }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '8px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="btn-text">Sign in with Google</span>
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
