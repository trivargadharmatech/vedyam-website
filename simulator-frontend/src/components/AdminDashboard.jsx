import React, { useState, useEffect } from 'react';
import { getApiBase } from '../api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [data, setData] = useState({ users: [], enrollments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(getApiBase() + '/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch admin data or unauthorized');
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading admin dashboard...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard-container">
      <div className="glass-panel admin-panel">
        <h1>Platform Admin Dashboard</h1>
        
        <div className="admin-stats-row">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{data.users.length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Enrollments</h3>
            <p>{data.enrollments.length}</p>
          </div>
          <div className="stat-card">
            <h3>Completed Courses</h3>
            <p>{data.enrollments.filter(e => e.completed).length}</p>
          </div>
        </div>

        <div className="admin-table-section">
          <h2>User Database</h2>
          <div className="table-responsive">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Enrollments</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(user => {
                  const userEnrollments = data.enrollments.filter(e => e.user_id === user.id);
                  return (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{userEnrollments.length}</td>
                      <td>{new Date(user.created_at * 1000).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
