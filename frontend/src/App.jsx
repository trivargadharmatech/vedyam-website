import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import { Analytics, Community, Resources, Settings, Notifications } from './components/PlaceholderPages';

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      {!user ? (
        <Login onLogin={(userData) => setUser(userData)} />
      ) : (
        <Layout user={user} onLogout={() => setUser(null)}>
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
      )}
    </BrowserRouter>
  );
}

export default App;
