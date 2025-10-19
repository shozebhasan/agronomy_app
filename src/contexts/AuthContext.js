"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import i18n from "@/i18n";
import ConfirmationModal from "@/components/ConfirmationModal";
const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:8000";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [conversationLoading, setConversationLoading] = useState(false);
  const [language, setLanguage] = useState("en");

  // modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Delete",
    cancelText: "Cancel",
    type: "danger"
  });

  function changeLanguage(lang) {
  setLanguage(lang);
  try {
    i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') window.localStorage.setItem('i18nextLng', lang);
  } catch (e) {
    console.warn("i18n changeLanguage failed:", e);
  }
}

  const router = useRouter();

  // modal functions 
  const showConfirmation = (config) => {
    setModalState({
      isOpen: true,
      title: config.title || "Confirm Action",
      message: config.message || "Are you sure you want to proceed?",
      onConfirm: config.onConfirm,
      confirmText: config.confirmText || "Confirm",
      cancelText: config.cancelText || "Cancel",
      type: config.type || "danger"
    });
  };

  const hideConfirmation = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Check if user logged in on mount
  
  useEffect(() => {
    const currentLang = i18n.language || 'en';
    if (language !== currentLang) setLanguage(currentLang);
    async function checkUserLoggedIn() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);

          // Trigger background memory refresh
        fetch(`${PYTHON_BACKEND_URL}/api/memory/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.user.email })
        }).catch(err => console.log("Memory refresh:", err));


          await loadChatHistory(data.user.email);
        } else {
          setUser(null);
          // If not logged in, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error("Error checking login:", error);
        setUser(null);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkUserLoggedIn();
  }, []);

  // Load chat history

  async function loadChatHistory(userEmail) {
  try {
    
    const res = await fetch(
      `/api/chat?userEmail=${encodeURIComponent(userEmail)}`
    );
    const data = await res.json();
    

    if (res.ok && data.success) {
      const convs = data.conversations || [];
      setConversations(convs);
      
      // switch conversation handling load messages
      setMessages([]);
      setCurrentConversation(null);
    } else {
      console.error("Failed to load chat history:", data.error);
      setConversations([]);
      setMessages([]);
      setCurrentConversation(null);
    }
  } catch (error) {
    console.error("Error loading history:", error);
  }
}

  // Send message 
  
  async function sendMessage(message, images = []) {
    if (!user?.email) return { success: false, error: "Not authenticated" };

    try {
      // Add temporary user message for immediate feedback
      const tempUserMsg = {
        id: `tmp-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
        hasImages: images.length > 0,
        imageCount: images.length,
        images: images
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          email: user.email,
          conversation_id: currentConversation ? String(currentConversation) : null, // Send current conversation ID
          language: language || "en",  //passing language
          images: images  // Add images array
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const assistantMsg = {
          id: `srv-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };

        // Replace temp message with real messages
        setMessages((prev) => {
          const withoutTmp = prev.filter(
            (m) => !String(m.id).startsWith("tmp-")
          );
          return [
            ...withoutTmp,
            {
              role: "user",
              content: message,
              id: `srv-u-${Date.now()}`,
              timestamp: new Date().toISOString(),
              hasImages: images.length > 0,
              imageCount: images.length,
              images: images
            },
            assistantMsg,
          ];
        });

        // Update conversation if needed
        if (data.conversation_id) {
          const convId = String(data.conversation_id);
          setCurrentConversation(convId);
          
          // Update conversations list
          setConversations((prev) => {
            const exists = prev.find(
              (c) => String(c.id) === convId
            );
            
            if (!exists) {
              // Add new conversation
              return [
                {
                  id: convId,
                  title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
                  created_at: new Date().toISOString(),
                },
                ...prev,
              ];
            } else if (exists.title === "New Chat") {
              // Update title if it's still "New Chat"
              return prev.map(c => 
                String(c.id) === convId 
                  ? { ...c, title: message.substring(0, 50) + (message.length > 50 ? "..." : "") }
                  : c
              );
            }
            
            return prev;
          });
        }

        return { success: true, response: data.response };
      } else {
        // Remove the temporary message on error
        setMessages((prev) => prev.filter(m => !String(m.id).startsWith("tmp-")));
        console.error("Failed to send message:", data.error);
        return { success: false, error: data.error || "Backend error" };
      }
    } catch (error) {
      // Remove the temporary message on error
      setMessages((prev) => prev.filter(m => !String(m.id).startsWith("tmp-")));
      console.error("Error sending message:", error);
      return { success: false, error: error.message };
    }
  }

  // Start new chat 
  
  async function startNewChat() {
  if (!user?.email) {
    return { success: false, error: "Not logged in" };
  }

  // placeholder conversation
  const tempId = `tmp-${Date.now()}`;
  setCurrentConversation(tempId);
  setMessages([]);
  setConversations(prev => [
    {
      id: tempId,
      title: "New Chat",
      created_at: new Date().toISOString(),
    },
    ...prev,
  ]);

  //  Make sure spinner does not show for new chats
  setConversationLoading(false);

  try {
    const res = await fetch("/api/chat/new", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      const convId = String(data.conversation_id);

      // Replace tempId with real conversation ID
      setCurrentConversation(convId);
      setConversations(prev =>
        prev.map(c => c.id === tempId ? { ...c, id: convId } : c)
      );

      return { success: true, conversation_id: convId };
    } else {
      // Rollback if backend failed
      setConversations(prev => prev.filter(c => c.id !== tempId));
      setCurrentConversation(null);
      return { success: false, error: data.error || "Failed to create chat" };
    }
  } catch (error) {
    // Rollback on error
    setConversations(prev => prev.filter(c => c.id !== tempId));
    setCurrentConversation(null);
    console.error("Error creating new chat:", error);
    return { success: false, error: error.message };
  }
}


  

  // delete conversation

async function deleteConversation(conversationId) {
  if (!user?.email) return { success: false, error: "Not logged in" };

  // update UI first
  setConversations(prev => prev.filter(c => String(c.id) !== String(conversationId)));

  if (String(currentConversation) === String(conversationId)) {
    setCurrentConversation(null);
    setMessages([]);
  }

  try {
    const url = `${PYTHON_BACKEND_URL}/api/conversation/${encodeURIComponent(
      user.email
    )}/${encodeURIComponent(conversationId)}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error("Delete failed:", data.error);

      //  Rollback if backend failed
      await loadChatHistory(user.email);
      return { success: false, error: data.error || "Failed to delete" };
    }

    return { success: true };
  } catch (err) {
    console.error("deleteConversation error:", err);

    // Rollback on network error
    await loadChatHistory(user.email);
    return { success: false, error: err.message };
  }
}


  // Switch conversation 
  
async function switchConversation(conversationId) {
  if (!user?.email) return false;

  // Mark as loading
  setConversationLoading(true);
  setCurrentConversation(conversationId);

  // If cached, show immediately
  if (messagesByConversation[conversationId]) {
    setMessages(messagesByConversation[conversationId]);
    
    return true;
  } else {
    setMessages([]); // clear while loading
  }

  try {
    const url = `${PYTHON_BACKEND_URL}/api/conversation/${encodeURIComponent(user.email)}/${encodeURIComponent(conversationId)}`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();

    if (res.ok && data.success) {
      const msgs = (data.messages || []).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      setMessages(msgs);
      setMessagesByConversation(prev => ({ ...prev, [conversationId]: msgs }));

      if (data.conversation && data.conversation.title) {
        setConversations(prev =>
          prev.map(c =>
            String(c.id) === String(conversationId)
              ? { ...c, title: data.conversation.title }
              : c
          )
        );
      }

      return true;
    } else {
      console.error("Failed to switch conversation:", data.error);
      await loadChatHistory(user.email);
      return false;
    }
  } catch (err) {
    console.error("Error switching conversation:", err);
    return false;
  } finally{
    setConversationLoading(false);
  }
}

  // Auth helpers
  
  async function login(email, password) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setUser(data.user);
        await loadChatHistory(data.user.email);
        router.push("/");
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function signup(email, password) {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function logout() {
    setUser(null);
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
    document.cookie = "userEmail=; Max-Age=0; path=/;";
    router.push("/login");
  }

  // Helper function for updating conversation title
  
  function updateConversationTitle(conversationId, newTitle) {
    setConversations(prev => 
      prev.map(c => 
        String(c.id) === String(conversationId)
          ? { ...c, title: newTitle }
          : c
      )
    );
  }
 const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        messages,
        conversations,
        currentConversation,
        sendMessage,
        startNewChat,
        switchConversation,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        login,
        signup,
        logout,
        updateConversationTitle,
        deleteConversation,
        startNewConversation: startNewChat,
        chatHistory: messages,
        currentConversationId: currentConversation,
        conversationLoading,
        language,
        setLanguage : changeLanguage,
        showConfirmation,
        hideConfirmation,
        modalState
      }}
    >
      {children}

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={hideConfirmation}
        onConfirm={() => {
          if (modalState.onConfirm) {
            modalState.onConfirm();
          }
          hideConfirmation();
        }}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        type={modalState.type}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}