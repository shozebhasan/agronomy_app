'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function MessageActions({ message, onFeedback, onExport }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(null); // 'good' | 'bad' | null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFeedback = async (type) => {
    setFeedbackGiven(type);
    if (onFeedback) {
      await onFeedback(message.id, type);
    }
  };

  return (
    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-green-200">
      {/* Good Response */}
      <button
        onClick={() => handleFeedback('good')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          feedbackGiven === 'good'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-white border border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'
        }`}
        title={t("Good response")}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
        <span className="text-sm font-medium">{t("Good")}</span>
      </button>

      {/* Bad Response */}
      <button
        onClick={() => handleFeedback('bad')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          feedbackGiven === 'bad'
            ? 'bg-red-600 text-white shadow-md'
            : 'bg-white border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400'
        }`}
        title={t("Bad response")}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
        <span className="text-sm font-medium">{t("Bad")}</span>
      </button>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        title={t("Copy message")}
      >
        {copied ? (
          <>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-600">{t("Copied!")}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">{t("Copy")}</span>
          </>
        )}
      </button>

      {/* Export PDF (only show on last message) */}
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-md ml-auto"
          title={t("Export chat as PDF")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium">{t("Export PDF")}</span>
        </button>
      )}
    </div>
  );
}