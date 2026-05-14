import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import BusinessSelect from './pages/BusinessSelect';
import HMBR from './pages/HMBR';
import GI from './pages/GI';
import Zepto from './pages/Zepto';
import OrderHistory from './pages/OrderHistory';
import RecVoucher from './pages/RecVoucher';
import Feedback from './pages/Feedback';
import CancelledOrders from './pages/CancelledOrders';
import DeliveryOrders from './pages/DeliveryOrders';
import PayDate from './pages/PayDate';
import SalesReturn from './pages/SalesReturn';

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
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
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
        <Route path="/all-pending-orders" element={
          <ProtectedRoute>
            <OrderHistory type="pending" />
          </ProtectedRoute>
        } />
        <Route path="/all-confirmed-orders" element={
          <ProtectedRoute>
            <OrderHistory type="confirmed" />
          </ProtectedRoute>
        } />
        <Route path="/rec-voucher" element={
          <ProtectedRoute>
            <RecVoucher />
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        } />
        <Route path="/cancelled-orders" element={
          <ProtectedRoute>
            <OrderHistory type="cancelled" />
          </ProtectedRoute>
        } />
        <Route path="/delivery-orders" element={
          <ProtectedRoute>
            <DeliveryOrders />
          </ProtectedRoute>
        } />
        <Route path="/pay-date" element={
          <ProtectedRoute>
            <PayDate />
          </ProtectedRoute>
        } />
        <Route path="/sales-return" element={
          <ProtectedRoute>
            <SalesReturn />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}