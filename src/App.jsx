import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Rewards from './pages/Rewards';
import Ledger from './pages/Ledger';
import Seed from './pages/Seed';

function WithNav({ children }) {
  return <><Navbar />{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><WithNav><Home /></WithNav></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><WithNav><Upload /></WithNav></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><WithNav><Dashboard /></WithNav></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><WithNav><Leaderboard /></WithNav></ProtectedRoute>} />
          <Route path="/rewards" element={<ProtectedRoute><WithNav><Rewards /></WithNav></ProtectedRoute>} />
          <Route path="/ledger" element={<ProtectedRoute><WithNav><Ledger /></WithNav></ProtectedRoute>} />
          <Route path="/seed" element={<ProtectedRoute><WithNav><Seed /></WithNav></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
