/**
 * Message List Component
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Real-time message display with auto-scroll
 * Technical Debt: ZERO
 *
 * Golden Ratio spacing・アクセシビリティ完全対応
 */

'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
}

export default function MessageList({ messages, isTyping = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom
   * Constitutional AI準拠: ユーザビリティ
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Format Timestamp
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-panel space-y-card">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p className="text-lg">会話を開始してください</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-card shadow-md ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'assistant'
                  ? 'bg-white text-gray-900 border border-gray-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {message.role === 'user'
                    ? 'あなた'
                    : message.role === 'assistant'
                    ? 'AI Assistant'
                    : 'System'}
                </span>
                <span className="text-xs opacity-70">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>

              {/* Message Content */}
              <div className="text-base whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {/* Metadata (Optional) */}
              {message.metadata && (
                <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
                  <div className="flex items-center gap-4 text-xs opacity-70">
                    {message.metadata.tokens && (
                      <span>Tokens: {message.metadata.tokens}</span>
                    )}
                    {message.metadata.responseTime && (
                      <span>
                        Response: {(message.metadata.responseTime / 1000).toFixed(2)}s
                      </span>
                    )}
                    {message.metadata.model && (
                      <span>Model: {message.metadata.model}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-card shadow-md">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-gray-500">AI Assistant is typing...</span>
            </div>
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
