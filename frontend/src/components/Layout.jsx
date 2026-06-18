import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, User, Settings, Bell, ChevronDown, Share2, Globe, MessageSquare, Link as LinkIcon } from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

const Layout = ({ children, user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="global-layout">
      <div className="login-modern-background" style={{ position: 'fixed' }}>
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
      
      <div className="layout-content-wrapper" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Global Header */}
        <header className="global-header glass-effect">
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="header-logo" style={{ textDecoration: 'none' }}>
              <div className="logo-icon-small">
                <BookOpen size={20} />
              </div>
              <span className="logo-text">Vedyam<span style={{color: 'var(--accent-gold)'}}>AI</span></span>
            </Link>
            <nav className="header-nav">
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>Simulator</NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Analytics</NavLink>
              <NavLink to="/community" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Community</NavLink>
              <NavLink to="/resources" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Resources</NavLink>
            </nav>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <NavLink to="/notifications" className="icon-btn" style={({ isActive }) => isActive ? { color: 'var(--accent-gold)' } : {}}><Bell size={18} /></NavLink>
              <NavLink to="/settings" className="icon-btn" style={({ isActive }) => isActive ? { color: 'var(--accent-gold)' } : {}}><Settings size={18} /></NavLink>
            </div>
            {user && (
              <div className="user-profile-dropdown">
                <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
                <span className="username">{user.username}</span>
                <ChevronDown size={14} style={{color: 'var(--text-muted)'}}/>
                <div className="dropdown-menu">
                  <button onClick={handleLogout} className="dropdown-item">Log Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="global-main-content">
        {children}
      </main>

      {/* Global Footer */}
      <footer className="global-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="header-logo" style={{marginBottom: '1rem'}}>
                <div className="logo-icon-small">
                  <BookOpen size={20} />
                </div>
                <span className="logo-text">Vedyam<span style={{color: 'var(--accent-gold)'}}>AI</span></span>
              </div>
              <p className="footer-desc">Empowering the next generation of learners with personalized, AI-driven educational journeys based on ancient wisdom and modern science.</p>
            </div>
            
            <div className="footer-links-group">
              <h4>Platform</h4>
              <a href="#">Learning Simulator</a>
              <a href="#">Knowledge Graph</a>
              <a href="#">Langflow Integrations</a>
              <a href="#">Pricing</a>
            </div>
            
            <div className="footer-links-group">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
              <a href="#">Blog</a>
            </div>
            
            <div className="footer-links-group">
              <h4>Legal</h4>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="copyright">
              &copy; {new Date().getFullYear()} Vedyam AI. All rights reserved.
            </div>
            <div className="social-links">
              <a href="#" className="social-icon"><Share2 size={18}/></a>
              <a href="#" className="social-icon"><MessageSquare size={18}/></a>
              <a href="#" className="social-icon"><Globe size={18}/></a>
              <a href="#" className="social-icon"><LinkIcon size={18}/></a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Layout;
