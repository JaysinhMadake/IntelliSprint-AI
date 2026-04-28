import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MembersPage from './pages/MembersPage';
import TimelinePage from './pages/TimelinePage';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await api.get('/check');
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-dark text-white text-2xl">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={checkAuth} /> : <Navigate to="/projects" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/projects" />} />
        
        <Route element={user ? <Layout user={user} /> : <Navigate to="/login" />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/dashboard/:projectId" element={<DashboardPage />} />
          <Route path="/analytics/:projectId" element={<AnalyticsPage />} />
          <Route path="/members/:projectId" element={<MembersPage />} />
          <Route path="/timeline/:projectId" element={<TimelinePage />} />
        </Route>

        <Route path="/" element={<Navigate to={user ? "/projects" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
