import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import { Analytics, Community, Resources, Settings, Notifications } from './components/PlaceholderPages';
import ChatbotUI from './components/ChatbotUI';

function App() {
  const [user, setUser] = useState({ username: 'Guest', email: 'guest@example.com', name: 'Guest' });

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/chatbot" element={<ChatbotUI />} />
        <Route path="/*" element={
          <Layout user={user} onLogout={() => window.location.href = '/'}>
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/community" element={<Community />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
