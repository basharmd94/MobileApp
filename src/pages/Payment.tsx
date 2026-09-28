import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  User, Hash, Calendar, TrendingUp, CreditCard, Banknote, 
  MessageSquare, AlertTriangle, CheckCircle2, Lock, Info, 
  XCircle, RefreshCw, Clock 
} from 'lucide-react';
import Header from '../components/ui/Header';
import { Button, ConfirmModal } from '../components';
import Toast from '../components/ui/Toast';
import { getBusinessName } from '../utils/business';
import { createCustomerPayment, OverpaymentErrorWrapper } from '../api_payment';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useToast } from '../hooks/useToast';
import { isOnOrAfterDay, isBeforeDay, isOnOrBeforeDay, isSameDay, humanizeDate, todayIso } from '../utils/dates';

// Helper function to calculate days late
const getDaysLate = (expectedDate: string, actualDate: string): number => {
  const expected = new Date(expectedDate);
  const actual = new Date(actualDate);
  const diffTime = Math.abs(actual.getTime() - expected.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const order = location.state?.order;
  const orderTotalAmount = order?.total_amount ?? order?.netamt;

  // ─── Lock state ──────────────────────────────────────────────────────────
  const isPaymentSubmitted = order?.xpaystatus === 'Send';
  const isLocked = isPaymentSubmitted;

  const [paymentDate, setPaymentDate] = useState(order?.xpaydate || todayIso());
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(orderTotalAmount?.toString() || '');
  const [bankDetail, setBankDetail] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { errorToast, successToast, showError, showSuccess } = useToast();

  const expectedPayDate = order?.xdatepay || null;
  const deliveryDate = order?.xdate || null;

  // ─── Check if payment is late ──────────────────────────────────────────
  const isLatePayment = useMemo(() => {
    if (!expectedPayDate || !paymentDate) return false;
    return isBeforeDay(expectedPayDate, paymentDate);
  }, [expectedPayDate, paymentDate]);

  const daysLate = useMemo(() => {
    if (!isLatePayment || !expectedPayDate || !paymentDate) return 0;
    return getDaysLate(expectedPayDate, paymentDate);
  }, [isLatePayment, expectedPayDate, paymentDate]);

  // ─── Validation ──────────────────────────────────────────────────────────
  const validation = useMemo(() => {
    if (!paymentDate) {
      return { ok: false, reason: 'Payment date is required.' };
    }
    if (!paymentType) {
      return { ok: false, reason: 'Please select a payment type.' };
    }
    const amount = Number(paymentAmount);
    if (!paymentAmount || Number.isNaN(amount) || amount <= 0) {
      return { ok: false, reason: 'Payment amount must be a positive number.' };
    }
    if (deliveryDate && isBeforeDay(paymentDate, deliveryDate)) {
      return {
        ok: false,
        reason: `Payment date cannot be earlier than the delivery date (${deliveryDate}).`,
      };
    }
    if (orderTotalAmount && amount > Number(orderTotalAmount)) {
      return {
        ok: false,
        reason: `Payment amount (৳${amount.toLocaleString()}) exceeds the DO total (৳${Number(orderTotalAmount).toLocaleString()}).`,
      };
    }
    return { ok: true, reason: '' };
  }, [paymentDate, paymentType, paymentAmount, deliveryDate, orderTotalAmount]);

  // ─── Error handlers ─────────────────────────────────────────────────────
  const handlePaymentError = (error: any) => {
    if (error instanceof OverpaymentErrorWrapper) {
      const { detail } = error;
      setPaymentError({
        type: 'overpayment',
        message: detail.message,
        details: detail,
      });
      showError(`Overpayment detected! You're trying to pay ৳${detail.overpaid_by.toLocaleString()} more than the remaining amount.`);
    } else if (error.response?.status === 403) {
      setPaymentError({
        type: 'version',
        message: 'Your app version is outdated. Please update to the latest version.',
      });
      showError('App version mismatch. Please update the application.');
    } else {
      const message = error.response?.data?.detail || error.message || 'An error occurred while submitting payment';
      setPaymentError({
        type: 'server',
        message: typeof message === 'string' ? message : JSON.stringify(message),
      });
      showError(typeof message === 'string' ? message : 'Failed to submit payment');
    }
  };

  const clearPaymentError = () => {
    setPaymentError(null);
  };

  const handleSubmit = () => {
    if (isLocked) return;
    if (!validation.ok) {
      showError(validation.reason);
      return;
    }
    clearPaymentError();
    setIsConfirmModalOpen(true);
  };

  const executeSubmit = async () => {
    if (!order) return;
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);
    clearPaymentError();

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
        // Show appropriate success message
        if (isLatePayment) {
          showSuccess(`⚠️ Late payment recorded! ${daysLate} days late. Payment successful!`);
        } else {
          showSuccess(response.message || 'Payment submitted successfully');
        }
        
        const details = [];
        if (response.xpmtnum) details.push(`Transaction: ${response.xpmtnum}`);
        if (response.xremaining !== undefined) details.push(`Remaining: ৳${Number(response.xremaining).toLocaleString()}`);
        if (response.xpaid_so_far !== undefined) details.push(`Total Paid: ৳${Number(response.xpaid_so_far).toLocaleString()}`);
        
        if (details.length > 0) {
          setTimeout(() => {
            showSuccess(`Payment successful! ${details.join(' • ')}`);
          }, 100);
        }
        
        setTimeout(() => {
          navigate('/delivery-orders');
        }, 2500);
      } else {
        showError(response.message || 'Failed to submit payment');
      }
    } catch (err: any) {
      handlePaymentError(err);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    clearPaymentError();
    handleSubmit();
  };

  // ─── Render error states ──────────────────────────────────────────────
  const renderPaymentError = () => {
    if (!paymentError) return null;

    if (paymentError.type === 'overpayment') {
      const details = paymentError.details;
      return (
        <div className="p-4 rounded-[16px] border border-error/30 bg-error/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 text-error" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[12px] font-bold text-error">Overpayment Detected</h4>
              <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                This payment would exceed the DO total amount.
              </p>
              {details && (
                <div className="mt-2 p-3 bg-bg-card rounded-lg border border-ui-border space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-text-secondary">DO Total:</span>
                    <span className="font-bold text-text-main">৳{details.do_total_amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-text-secondary">Already Paid:</span>
                    <span className="font-bold text-text-main">৳{details.already_paid?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-text-secondary">This Payment:</span>
                    <span className="font-bold text-error">৳{details.this_payment?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] pt-1 border-t border-ui-border">
                    <span className="text-text-secondary">Overpaid By:</span>
                    <span className="font-bold text-error">৳{details.overpaid_by?.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearPaymentError}
                  className="text-[11px]"
                >
                  Adjust Amount
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRetry}
                  className="text-[11px]"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (paymentError.type === 'version') {
      return (
        <div className="p-4 rounded-[16px] border border-amber-300 bg-amber-50">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-[12px] font-bold text-amber-800">App Version Mismatch</h4>
              <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                {paymentError.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-2 text-[11px]"
              >
                Refresh App
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-[16px] border border-error/30 bg-error/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-[12px] font-bold text-error">Payment Error</h4>
            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
              {paymentError.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2 text-[11px]"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
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
        {/* Order Summary */}
        <div className="bg-primary-light/15 backdrop-blur-sm border border-primary-light rounded-[16px] p-3.5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-primary bg-primary-light/50 px-2 py-0.5 rounded-full border border-primary-light">
                  {order.zid} - {getBusinessName(order.zid)}
                </span>
                {isPaymentSubmitted && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700">
                    <Lock className="w-2.5 h-2.5" />Paid
                  </span>
                )}
              </div>
              <h3 className="text-[13px] font-bold text-text-main flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />{order.xshort || order.xcus}
              </h3>
              <p className="text-[10px] text-text-muted ml-5">{order.xadd1}</p>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-success bg-success/10 px-2 py-1 rounded-lg border border-success/20 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />৳{orderTotalAmount?.toLocaleString()}
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
            {expectedPayDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] font-medium text-text-secondary">
                  Expected Pay Date:{' '}
                  <span className={`font-bold ${isBeforeDay(expectedPayDate, todayIso()) ? 'text-error' : 'text-text-main'}`}>
                    {expectedPayDate}
                    {isSameDay(expectedPayDate, todayIso()) && ' (Today)'}
                    {isBeforeDay(expectedPayDate, todayIso()) && ' (Past Due)'}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hint Card */}
        {!isPaymentSubmitted && (
          <div className="bg-blue-50/60 border border-blue-100 rounded-[14px] p-3 shadow-sm flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-blue-900">When can the customer pay?</p>
              <p className="text-[10px] text-blue-800/80 leading-snug mt-0.5">
                {expectedPayDate ? (
                  <>
                    Any time <b>on or before {expectedPayDate}</b>
                    {isBeforeDay(expectedPayDate, todayIso())
                      ? ' (already past — please collect as soon as possible).'
                      : isSameDay(expectedPayDate, todayIso())
                        ? ' (today is the last day).'
                        : ' (customer can pay early).'}
                    {' '}You can also record late payments after the expected date.
                  </>
                ) : (
                  <>The expected pay date has not been set yet. Use the <b>Pay Date</b> action on the delivery order to set it first.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Late Payment Warning Banner */}
        {isLatePayment && validation.ok && !isLocked && (
          <div className="p-4 rounded-[16px] border border-amber-300 bg-amber-50/80 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-[12px] font-bold text-amber-800">⚠️ Late Payment</h4>
                <p className="text-[10px] text-amber-700 leading-relaxed mt-0.5">
                  This payment is being recorded <b>{daysLate} days</b> after the expected date ({expectedPayDate}).
                  Please confirm with the customer that this is correct.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Error Display */}
        {paymentError && renderPaymentError()}

        {/* Payment Form */}
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
                disabled={isLocked || isSubmitting}
                min={deliveryDate || undefined}
                // REMOVED: max={expectedPayDate || undefined} - Now allows late payments
                className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all text-text-main appearance-none disabled:opacity-60"
              />
              {expectedPayDate && !isLocked && (
                <p className="text-[9.5px] mt-1 ml-1">
                  {!isLatePayment ? (
                    <span className="text-text-muted">
                      Allowed from: <b>{deliveryDate || '—'}</b> to <b>{expectedPayDate}</b> (customer's promise)
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      ⚠️ Late payment — expected date was {expectedPayDate} ({daysLate} days late)
                    </span>
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                <Banknote className="w-3.5 h-3.5 text-purple-500" />Payment Type <span className="text-error">*</span>
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                disabled={isLocked || isSubmitting}
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
                max={orderTotalAmount || undefined}
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  clearPaymentError();
                }}
                disabled={isLocked || isSubmitting}
                className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all text-text-main appearance-none disabled:opacity-60"
                placeholder="Enter amount"
              />
              {orderTotalAmount && (
                <p className="text-[9.5px] text-text-muted mt-1 ml-1">
                  DO Total: ৳{Number(orderTotalAmount).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />Bank Details <span className="text-text-secondary">(optional)</span>
              </label>
              <input
                type="text"
                value={bankDetail}
                onChange={(e) => setBankDetail(e.target.value)}
                disabled={isLocked || isSubmitting}
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
                disabled={isLocked || isSubmitting}
                rows={3}
                className="w-full px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition-all text-text-main resize-none disabled:opacity-60"
                placeholder="Any additional notes"
              />
            </div>

            {/* Live Validation Feedback */}
            {!validation.ok && (paymentDate || paymentType || paymentAmount) && (
              <div className="p-2.5 rounded-[12px] border border-error/30 bg-error/5 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium text-error leading-snug">{validation.reason}</p>
              </div>
            )}

            {/* Summary Preview */}
            {(paymentDate || paymentType || paymentAmount || bankDetail || remarks) && (
              <div className="mt-3 p-3 bg-bg-base rounded-lg border border-ui-border space-y-2">
                {paymentDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5"><Calendar className="w-3 h-3 text-primary" />Payment Date</span>
                    <span className="text-[11px] font-bold text-teal-600">
                      {paymentDate} 
                      {isLatePayment && (
                        <span className="text-amber-500 ml-1 text-[9px]">(Late)</span>
                      )}
                      <span className="text-text-muted font-normal ml-1">({humanizeDate(paymentDate)})</span>
                    </span>
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

        {/* Footer Info */}
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

      {/* Submit Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-card border-t border-ui-border shadow-[0_-4px_10px_rgb(0,0,0,0.02)] z-10 w-full md:max-w-3xl md:mx-auto">
        <Button
          variant={isLocked ? 'outline' : 'primary'}
          size="lg"
          className={`w-full ${!isLocked && validation.ok && !paymentError ? 'shadow-lg shadow-primary/20' : ''}`}
          onClick={handleSubmit}
          disabled={isLocked || !validation.ok || isSubmitting || !!paymentError}
          isLoading={isSubmitting}
        >
          {isLocked ? (
            <><Lock className="w-3.5 h-3.5 mr-1.5" />Payment Already Submitted</>
          ) : paymentError ? (
            <><AlertTriangle className="w-3.5 h-3.5 mr-1.5" />Fix Issues Above</>
          ) : isLatePayment ? (
            <><Clock className="w-3.5 h-3.5 mr-1.5" />Submit Late Payment ({daysLate} days late)</>
          ) : (
            'Submit Payment'
          )}
        </Button>
        
        {isLatePayment && !isLocked && (
          <p className="text-[10px] text-amber-600 text-center mt-2 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" /> This is a late payment. Please verify with the customer before submitting.
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={isLatePayment ? "⚠️ Confirm Late Payment" : "Confirm Payment"}
        message={
          isLatePayment 
            ? `⚠️ This is a LATE payment (${daysLate} days late).\n\nSubmit payment of ৳${Number(paymentAmount).toLocaleString()} for order ${order.xdornum}?\n\nExpected date was: ${expectedPayDate}\nActual payment date: ${paymentDate}`
            : `Submit payment of ৳${Number(paymentAmount).toLocaleString()} for order ${order.xdornum}?`
        }
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={executeSubmit}
        isProcessing={isSubmitting}
      />
      <Toast error={errorToast} success={successToast} />
    </div>
  );
}