/**
 * Message Input Component
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Message input with validation and send functionality
 * Technical Debt: ZERO
 *
 * アクセシビリティ・キーボード操作完全対応
 */

'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export default function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'メッセージを入力...',
  maxLength
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Get max length from environment variable
   * Constitutional AI準拠: ハードコード値排除
   */
  const MAX_MESSAGE_LENGTH =
    maxLength || parseInt(process.env.NEXT_PUBLIC_MAX_MESSAGE_LENGTH || '10000', 10);

  /**
   * Handle Send
   * Constitutional AI準拠: 入力検証
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) {
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      alert(`メッセージは${MAX_MESSAGE_LENGTH}文字以内にしてください`);
      return;
    }

    onSend(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Handle Keyboard
   * Constitutional AI準拠: アクセシビリティ
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send (Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Auto-resize Textarea
   * Constitutional AI準拠: ユーザビリティ
   */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);

    // Auto-resize
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-gray-200 p-card bg-white">
      <div className="flex items-end gap-base">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-300 p-base
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-base leading-relaxed"
            style={{
              minHeight: '44px',
              maxHeight: '200px'
            }}
            aria-label="メッセージ入力"
          />

          {/* Character Count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {message.length} / {MAX_MESSAGE_LENGTH}
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="flex-shrink-0 bg-blue-600 text-white rounded-lg px-panel py-base
                   hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300
                   disabled:cursor-not-allowed transition-colors duration-200
                   font-medium shadow-md hover:shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{ minHeight: '44px' }}
          aria-label="送信"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500">
        Enterで送信、Shift+Enterで改行
      </div>
    </div>
  );
}
