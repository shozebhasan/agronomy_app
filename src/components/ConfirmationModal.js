'use client';
import { useTranslation } from 'react-i18next';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger"
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getButtonStyles = () => {
    if (type === "danger") {
      return {
        confirm: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        cancel: "bg-gray-300 hover:bg-gray-400 focus:ring-gray-500 text-gray-700"
      };
    }
    return {
      confirm: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      cancel: "bg-gray-300 hover:bg-gray-400 focus:ring-gray-500 text-gray-700"
    };
  };

  const buttonStyles = getButtonStyles();

  return (
    <>
      {/* Backdrop with inline backdrop filter */}
      <div 
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      ></div>
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all duration-200 scale-95 animate-in zoom-in-95">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          
          {/* Body */}
          <div className="p-6">
            <p className="text-gray-600">
              {message}
            </p>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonStyles.cancel}`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonStyles.confirm}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}