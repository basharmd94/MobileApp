import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Loader2, Send } from 'lucide-react';
import { Card, Button, CustomerSearch, ItemSearch } from '../components';
import { Customer } from '../api_customers';
import { Item } from '../api_items';
import { getCurrentUser } from '../api_users';
import { createFeedback } from '../api_feedback';

export default function Feedback() {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>('100001'); // 100001 = HMBR, 100000 = GI, 100005 = Zepto
  const [userId, setUserId] = useState<string>('');
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [description, setDescription] = useState('');
  const [isCollectionIssue, setIsCollectionIssue] = useState(false);
  const [isDeliveryIssue, setIsDeliveryIssue] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUserId(userData?.user_id || '');
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleTabChange = (zid: string) => {
    setActiveTab(zid);
    // Reset form when changing tabs
    setCustomer(null);
    setItem(null);
    setDescription('');
    setIsCollectionIssue(false);
    setIsDeliveryIssue(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !userId) {
      setErrorToast('Please fill all required fields');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await createFeedback({
        customer_id: customer?.xcus || '',
        description: description.trim(),
        is_collection_issue: isCollectionIssue,
        is_delivery_issue: isDeliveryIssue,
        product_id: item?.xitem || '',
        user_id: userId,
        zid: Number(activeTab)
      });

      setSuccessToast('Feedback submitted successfully!');
      setTimeout(() => setSuccessToast(null), 3000);

      // Reset form
      setCustomer(null);
      setItem(null);
      setDescription('');
      setIsCollectionIssue(false);
      setIsDeliveryIssue(false);
    } catch (err: any) {
      setErrorToast(err.message || 'Failed to submit feedback');
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-bg-base flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden md:max-w-full">
      <header className="flex flex-col px-4 pt-8 pb-3 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl shrink-0">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-[14px] font-bold text-text-main pr-8">Feedback</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#fff7ed] rounded-xl p-1 border border-orange-100 shadow-sm mb-3">
          {[
            { id: '100001', label: 'HMBR' },
            { id: '100000', label: 'GI' },
            { id: '100005', label: 'Zepto' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-orange-600 shadow-[0_2px_8px_rgb(251,146,60,0.15)] border border-orange-200' 
                  : 'text-orange-900/60 hover:text-orange-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto w-full md:max-w-3xl md:mx-auto pb-24">

        <Card className="!p-4 sm:!p-5 !rounded-2xl shadow-sm border-ui-border/60">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-text-main mb-1.5 ml-1">
                Select Customer
              </label>
              <CustomerSearch 
                zid={activeTab}
                employeeId={userId}
                value={customer}
                onChange={setCustomer}
                placeholder="Search by ID, Name or Area..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-main mb-1.5 ml-1">
                Select Product
              </label>
              <ItemSearch 
                zid={activeTab}
                value={item}
                onChange={setItem}
                placeholder="Search item..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-main mb-1.5 ml-1">
                Feedback Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write your feedback here..."
                className="w-full h-24 bg-bg-base py-2 px-3 border border-ui-border rounded-xl text-text-main text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            <div className="bg-bg-base rounded-xl p-3 border border-ui-border/50">
              <label className="block text-[11px] font-bold text-text-main mb-2.5">
                Issue Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollectionIssue}
                    onChange={(e) => setIsCollectionIssue(e.target.checked)}
                    className="w-4 h-4 rounded border-ui-border text-primary focus:ring-primary/40 accent-primary"
                  />
                  <span className="text-[12px] text-text-main font-medium">Collection Issue</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDeliveryIssue}
                    onChange={(e) => setIsDeliveryIssue(e.target.checked)}
                    className="w-4 h-4 rounded border-ui-border text-primary focus:ring-primary/40 accent-primary"
                  />
                  <span className="text-[12px] text-text-main font-medium">Delivery Issue</span>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 h-11 text-[13px] mt-2"
              disabled={isSubmitting || !description.trim() || !userId}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Feedback
            </Button>
          </form>
        </Card>
      </main>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-success text-white px-4 py-2 rounded-full shadow-lg shadow-success/20 text-[12px] font-bold flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            {successToast}
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg shadow-red-500/20 text-[12px] font-bold">
            {errorToast}
          </div>
        </div>
      )}
    </div>
  );
}
