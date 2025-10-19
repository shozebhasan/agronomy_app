'use client';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

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
    showConfirmation
    
  } = useAuth();

  const { t } = useTranslation();

  const handleNewChat = async () => {
    const result = await startNewChat();
    if (result.success) {
      console.log('New conversation started:', result.conversation_id);
    } else {
      console.error('Failed to start new chat:', result.error);
      alert('Failed to start new chat: ' + result.error);
    }
  };

  const handleConversationClick = async (conversationId) => {
    await switchConversation(conversationId);
  };

  const handleDeleteConversation = async (conversationId, conversationTitle) => {
    if (!user?.email) {
      showConfirmation({
        title: t("Authentication Required"),
        message: t("You need to be logged in to delete conversations."),
        type: "info",
        confirmText: t("OK")
      });
      return;
    }

    showConfirmation({
      title: t("Delete Conversation"),
      message: t("Are you sure you want to delete \"{{title}}\"? This action cannot be undone.", { 
        title: formatConversationTitle(conversationTitle) 
      }),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
      onConfirm: async () => {
        const res = await deleteConversation(conversationId);
        if (!res.success) {
          // Show error modal
          showConfirmation({
            title: t("Delete Failed"),
            message: t("Failed to delete conversation: {{error}}", { 
              error: res.error || t("Unknown error") 
            }),
            type: "info",
            confirmText: t("OK")
          });
        }
      }
    });
  };

  const formatConversationTitle = (title) => {
    if (!title || title === 'New Conversation') {
      return 'New Chat';
    }
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  };

   return (
    <div className={`
      bg-green-50 border-r border-green-200 flex flex-col h-full
      transition-all duration-300 ease-in-out
      ${sidebarOpen ? 'w-88 translate-x-0' : 'w-0 -translate-x-full overflow-hidden'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-green-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-green-800">{t("Agronomist AI")}</h2>
          {/* Hamburger Icon */}
          <button
            onClick={toggleSidebar}
            className="text-green-700 hover:text-green-900 p-2 rounded-lg transition-colors"
            title="Toggle Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* New Chat Button */}
        <button 
          onClick={handleNewChat}
          className="w-full mt-4 bg-white hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg border border-green-300 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t("New Chat")}
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-green-700 mb-3">{t("Conversations")}</h3>
        
       {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-green-700 text-sm">{t("Loading conversation...")}</span>
        </div>
       ):(!conversations || conversations.length === 0) ? (
          <div className="text-center text-green-600 py-8">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">{t("No conversations yet")}</p>
            <p className="text-xs opacity-75">{t("Start a new chat to begin")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  String(currentConversation) === String(conversation.id)
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white hover:bg-green-100 text-green-800 border border-green-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>

                  <span className="text-sm font-medium truncate">
                    {formatConversationTitle(conversation.title)}
                  </span>

                  <div className="ml-auto flex items-center gap-2">
                    {conversation.created_at && (
                      <div className={`text-xs ${
                        String(currentConversation) === String(conversation.id) ? 'text-green-100' : 'text-green-600'
                      } mr-2`}>
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </div>
                    )}

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleDeleteConversation(conversation.id, conversation.title);
                      }}
                      title={t("Delete conversation")}
                      className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-3 h-3 text-red-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {conversation.created_at && (
                  <div className={`text-xs mt-1 ${
                    String(currentConversation) === String(conversation.id) ? 'text-green-100' : 'text-green-600'
                  }`}>
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
        <div className="p-4 border-t border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">
                  {user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-green-600 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}