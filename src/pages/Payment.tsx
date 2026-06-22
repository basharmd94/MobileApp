import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Hash, Calendar, TrendingUp, CreditCard, Banknote, MessageSquare } from 'lucide-react';
import Header from '../components/ui/Header';
import { Button, ConfirmModal } from '../components';
import Toast from '../components/ui/Toast';
import { getBusinessName } from '../utils/business';
import { createCustomerPayment } from '../api_payment';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useToast } from '../hooks/useToast';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const order = location.state?.order;

  const [paymentDate, setPaymentDate] = useState(order?.xdatepay || '');
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(order?.netamt?.toString() || '');
  const [bankDetail, setBankDetail] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { errorToast, successToast, showError, showSuccess } = useToast();

  const isAlreadySubmitted = Boolean(order?.xdatepay || order?.xpaystatus === 'Send');

  const handleSubmit = () => {
    if (isAlreadySubmitted) return;
    if (!paymentDate || !paymentType || !paymentAmount.trim()) {
      showError('Please fill out all required fields.');
      return;
    }
    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      showError('Payment amount must be a positive number.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const executeSubmit = async () => {
    if (!order) return;
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);

    try {
      const payload = {
        zid: order.zid,
        xdornum: order.xdornum,
        xcus: order.xcus || '',
        xshort: order.xshort || '',
        xemp: user?.user_id || '',
        xname: user?.username || '',
        xpayamt: Number(paymentAmount),
        xpaydate: paymentDate,
        xpaytype: paymentType,
        xbankdetail: bankDetail,
        xremarks: remarks,
        xpaystatus: 'Send',
      };

      const response = await createCustomerPayment(payload);
      if (response.success) {
        showSuccess(response.message || 'Payment submitted successfully');
        setTimeout(() => {
          navigate('/delivery-orders');
        }, 2000);
      } else {
        showError(response.message || 'Failed to submit payment');
      }
    } catch (err: any) {
      console.error('Payment submit failed:', err);
      showError(err.response?.data?.detail || err.message || 'An error occurred while submitting payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center p-4 bg-bg-base">
        <p className="text-text-secondary">No order data provided.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      <Header title="Payment" bgColor="bg-bg-card" />

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-28 space-y-4">
        <div className="bg-primary-light/15 backdrop-blur-sm border border-primary-light rounded-[16px] p-3.5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-primary bg-primary-light/50 px-2 py-0.5 rounded-full border border-primary-light">
                  {order.zid} - {getBusinessName(order.zid)}
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-text-main flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />{order.xshort || order.xcus}
              </h3>
              <p className="text-[10px] text-text-muted ml-5">{order.xadd1}</p>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-success bg-success/10 px-2 py-1 rounded-lg border border-success/20 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />৳{order.netamt?.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 p-2.5 bg-bg-card/80 rounded-[12px] border border-primary-light/30">
            <div className="flex justify-between">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span className="text-[10px] font-medium text-text-secondary truncate">
                  DO: <span className="font-bold text-text-main">{order.xdornum}</span>
                </span>
              </div>
              {order.xdate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="text-[10px] font-medium text-text-secondary">{order.xdate}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-text-secondary">Payment Status: <span className="font-bold text-text-main">{order.xpaystatus || 'Pending'}</span></span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-ui-border rounded-[16px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="text-[12px] font-bold text-text-main">Payment Details</h3>
          </div>

          <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                  <Calendar className="w-3.5 h-3.5 text-primary/70" />Payment Date <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={isAlreadySubmitted || isSubmitting}
                  className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all text-text-main appearance-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                  <Banknote className="w-3.5 h-3.5 text-purple-500" />Payment Type <span className="text-error">*</span>
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  disabled={isAlreadySubmitted || isSubmitting}
                  className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-text-main appearance-none disabled:opacity-60"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2394A3B8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px' }}
                >
                  <option value="">Select payment type</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-500" />Payment Amount <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={isAlreadySubmitted || isSubmitting}
                  className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all text-text-main appearance-none disabled:opacity-60"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />Bank Details <span className="text-text-secondary">(optional)</span>
                </label>
                <input
                  type="text"
                  value={bankDetail}
                  onChange={(e) => setBankDetail(e.target.value)}
                  disabled={isAlreadySubmitted || isSubmitting}
                  className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all text-text-main appearance-none disabled:opacity-60"
                  placeholder="Enter bank name, branch, or reference"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />Remarks <span className="text-text-secondary">(optional)</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={isAlreadySubmitted || isSubmitting}
                  rows={3}
                  className="w-full px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all text-text-main resize-none disabled:opacity-60"
                  placeholder="Any additional notes"
                />
              </div>
              {(paymentDate || paymentType || paymentAmount || bankDetail || remarks) && (
                <div className="mt-3 p-3 bg-bg-base rounded-lg border border-ui-border space-y-2">
                  {paymentDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5"><Calendar className="w-3 h-3 text-primary" />Payment Date</span>
                      <span className="text-[11px] font-bold text-teal-600">{paymentDate}</span>
                    </div>
                  )}
                  {paymentType && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5"><Banknote className="w-3 h-3 text-purple-500" />Payment Type</span>
                      <span className="text-[11px] font-bold text-purple-600">{paymentType}</span>
                    </div>
                  )}
                  {paymentAmount && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-teal-600" />Amount</span>
                      <span className="text-[11px] font-bold text-teal-600">৳{Number(paymentAmount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>

        <div className="bg-teal-50/50 border border-teal-100 rounded-[16px] p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-medium text-text-secondary">Customer Code</span>
              <p className="text-[12px] font-bold text-teal-700 mt-0.5">{order.xcus}</p>
            </div>
            <div>
              <span className="text-[10px] font-medium text-text-secondary">Employee</span>
              <p className="text-[12px] font-bold text-text-main mt-0.5">{user?.username || 'N/A'}</p>
            </div>
          </div>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-card border-t border-ui-border shadow-[0_-4px_10px_rgb(0,0,0,0.02)] z-10 w-full md:max-w-3xl md:mx-auto">
        <Button
          variant={isAlreadySubmitted ? 'outline' : 'primary'}
          size="lg"
          className={`w-full ${!isAlreadySubmitted ? 'shadow-lg shadow-primary/20' : ''}`}
          onClick={handleSubmit}
          disabled={isAlreadySubmitted || !paymentDate || !paymentType || !paymentAmount || isSubmitting}
          isLoading={isSubmitting}
        >
          {isAlreadySubmitted ? 'Payment Already Submitted' : 'Submit Payment'}
        </Button>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirm Payment"
        message={`Submit payment for order ${order.xdornum}?`}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={executeSubmit}
        isProcessing={isSubmitting}
      />
      <Toast error={errorToast} success={successToast} />
    </div>
  );
}
