import React, { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import OrderPage from './pages/OrderPage';
import OrderHistory from './pages/OrderHistory';
import RecVoucher from './pages/RecVoucher';
import Feedback from './pages/Feedback';
import DeliveryOrders from './pages/DeliveryOrders';
import PayDate from './pages/PayDate';
import SalesReturn from './pages/SalesReturn';
import ReturnList from './pages/ReturnList';
import { ConfirmModal } from './components/ui/ConfirmModal';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    // Only the native Android shell should intercept hardware back presses.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const isRootRoute = location.pathname === '/' || location.pathname === '/login';

      // Let users dismiss the confirmation modal with the same hardware button.
      if (showExitModal) {
        setShowExitModal(false);
        return;
      }

      // Navigate through in-app history before considering an app exit.
      if (!isRootRoute) {
        if (canGoBack) {
          navigate(-1);
        } else {
          navigate('/', { replace: true });
        }
        return;
      }

      // Only ask to exit when the user is already at the root level.
      setShowExitModal(true);
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [location.pathname, navigate, showExitModal]);

  const handleCloseExitModal = () => {
    setShowExitModal(false);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    CapacitorApp.exitApp();
  };

  return (
    <>
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
            <OrderPage />
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
        <Route path="/return-list" element={
          <ProtectedRoute>
            <ReturnList />
          </ProtectedRoute>
        } />
      </Routes>
      <ConfirmModal
        isOpen={showExitModal}
        title="Exit App"
        message="Are you sure you want to exit the app?"
        onConfirm={handleConfirmExit}
        onCancel={handleCloseExitModal}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
