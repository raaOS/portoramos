/**
 * Chat Message Types - Consolidated
 * 
 * This file contains all chat message type definitions used across the application.
 * Previously scattered across multiple files, now centralized for consistency.
 */

// ============================================
// Base Interface
// ============================================

/**
 * Base chat message interface with common fields
 */
export interface BaseChatMessage {
  id: string | number;
  text: string;
}

// ============================================
// Specific Variants
// ============================================

/**
 * Chat message for Island notifications (About page)
 * Uses numeric ID and time string
 */
export interface NotificationChatMessage extends BaseChatMessage {
  id: number;
  isMe: boolean;
  time: string;
  status: 'sent' | 'read';
}

/**
 * Chat message for CLOUDFLARE_D1/real-time chat (Contact page)
 * Uses string ID and timestamp number
 */
export interface CLOUDFLARE_D1ChatMessage extends BaseChatMessage {
  id: string;
  sender: 'visitor' | 'admin';
  timestamp: number;
  delivered?: boolean;
}

/**
 * Chat message for WhatsApp-style chat with media support
 * Extends NotificationChatMessage with additional fields
 */
export interface WhatsAppChatMessage extends NotificationChatMessage {
  type?: 'text' | 'image' | 'project';
  imageSrc?: string;
  projectId?: string;
}

/**
 * Chat message for testimonials
 * Simplified version for testimonial conversations
 */
export interface TestimonialChatMessage {
  text: string;
  isMe: boolean;
  time: string;
}

// ============================================
// Backward Compatibility Aliases
// ============================================

/**
 * @deprecated Use NotificationChatMessage instead. 
 * Kept for backward compatibility with existing code in types/about.ts
 */
export type ChatMessage = NotificationChatMessage;

/**
 * @deprecated Use CLOUDFLARE_D1ChatMessage instead.
 * Kept for backward compatibility with existing code in lib/chatStore.ts
 */
export type ChatStoreMessage = CLOUDFLARE_D1ChatMessage;

/**
 * @deprecated Use WhatsAppChatMessage instead.
 * Kept for backward compatibility with existing code in mockChats.ts
 */
export type MockChatMessage = WhatsAppChatMessage;

// ============================================
// Contact/Profile Types
// ============================================

/**
 * Contact profile for chat interfaces
 */
export interface ChatContactProfile {
  id: string;
  name: string;
  avatar: string;
  status: string;
  conversation: NotificationChatMessage[];
}

/**
 * Contact profile with optional messages array
 * Used in WhatsApp-style chat
 */
export interface WhatsAppContactProfile extends ChatContactProfile {
  messages?: WhatsAppChatMessage[];
}
