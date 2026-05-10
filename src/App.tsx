import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import BusinessSelect from './pages/BusinessSelect';
import HMBR from './pages/HMBR';
import GI from './pages/GI';

import Zepto from './pages/Zepto';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/add" element={
          <ProtectedRoute>
            <BusinessSelect />
          </ProtectedRoute>
        } />
        <Route path="/hmbr" element={
          <ProtectedRoute>
            <HMBR />
          </ProtectedRoute>
        } />
        <Route path="/gi" element={
          <ProtectedRoute>
            <GI />
          </ProtectedRoute>
        } />
        <Route path="/zepto" element={
          <ProtectedRoute>
            <Zepto />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
