import { useWebSocket } from './useWebSocket';

interface ChatWsMessage {
  type: 'new_message' | 'messages_read';
  message?: import('../types').ChatMessageResponse;
  conversation_id?: string;
  seen_at?: string;
}

export function useChatWebSocket(
  onNewMessage: (msg: import('../types').ChatMessageResponse) => void,
  onMessagesRead: (conversationId: string, seenAt: string) => void,
) {
  const { isConnected } = useWebSocket('/ws/chat', (data) => {
    const parsed = data as ChatWsMessage;
    if (parsed.type === 'new_message' && parsed.message) {
      onNewMessage(parsed.message);
    } else if (parsed.type === 'messages_read' && parsed.conversation_id && parsed.seen_at) {
      onMessagesRead(parsed.conversation_id, parsed.seen_at);
    }
  });

  return { isConnected };
}
