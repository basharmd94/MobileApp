import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isProcessing = false 
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-sm !p-5 !rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-text-main mb-2">
          {title}
        </h3>
        <p className="text-sm text-text-muted mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 !py-2.5" 
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 !py-2.5"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin block mx-auto" /> : 'Confirm'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
