import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import * as chatApi from '../api/chat';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import type { ChatMessageResponse, ConversationResponse } from '../types';

interface ChatContextValue {
  conversations: ConversationResponse[];
  conversationsLoading: boolean;
  totalUnread: number;
  refreshConversations: () => Promise<void>;
  getOrCreateConversation: (userId: string) => Promise<ConversationResponse>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const convRef = useRef(conversations);
  convRef.current = conversations;

  const refreshConversations = useCallback(async () => {
    try {
      const data = await chatApi.listConversations();
      setConversations(data);
    } catch {} finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const onNewMessage = useCallback((msg: ChatMessageResponse) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === msg.conversation_id);
      if (!existing) return prev;
      return prev.map((c) =>
        c.id === msg.conversation_id
          ? { ...c, last_message: msg.content, last_message_at: msg.created_at, last_message_sender_id: msg.sender_id, unread_count: c.unread_count + 1 }
          : c,
      );
    });
  }, []);

  const onMessagesRead = useCallback((conversationId: string, seenAt: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c,
      ),
    );
  }, []);

  useChatWebSocket(onNewMessage, onMessagesRead);

  const getOrCreateConversation = useCallback(async (userId: string) => {
    const conv = await chatApi.getOrCreateConversation({ user_id: userId });
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
    return conv;
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <ChatContext.Provider value={{ conversations, conversationsLoading, totalUnread, refreshConversations, getOrCreateConversation }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
