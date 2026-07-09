import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as chatApi from '../api/chat';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import type { ChatMessageResponse } from '../types';

export default function MessageChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations } = useChat();

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const msgIdsRef = useRef(new Set<string>());

  const conversation = conversations.find((c) => c.id === id);
  const otherUser = conversation
    ? { id: conversation.other_user_id, username: conversation.other_username, avatar_url: conversation.other_avatar_url }
    : null;

  const fetchMessages = useCallback(async (before?: string) => {
    if (!id) return;
    try {
      const data = await chatApi.getMessages(id, before);
      if (data.length === 0) {
        setHasMore(false);
        return;
      }
      data.forEach((m) => msgIdsRef.current.add(m.id));
      setMessages((prev) => (before ? [...data, ...prev] : data));
      setHasMore(data.length === 50);
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    msgIdsRef.current = new Set();
    setMessages([]);
    setLoading(true);
    setHasMore(false);
    if (id) {
      fetchMessages();
      chatApi.markRead(id).catch(() => {});
    }
  }, [id, fetchMessages]);

  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView();
    }
  }, [loading]);

  const onNewMessage = useCallback((msg: ChatMessageResponse) => {
    if (msg.conversation_id !== id) return;
    if (msgIdsRef.current.has(msg.id)) return;
    msgIdsRef.current.add(msg.id);
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.created_at > msg.created_at);
      if (idx === -1) return [...prev, msg];
      const copy = [...prev];
      copy.splice(idx, 0, msg);
      return copy;
    });
    if (msg.sender_id !== user?.id) {
      chatApi.markRead(id!).catch(() => {});
    }
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, [id, user?.id]);

  const onMessagesRead = useCallback((conversationId: string, seenAt: string) => {
    if (conversationId !== id) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.sender_id === user?.id && !m.seen_at ? { ...m, seen_at: seenAt } : m,
      ),
    );
  }, [id, user?.id]);

  useWebSocket('/ws/chat', (data) => {
    const parsed = data as { type: string; message?: ChatMessageResponse; conversation_id?: string; seen_at?: string };
    if (parsed.type === 'new_message' && parsed.message) {
      onNewMessage(parsed.message);
    } else if (parsed.type === 'messages_read' && parsed.conversation_id && parsed.seen_at) {
      onMessagesRead(parsed.conversation_id, parsed.seen_at);
    }
  });

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !id || sending) return;
    setSending(true);
    setInput('');
    try {
      const msg = await chatApi.sendMessage(id, { content: text });
      msgIdsRef.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadMore = () => {
    if (!hasMore || loading || messages.length === 0) return;
    const oldest = messages[0];
    fetchMessages(oldest.created_at);
  };

  useEffect(() => {
    if (!topSentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: '100px' },
    );
    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, messages.length, loading]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const shouldShowDate = (idx: number) => {
    if (idx === 0) return true;
    const prev = new Date(messages[idx - 1].created_at);
    const curr = new Date(messages[idx].created_at);
    return prev.toDateString() !== curr.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-[1.5px] border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
        <button
          onClick={() => navigate('/messages')}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        {otherUser && (
          <div className="flex items-center gap-2">
            {otherUser.avatar_url ? (
              <img src={otherUser.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-primary/20" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center text-xs font-semibold text-white">
                {otherUser.username[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-white">{otherUser.username}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1 scrollbar-hide">
        {hasMore && <div ref={topSentinelRef} className="h-4" />}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-muted text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id}>
                {shouldShowDate(idx) && (
                  <div className="flex justify-center my-3">
                    <span className="text-[10px] text-text-muted bg-bg-card px-2 py-0.5 rounded-full">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1`}>
                  <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-1'}`}>
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isMine
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-bg-card border border-gray-800 text-text-primary rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-text-muted">{formatTime(msg.created_at)}</span>
                      {isMine && msg.seen_at && (
                        <span className="text-[10px] text-primary">Seen</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 pt-3 border-t border-gray-800">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-bg-card border border-gray-700 text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none text-sm max-h-32"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="shrink-0 w-10 h-10 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all duration-150 disabled:opacity-40"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
