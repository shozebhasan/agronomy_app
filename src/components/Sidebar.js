"use client";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import ReactDOM from "react-dom";
import { useTheme } from "@/contexts/ThemeContext";

export default function Sidebar() {
  const {
    conversations,
    startNewConversation,
    startNewChat,
    switchConversation,
    currentConversation,
    user,
    logout,
    sidebarOpen,
    toggleSidebar,
    deleteConversation,
    loading,
    showConfirmation,
  } = useAuth();

  const { t } = useTranslation();

  const { darkMode, toggleDarkMode } = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}/api/auth/delete-account`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, password: deletePassword }),
        },
      );
      const data = await res.json();
      if (data.success) {
        logout();
      } else {
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch (err) {
      setDeleteError("Something went wrong. Try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleNewChat = async () => {
    const result = await startNewChat();
    if (result.success) {
      console.log("New conversation started:", result.conversation_id);
    } else {
      console.error("Failed to start new chat:", result.error);
      alert("Failed to start new chat: " + result.error);
    }
  };

  const handleConversationClick = async (conversationId) => {
    await switchConversation(conversationId);
  };

  const handleDeleteConversation = async (
    conversationId,
    conversationTitle,
  ) => {
    if (!user?.email) {
      showConfirmation({
        title: t("Authentication Required"),
        message: t("You need to be logged in to delete conversations."),
        type: "info",
        confirmText: t("OK"),
      });
      return;
    }

    showConfirmation({
      title: t("Delete Conversation"),
      message: t(
        'Are you sure you want to delete "{{title}}"? This action cannot be undone.',
        {
          title: formatConversationTitle(conversationTitle),
        },
      ),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      onConfirm: async () => {
        const res = await deleteConversation(conversationId);
        if (!res.success) {
          // Show error modal
          showConfirmation({
            title: t("Delete Failed"),
            message: t("Failed to delete conversation: {{error}}", {
              error: res.error || t("Unknown error"),
            }),
            type: "info",
            confirmText: t("OK"),
          });
        }
      },
    });
  };

  const formatConversationTitle = (title) => {
    if (!title || title === "New Conversation") {
      return "New Chat";
    }
    return title.length > 30 ? title.substring(0, 30) + "..." : title;
  };

  return (
    <div
      className={`
      bg-green-50 border-r border-green-200 flex flex-col h-full
      transition-all duration-300 ease-in-out
      ${sidebarOpen ? "w-88 translate-x-0" : "w-0 -translate-x-full overflow-hidden"}
    `}
    >
      {/* Header */}
      <div className="p-4 border-b border-green-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-green-800">
            {t("Agronomist AI")}
          </h2>
          {/* Hamburger Icon */}
          <button
            onClick={toggleSidebar}
            className="text-green-700 hover:text-green-900 p-2 rounded-lg transition-colors"
            title="Toggle Sidebar"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full mt-4 bg-white hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg border border-green-300 transition-colors flex items-center justify-center gap-2"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {t("New Chat")}
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-green-700 mb-3">
          {t("Conversations")}
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-green-700 text-sm">
              {t("Loading conversation...")}
            </span>
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="text-center text-green-600 py-8">
            <svg
              className="w-12 h-12 mx-auto mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">{t("No conversations yet")}</p>
            <p className="text-xs opacity-75">
              {t("Start a new chat to begin")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  String(currentConversation) === String(conversation.id)
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white hover:bg-green-100 text-green-800 border border-green-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>

                  <span className="text-sm font-medium truncate">
                    {formatConversationTitle(conversation.title)}
                  </span>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleDeleteConversation(
                          conversation.id,
                          conversation.title,
                        );
                      }}
                      title={t("Delete conversation")}
                      className="w-6 h-6 rounded-full bg-red-400 hover:bg-red-500 flex items-center justify-center transition-colors"
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {conversation.created_at && (
                  <div
                    className={`text-xs mt-1 ${
                      String(currentConversation) === String(conversation.id)
                        ? "text-green-100"
                        : "text-green-600"
                    }`}
                  >
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Info and Logout */}
      {user && (
        <div className="relative p-4 border-t border-green-200">
          {/* Popup Menu */}
          {menuOpen && (
            <>
              {/* Invisible overlay — clicking anywhere closes the popup */}
              {typeof window !== "undefined" &&
                ReactDOM.createPortal(
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />,
                  document.body,
                )}

              {/* Popup - adjust width and positioning */}
              {typeof window !== "undefined" &&
                ReactDOM.createPortal(
                  <div
                    className="fixed z-20 border rounded-xl shadow-xl overflow-hidden"
                    style={{
                      bottom: "5rem",
                      right: "auto",
                      left: "1rem",
                      width: "320px", // Control the width here
                      maxWidth: "calc(100% - 2rem)", // Responsive: leaves 1rem on each side on mobile
                      backgroundColor: darkMode ? "#111111" : "#ffffff",
                      borderColor: darkMode ? "#374151" : "#bbf7d0",
                    }}
                  >
                    <div className="px-4 py-2 border-b border-green-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                        SETTINGS
                      </p>
                    </div>

                    {/* Dark Mode button — cursor pointer, hover darkening, and description text */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDarkMode();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-green-600 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                        <svg
                          className="w-4 h-4 text-green-700 group-hover:text-white transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium group-hover:text-white transition-colors">
                          {darkMode ? "Light Mode" : "Dark Mode"}
                        </span>
                        <p
                          className="text-xs group-hover:text-green-100 transition-colors mt-0.5"
                          
                        >
                          {darkMode
                            ? "Switch to light theme"
                            : "Switch to dark theme"}
                        </p>
                      </div>
                    </button>

                    {/* Delete Account button — cursor pointer, hover darkening, and description text */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-600 transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors">
                        <svg
                          className="w-4 h-4 text-red-500 group-hover:text-white transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium text-red-600 group-hover:text-white transition-colors">
                          Delete Account
                        </span>
                        <p className="text-xs text-red-500 group-hover:text-red-100 transition-colors mt-0.5">
                          Permanently delete your account
                        </p>
                      </div>
                    </button>

                    <div className="px-4 py-2 border-t border-green-100">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 py-2 text-sm text-green-700 hover:text-green-900 transition-colors cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>,
                  document.body,
                )}
            </>
          )}

          {/* User row — hover turns dark green, click opens popup */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-green-700 group cursor-pointer"
          >
            <div className="w-9 h-9 bg-green-600 group-hover:bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
              <span className="text-white text-sm font-semibold">
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-green-800 group-hover:text-white truncate transition-colors">
                {user.email?.split("@")[0]}
              </p>
              <p className="text-xs text-green-600 group-hover:text-green-200 truncate transition-colors">
                {user.email}
              </p>
            </div>
            <svg
              className={`w-4 h-4 text-green-500 group-hover:text-green-200 transition-all duration-200 ${menuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>

          {/* Delete Account Confirmation Modal */}
          {showDeleteModal &&
            typeof window !== "undefined" &&
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Delete Account
                      </h3>
                      <p className="text-xs text-gray-500">
                        This action is permanent and cannot be undone
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    All your conversations, data, and settings will be
                    permanently deleted. Enter your password to confirm.
                  </p>

                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />

                  {deleteError && (
                    <p className="text-xs text-red-500 mb-3">{deleteError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletePassword("");
                        setDeleteError("");
                      }}
                      className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 "
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium  disabled:opacity-50"
                    >
                      {deleteLoading ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </div>
      )}
    </div>
  );
}
