/**
 * Chatbot admin types
 *
 * Shared type definitions for chatbot administration components.
 */

/** Preview of a conversation in the listing */
export interface ConversationPreview {
  id: string;
  sessionId: string;
  status: string;
  messageCount: number;
  satisfied: boolean | null;
  deviceType: string | null;
  referrer: string | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  preview: string;
  firstUserMessage: string;
}

/** Individual message in a conversation */
export interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  tokensUsed: number | null;
  processingTime: number | null;
  suggestedActions: unknown | null;
  createdAt: string;
}

/** Full conversation detail with messages */
export interface ConversationDetail {
  id: string;
  sessionId: string;
  ipHash: string | null;
  status: string;
  messageCount: number;
  satisfied: boolean | null;
  referrer: string | null;
  deviceType: string | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  messages: ConversationMessage[];
  totalTokens: number;
  avgProcessingTime: number | null;
}

/** Aggregated chatbot statistics */
export interface ChatbotStats {
  totalConversations: number;
  activeConversations: number;
  satisfiedCount: number;
  unsatisfiedCount: number;
  satisfactionRate: number | null;
  totalMessages: number;
  avgMessagesPerConversation: number;
  todayConversations: number;
  weekConversations: number;
}

/** Pagination metadata */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** API response for conversations listing */
export interface ConversationsResponse {
  conversations: ConversationPreview[];
  pagination: PaginationInfo;
  stats: ChatbotStats;
}
