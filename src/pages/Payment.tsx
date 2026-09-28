import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  User, Hash, Calendar, TrendingUp, CreditCard, Banknote, 
  MessageSquare, AlertTriangle, Lock, Clock
} from 'lucide-react';
import Header from '../components/ui/Header';
import { Button, ConfirmModal } from '../components';
import Toast from '../components/ui/Toast';
import { getBusinessName } from '../utils/business';
import { createCustomerPayment, getCustomerPayments, OverpaymentErrorWrapper, CustomerPaymentInfo } from '../api_payment';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useToast } from '../hooks/useToast';
import { isBeforeDay, isSameDay, humanizeDate, todayIso } from '../utils/dates';

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
  const initialTotalAmount = Number(order?.total_amount ?? order?.grossamt ?? order?.netamt ?? 0);
  const initialRemainingDue = Number(order?.remaining_due ?? initialTotalAmount);

  // ─── Lock state ──────────────────────────────────────────────────────────
  const isPaymentSubmitted = order?.xpaystatus === 'Send';
  const isLocked = isPaymentSubmitted;

  const [paymentDate, setPaymentDate] = useState(order?.xpaydate || todayIso());
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(String(initialRemainingDue));
  const [orderTotalAmount, setOrderTotalAmount] = useState(initialTotalAmount);
  const [paidAmount, setPaidAmount] = useState(Number(order?.paid_amount ?? 0));
  const [remainingDue, setRemainingDue] = useState(initialRemainingDue);
  const [paymentHistory, setPaymentHistory] = useState<CustomerPaymentInfo[]>([]);
  const [paymentHistoryTotal, setPaymentHistoryTotal] = useState(0);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(true);
  const paymentAmountTouched = useRef(false);
  const [bankDetail, setBankDetail] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { errorToast, successToast, showError, showSuccess } = useToast();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const expectedPayDate = order?.xdatepay || null;
  const deliveryDate = order?.xdate || null;

  const loadPaymentHistory = useCallback(async (offset = 0, append = false) => {
    if (order?.zid === undefined || !order?.xdornum) return;
    setPaymentHistoryLoading(true);
    try {
      const response = await getCustomerPayments({
        zid: order.zid,
        xdornum: order.xdornum,
        limit: 20,
        offset,
      });
      setPaymentHistory((current) => append ? [...current, ...response.data] : response.data);
      setPaymentHistoryTotal(response.total);

      if (offset === 0) {
        const totalAmount = Number(response.do_total_amount ?? order.total_amount ?? order.grossamt ?? order.netamt ?? 0);
        const totalPaid = Number(response.paid_amount ?? order.paid_amount ?? 0);
        const due = Number(response.remaining_due ?? order.remaining_due ?? Math.max(totalAmount - totalPaid, 0));
        setOrderTotalAmount(totalAmount);
        setPaidAmount(totalPaid);
        setRemainingDue(due);
        if (!paymentAmountTouched.current) setPaymentAmount(String(due));
      }
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : detail?.message || error.message || 'Unable to load payment history';
      showErrorRef.current(message);
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, [order?.zid, order?.xdornum, order?.grossamt, order?.total_amount, order?.netamt, order?.paid_amount, order?.remaining_due]);

  useEffect(() => {
    paymentAmountTouched.current = false;
    void loadPaymentHistory(0);
  }, [loadPaymentHistory]);

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
    if (remainingDue <= 0) {
      return { ok: false, reason: 'This delivery order has no remaining balance.' };
    }
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
    if (amount > remainingDue) {
      return {
        ok: false,
        reason: `Payment amount (৳${amount.toLocaleString()}) exceeds the remaining due (৳${remainingDue.toLocaleString()}).`,
      };
    }
    return { ok: true, reason: '' };
  }, [paymentDate, paymentType, paymentAmount, deliveryDate, remainingDue]);

  const handlePaymentError = (error: any) => {
    if (error instanceof OverpaymentErrorWrapper) {
      const { detail } = error;
      setOrderTotalAmount(detail.do_total_amount);
      setPaidAmount(detail.already_paid);
      setRemainingDue(Math.max(detail.do_total_amount - detail.already_paid, 0));
      showError(`${detail.message} Remaining due: ৳${Math.max(detail.do_total_amount - detail.already_paid, 0).toLocaleString()}.`);
    } else if (error.response?.status === 403) {
      showError('App version mismatch. Please update the application.');
    } else {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : detail?.message || error.message || 'An error occurred while submitting payment';
      showError(message);
    }
  };

  const handleSubmit = () => {
    if (isLocked) return;
    if (!validation.ok) {
      showError(validation.reason);
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
        const nextRemainingDue = Number(response.xremaining ?? Math.max(remainingDue - Number(paymentAmount), 0));
        const nextPaidAmount = Number(response.xpaid_so_far ?? paidAmount + Number(paymentAmount));
        setRemainingDue(nextRemainingDue);
        setPaidAmount(nextPaidAmount);
        if (response.xtotamt !== undefined) setOrderTotalAmount(Number(response.xtotamt));
        void loadPaymentHistory(0);

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
        
      } else {
        showError(response.message || 'Failed to submit payment');
      }
    } catch (err: any) {
      handlePaymentError(err);
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
            <div className="flex justify-between text-[10px] font-medium text-text-secondary">
              <span>Paid: <b className="text-text-main">৳{paidAmount.toLocaleString()}</b></span>
              <span>Remaining due: <b className={remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>৳{remainingDue.toLocaleString()}</b></span>
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

        <section className="bg-bg-card border border-ui-border rounded-[16px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-bold text-text-main">Payment History</h3>
            <span className="text-[10px] text-text-muted">{paymentHistoryTotal} payment{paymentHistoryTotal === 1 ? '' : 's'}</span>
          </div>
          {paymentHistoryLoading && paymentHistory.length === 0 ? (
            <p className="text-[11px] text-text-muted">Loading payment history...</p>
          ) : paymentHistory.length === 0 ? (
            <p className="text-[11px] text-text-muted">No payments recorded for this delivery order.</p>
          ) : (
            <div className="divide-y divide-ui-border">
              {paymentHistory.map((payment) => (
                <div key={payment.xpmtnum} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-text-main">{payment.xpmtnum}</p>
                    <p className="text-[10px] text-text-muted">{payment.xpaydate} · {payment.xpaytype} · {payment.xpaystatus}</p>
                    {payment.xremarks && <p className="text-[10px] text-text-secondary mt-0.5 break-words">{payment.xremarks}</p>}
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-emerald-700">৳{Number(payment.xpayamt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          {paymentHistory.length < paymentHistoryTotal && (
            <button
              type="button"
              onClick={() => void loadPaymentHistory(paymentHistory.length, true)}
              disabled={paymentHistoryLoading}
              className="mt-3 w-full py-2 text-[11px] font-bold text-primary disabled:opacity-50"
            >
              {paymentHistoryLoading ? 'Loading...' : 'Load more payments'}
            </button>
          )}
        </section>

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
                max={remainingDue}
                value={paymentAmount}
                onChange={(e) => {
                  paymentAmountTouched.current = true;
                  setPaymentAmount(e.target.value);
                }}
                disabled={isLocked || isSubmitting || remainingDue <= 0}
                className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all text-text-main appearance-none disabled:opacity-60"
                placeholder="Enter amount"
              />
              <p className="text-[9.5px] text-text-muted mt-1 ml-1">
                Remaining due: ৳{remainingDue.toLocaleString()} · DO total: ৳{orderTotalAmount.toLocaleString()}
              </p>
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
          className={`w-full ${!isLocked && validation.ok ? 'shadow-lg shadow-primary/20' : ''}`}
          onClick={handleSubmit}
          disabled={isLocked || remainingDue <= 0 || isSubmitting}
          isLoading={isSubmitting}
        >
          {isLocked ? (
            <><Lock className="w-3.5 h-3.5 mr-1.5" />Payment Already Submitted</>
          ) : remainingDue <= 0 ? (
            'Fully Paid'
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