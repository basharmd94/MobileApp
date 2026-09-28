import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Hash, Calendar, TrendingUp, Truck, CreditCard, AlertTriangle, CheckCircle2, Edit3, Lock, Shield } from 'lucide-react';
import Header from '../components/ui/Header';
import { Button, ConfirmModal } from '../components';
import Toast from '../components/ui/Toast';
import { getBusinessName } from '../utils/business';
import { updateDeliveryDates } from '../api_delivery_orders';
import { isOnOrBeforeDay, isBeforeDay, isOnOrAfterDay, humanizeDate, todayIso } from '../utils/dates';

export default function PayDate() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  // ─── State ──────────────────────────────────────────────────────────────
  const [deliveryDate, setDeliveryDate] = useState(order?.xdate || '');
  const [payDate, setPayDate] = useState(order?.xdatepay || '');
  const [originalDeliveryDate] = useState(order?.xdate || '');
  const [originalPayDate] = useState(order?.xdatepay || '');
  
  // ─── Lock state ──────────────────────────────────────────────────────────
  // Check if pay date has been submitted/confirmed
  const isPayDateSubmitted = order?.xdatepay_submitted === true || order?.xpaystatus === 'Send';
  const isLocked = isPayDateSubmitted || order?.xpaystatus === 'Send';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // ─── Check if dates have changed ──────────────────────────────────────
  const hasDatesChanged = useMemo(() => {
    return deliveryDate !== originalDeliveryDate || payDate !== originalPayDate;
  }, [deliveryDate, payDate, originalDeliveryDate, originalPayDate]);

  // ─── Check if pay date is set (even if not submitted) ──────────────
  const hasPayDateSet = useMemo(() => {
    return Boolean(originalPayDate);
  }, [originalPayDate]);

  // ─── Validation ──────────────────────────────────────────────────────────
  const validation = useMemo(() => {
    if (!deliveryDate || !payDate) {
      return { ok: false, reason: 'Both dates are required.' };
    }
    if (isBeforeDay(payDate, deliveryDate)) {
      return {
        ok: false,
        reason: 'Pay date cannot be earlier than the delivery date.',
      };
    }
    return { ok: true, reason: '' };
  }, [deliveryDate, payDate]);

  const payDateInPast = useMemo(
    () => Boolean(payDate) && isBeforeDay(payDate, todayIso()),
    [payDate]
  );

  // ─── Button disabled logic ────────────────────────────────────────────
  const isButtonDisabled = useMemo(() => {
    // Disable if pay date is already submitted (permanent lock)
    if (isPayDateSubmitted) return true;
    
    // Disable if payment is already submitted
    if (isLocked) return true;
    
    // Disable if currently submitting
    if (isSubmitting) return true;
    
    // Disable if validation fails
    if (!validation.ok) return true;
    
    // Disable if dates haven't changed
    if (!hasDatesChanged) return true;
    
    return false;
  }, [isPayDateSubmitted, isLocked, isSubmitting, validation.ok, hasDatesChanged]);

  // ─── Button text logic ─────────────────────────────────────────────────
  const getButtonText = () => {
    if (isPayDateSubmitted) {
      return 'Pay Date Already Confirmed';
    }
    if (isLocked) {
      return 'Payment Already Submitted';
    }
    if (isSubmitting) {
      return 'Updating...';
    }
    if (!hasDatesChanged) {
      return hasPayDateSet ? 'Pay Date Already Set' : 'No Changes Made';
    }
    if (order?.xdatepay) {
      return 'Update Dates';
    }
    return 'Save Dates';
  };

  // ─── Button variant logic ─────────────────────────────────────────────
  const getButtonVariant = () => {
    if (isPayDateSubmitted || isLocked) return "outline";
    if (isButtonDisabled) return "outline";
    return "primary";
  };

  const handleUpdate = () => {
    if (isButtonDisabled) return;
    if (!validation.ok) {
      setErrorToast(validation.reason);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const executeUpdate = async () => {
    if (!validation.ok) return;
    setIsSubmitting(true);
    setIsConfirmModalOpen(false);
    setErrorToast(null);
    setSuccessToast(null);

    try {
      const payload = {
        delivery_date: deliveryDate,
        payment_date: payDate,
      };

      const res = await updateDeliveryDates(order.zid.toString(), order.xdornum, payload);

      if (res.success) {
        setSuccessToast(res.message || 'Dates updated successfully');
        // After successful update, mark as submitted
        // This will lock the form permanently
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        setErrorToast(res.message || 'Failed to update dates');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error updating dates:', err);
      setErrorToast(err.response?.data?.detail || err.message || 'An error occurred while updating');
      setIsSubmitting(false);
    }
  };

  // ─── Reset on successful update ──────────────────────────────────────
  useEffect(() => {
    if (successToast) {
      setIsSubmitting(false);
    }
  }, [successToast]);

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
      <Header title="Pay Date" bgColor="bg-bg-card" />

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-28 space-y-4">
        {/* Order Info Card */}
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
            {order.xordernum && (
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                <span className="text-[10px] font-medium text-text-secondary truncate">
                  Order: <span className="font-bold text-text-main">{order.xordernum}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Locked Status Banner - Show when pay date is submitted */}
        {isPayDateSubmitted && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-[14px] p-3.5 shadow-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-emerald-800">Pay Date Confirmed</p>
              <p className="text-[10px] text-emerald-700/80 leading-snug mt-0.5">
                The pay date has been submitted and confirmed. It cannot be changed anymore.
                {order.xdatepay && (
                  <span className="block mt-1 font-medium">
                    Confirmed Date: {order.xdatepay} ({humanizeDate(order.xdatepay)})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Date Inputs Card */}
        <div className="bg-bg-card border border-ui-border rounded-[16px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-bold text-text-main flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />Update Dates
            </h3>
            {isPayDateSubmitted ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700">
                <Lock className="w-2.5 h-2.5" />Confirmed
              </span>
            ) : isLocked ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700">
                <Lock className="w-2.5 h-2.5" />Paid — locked
              </span>
            ) : order?.xdatepay ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700">
                <Edit3 className="w-2.5 h-2.5" />Editable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[9px] font-bold text-blue-700">
                <CheckCircle2 className="w-2.5 h-2.5" />New
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                <Truck className="w-3.5 h-3.5 text-teal-500" />Delivery Date <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  value={deliveryDate} 
                  onChange={(e) => setDeliveryDate(e.target.value)} 
                  disabled={isLocked || isPayDateSubmitted || isSubmitting}
                  className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition-all text-text-main appearance-none disabled:opacity-60"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2314B8A6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px' }} 
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-text-main mb-2">
                <CreditCard className="w-3.5 h-3.5 text-purple-500" />Expected Pay Date <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  value={payDate} 
                  onChange={(e) => setPayDate(e.target.value)} 
                  disabled={isLocked || isPayDateSubmitted || isSubmitting} 
                  min={deliveryDate || undefined}
                  className="w-full h-[42px] px-3 py-2 text-[13px] bg-bg-base border border-ui-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-text-main appearance-none disabled:opacity-60"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B5CF6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px' }} 
                />
              </div>
              <p className="text-[9.5px] text-text-muted mt-1 ml-1">
                Customer's promised payment date. Payment can be collected any time <b>on or before</b> this day.
              </p>
            </div>
          </div>

          {/* Live validation feedback */}
          {!validation.ok && (deliveryDate || payDate) && (
            <div className="mt-3 p-2.5 rounded-[12px] border border-error/30 bg-error/5 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-error leading-snug">{validation.reason}</p>
            </div>
          )}
          
          {payDateInPast && validation.ok && !isPayDateSubmitted && !isLocked && (
            <div className="mt-3 p-2.5 rounded-[12px] border border-amber-200 bg-amber-50 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-amber-800 leading-snug">
                Pay date is in the past ({humanizeDate(payDate)}). Make sure this is intentional — the customer may have already paid.
              </p>
            </div>
          )}

          {/* Show change indicator */}
          {hasDatesChanged && validation.ok && !isLocked && !isPayDateSubmitted && (
            <div className="mt-3 p-2.5 rounded-[12px] border border-blue-200 bg-blue-50 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-blue-800 leading-snug">
                Changes detected. Click the button below to save.
              </p>
            </div>
          )}

          {(deliveryDate || payDate) && (
            <div className="mt-4 p-3 bg-bg-base rounded-lg border border-ui-border space-y-2">
              {deliveryDate && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5"><Truck className="w-3 h-3 text-teal-500" />Delivery Date</span>
                  <span className="text-[11px] font-bold text-teal-600">
                    {deliveryDate} 
                    {deliveryDate !== originalDeliveryDate && !isPayDateSubmitted && (
                      <span className="text-amber-500 ml-1 text-[9px]">(changed)</span>
                    )}
                    <span className="text-text-muted font-normal ml-1">({humanizeDate(deliveryDate)})</span>
                  </span>
                </div>
              )}
              {payDate && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-purple-500" />Expected Pay Date</span>
                  <span className="text-[11px] font-bold text-purple-600">
                    {payDate}
                    {payDate !== originalPayDate && !isPayDateSubmitted && (
                      <span className="text-amber-500 ml-1 text-[9px]">(changed)</span>
                    )}
                    {isPayDateSubmitted && (
                      <span className="text-emerald-500 ml-1 text-[9px]">✓ Confirmed</span>
                    )}
                    <span className="text-text-muted font-normal ml-1">({humanizeDate(payDate)})</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Status Info */}
        <div className="bg-teal-50/50 border border-teal-100 rounded-[16px] p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-medium text-text-secondary">Status</span>
              <p className="text-[12px] font-bold text-teal-700 mt-0.5">{order.xstatusdor || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[10px] font-medium text-text-secondary">Items</span>
              <p className="text-[12px] font-bold text-text-main mt-0.5">{order.items?.length || 0} items</p>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-card border-t border-ui-border shadow-[0_-4px_10px_rgb(0,0,0,0.02)] z-10 w-full md:max-w-3xl md:mx-auto">
        <Button
          variant={getButtonVariant()}
          size="lg"
          className={`w-full ${!isButtonDisabled ? 'shadow-lg shadow-primary/20' : 'opacity-70'}`}
          onClick={handleUpdate}
          disabled={isButtonDisabled}
          isLoading={isSubmitting}
        >
          {getButtonText()}
        </Button>
        
        {/* Info text below button */}
        {isPayDateSubmitted && (
          <p className="text-[10px] text-text-muted text-center mt-2 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Pay date has been confirmed and cannot be modified
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={order?.xdatepay ? "Confirm Date Update" : "Confirm Dates"}
        message={`Are you sure you want to ${order?.xdatepay ? 'update' : 'set'} the dates for order ${order.xdornum}?\n\nThis action will be permanent and cannot be undone.`}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={executeUpdate}
        isProcessing={isSubmitting}
      />
      <Toast error={errorToast} success={successToast} />
    </div>
  );
}