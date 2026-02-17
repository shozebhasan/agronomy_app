"use client";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { formatMessage } from "@/utils/formatMessage";
import MessageActions from "./MessageAction";
import VoiceRecorder from "@/components/VoiceRecorder";


// Add these functions in ChatInterface component
const handleMessageFeedback = async (messageId, feedbackType) => {
  try {
    const response = await fetch("/api/message/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: messageId,
        feedback_type: feedbackType,
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log("Feedback saved successfully");
    }
  } catch (error) {
    console.error("Failed to save feedback:", error);
  }
};

const handleExportPDF = async () => {
  if (!currentConversation || !user?.email) return;

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL
      }/api/conversation/${encodeURIComponent(user.email)}/${encodeURIComponent(
        currentConversation
      )}/export`
    );

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_${currentConversation}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error("Failed to export PDF:", error);
  }
};

export default function ChatInterface() {
  const {
    messages,
    currentConversation,
    user,
    sendMessage,
    sidebarOpen,
    conversationLoading,
    language,
    setLanguage,
  } = useAuth();
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImages, setAttachedImages] = useState([]);
  const fileInputRef = useRef(null);

  //voice recording handler function
const handleVoiceTranscribe = (transcribedText) => {
  if (transcribedText && transcribedText.trim()) {
    setInputMessage(transcribedText);
  }
};

  const messagesEndRef = useRef(null);

  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ur" : "en");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle image file selection
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 4 images
    if (attachedImages.length + files.length > 4) {
      alert(t("You can only attach up to 4 images at once."));
      return;
    }

    const newImages = [];

    for (const file of files) {
      // Check file size (max 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        alert(t(`Image ${file.name} is too large. Maximum size is 5MB.`));
        continue;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert(t(`${file.name} is not a valid image file.`));
        continue;
      }

      try {
        // Convert to base64
        const base64 = await fileToBase64(file);
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          base64: base64.split(",")[1], // Remove data:image/...;base64, prefix
          name: file.name,
        });
      } catch (error) {
        console.error("Error processing image:", error);
        alert(t(`Failed to process ${file.name}`));
      }
    }

    setAttachedImages((prev) => [...prev, ...newImages]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Remove attached image
  const removeImage = (index) => {
    setAttachedImages((prev) => {
      const newImages = [...prev];
      // Revoke object URL to free memory
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if ((!inputMessage.trim() && attachedImages.length === 0) || isLoading)
      return;

    setIsLoading(true);
    const message = inputMessage.trim();
    const imagesToSend = attachedImages.map((img) => img.base64);
    setInputMessage("");
    setAttachedImages([]);

    try {
      const result = await sendMessage(
        message || "Please analyze these images.",
        imagesToSend
      );
      if (!result.success) {
        console.error("Failed to send message:", result.error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Determine container
  const containerClass = sidebarOpen
    ? "max-w-4xl mx-auto"
    : "max-w-3xl mx-auto";
  // Show loading spinner

  //chat function buttons code

  // Add this inside ChatInterface component
  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    // Optional: Add a toast notification here
    alert(t("Message copied to clipboard!"));
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}/api/export-pdf`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            conversation_id: currentConversation?.id,
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-export-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("PDF Export failed", error);
    }
  };

  if (conversationLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-green-700 font-medium">
            {t("Loading conversation...")}
          </p>
        </div>
      </div>
    );
  }
  // Show welcome message when no conversation is active or no messages
  if (!currentConversation || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex justify-end p-4">
          <button
            onClick={toggleLanguage}
            className="relative inline-flex items-center justify-center p-1 bg-gray-200 rounded-full transition-all duration-300 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-16 h-8"
            title={
              language === "en" ? t("Switch to Urdu") : t("Switch to English")
            }
          >
            {/* Track background */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                language === "en" ? "bg-green-500" : "bg-blue-500"
              }`}
            ></div>

            {/* Thumb circle */}
            <div
              className={`relative bg-white rounded-full shadow-md transform transition-all duration-300  ${
                language === "en" ? "translate-x-[-12px]" : "translate-x-4"
              } w-6 h-6 flex items-center justify-center`}
            >
              <span className="text-xs font-bold text-gray-900">
                {language === "en" ? "EN" : "UR"}
              </span>
            </div>
          </button>
        </div>

        {/* Welcome Message */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-green-800 mb-4">
              {t("Welcome to AI Agronomist")}
            </h1>
            <p className="text-lg text-green-600 mb-8">
              {t(
                "Your intelligent agriculture assistant. Start a conversation."
              )}
            </p>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                {t("Try asking:")}
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div
                  className="bg-white p-4 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() =>
                    setInputMessage("How can I improve my crop yield?")
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">🌱</span>
                    </div>
                    <span className="text-green-800 font-medium">
                      {t("Improve crop yield")}
                    </span>
                  </div>
                </div>

                <div
                  className="bg-white p-4 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() =>
                    setInputMessage("What's the best fertilizer for tomatoes?")
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">🍅</span>
                    </div>
                    <span className="text-green-800 font-medium">
                      {t("Tomato fertilizer")}
                    </span>
                  </div>
                </div>

                <div
                  className="bg-white p-4 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() =>
                    setInputMessage("How do I identify plant diseases?")
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">🔍</span>
                    </div>
                    <span className="text-green-800 font-medium">
                      {t("Plant diseases")}
                    </span>
                  </div>
                </div>

                <div
                  className="bg-white p-4 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() =>
                    setInputMessage(
                      "What are the best practices for organic farming?"
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">🌿</span>
                    </div>
                    <span className="text-green-800 font-medium">
                      {t("Organic farming")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area with Image Upload */}
        <div className="border-t border-green-200 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            {/* Image Preview Area */}
            {attachedImages.length > 0 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                {attachedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-green-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Image upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
                title={t("Upload Images")}
                disabled={isLoading}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>

              {/* Message input */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("Type your message here.")}
                className="flex-1 px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />

              <VoiceRecorder
              onTranscript={handleVoiceTranscribe}
              disabled={isLoading}
            />

              {/* Send button */}
              <button
                type="submit"
                disabled={
                  (!inputMessage.trim() && attachedImages.length === 0) ||
                  isLoading
                }
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t("Sending.")}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    {t("Send")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex justify-end p-4">
        <button
          onClick={toggleLanguage}
          className="relative inline-flex items-center justify-center p-1 bg-gray-200 rounded-full transition-all duration-300 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-16 h-8"
          title={
            language === "en" ? t("Switch to Urdu") : t("Switch to English")
          }
        >
          {/* Track background */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-300 ${
              language === "en" ? "bg-green-500" : "bg-blue-500"
            }`}
          ></div>

          {/* Thumb circle */}
          <div
            className={`relative bg-white rounded-full shadow-md transform transition-all duration-300 ${
              language === "en" ? "translate-x-[-12px]" : "translate-x-4"
            } w-6 h-6 flex items-center justify-center`}
          >
            <span className="text-xs font-bold text-gray-900">
              {language === "en" ? "EN" : "UR"}
            </span>
          </div>
        </button>
      </div>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-6 py-4 group ${
                  message.role === "user"
                    ? "bg-green-600 text-white rounded-br-none"
                    : "bg-green-100 text-green-800 rounded-bl-none border border-green-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">
                      {message.role === "user" ? t("You") : t("AI Agronomist")}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {formatMessage(message.content)}
                    </div>

                    {/* Render attached images if present */}
                    {message.hasImages &&
                      message.images &&
                      message.images.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-2">
                          {message.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={`data:image/png;base64,${img}`}
                              alt={`attachment-${idx}`}
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      )}

                    {message.timestamp && (
                      <div
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-green-100"
                            : "text-green-600"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    )}

                    {/* Add Message Actions for AI messages */}
                    {message.role === "assistant" && (
                      <MessageActions
                        message={message}
                        onFeedback={handleMessageFeedback}
                        onExport={
                          messages.indexOf(message) === messages.length - 1
                            ? handleExportPDF
                            : null
                        }
                      />
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-medium">
                        {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl rounded-2xl px-6 py-4 bg-green-100 text-green-800 rounded-bl-none border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-green-700">{t("typing")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area with Image Upload */}
      <div className="border-t border-green-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          {/* Image Preview Area */}
          {attachedImages.length > 0 && (
            <div className="mb-3 flex gap-2 flex-wrap">
              {attachedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-green-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-green-300"
              title={t("Upload Images")}
              disabled={isLoading}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* Message input */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                attachedImages.length > 0
                  ? t("Add a message (optional)...")
                  : t("Type your message here.")
              }
              className="flex-1 px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isLoading}
            />

            <VoiceRecorder
              onTranscript={handleVoiceTranscribe}
              disabled={isLoading}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={
                (!inputMessage.trim() && attachedImages.length === 0) ||
                isLoading
              }
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t("Sending.")}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  {t("Send")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
