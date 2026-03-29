import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ConfirmationMessageProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const ConfirmationMessage: React.FC<ConfirmationMessageProps> = ({
  message,
  type,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icon = type === 'success'
    ? <CheckCircle className="w-7 h-7 text-moe-900 flex-shrink-0" />
    : <XCircle className="w-7 h-7 text-red-600 flex-shrink-0" />;

  return ReactDOM.createPortal(
    <div
      style={{ position: 'fixed', top: '24px', left: 0, right: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
    >
      <div
        style={{ pointerEvents: 'auto' }}
        className="bg-white border border-moe-100 px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm w-full mx-4 animate-slide-down"
      >
        {icon}
        <p className="text-base font-semibold text-moe-900 flex-1 leading-snug">{message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-moe-50 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-moe-400" />
        </button>
      </div>
    </div>,
    document.body
  );
};