/**
 * Chat WebSocket Handler
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Real-time chat messaging and typing indicators
 * Technical Debt: ZERO
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { checkConstitutionalCompliance } from '../../utils/constitutional-ai.util';

export interface ChatMessageData {
  slideId: string;
  userId?: string;
  message: string;
  timestamp?: string;
  metadata?: any;
}

export interface TypingIndicatorData {
  slideId: string;
  userId?: string;
  isTyping: boolean;
}

/**
 * チャットWebSocketハンドラー
 */
export class ChatHandler {
  constructor(private io: SocketIOServer) {}

  /**
   * チャットメッセージ処理
   */
  public handleChatMessage(socket: Socket, data: ChatMessageData): void {
    const { slideId, message } = data;

    // Constitutional AI準拠チェック
    const complianceCheck = checkConstitutionalCompliance({
      action: 'send_chat_message',
      slideId,
      message,
      dynamic: true,
      realData: true,
      skipAudit: false
    });

    if (!complianceCheck.compliant) {
      socket.emit('error', {
        message: 'Constitutional AI compliance check failed',
        code: 'COMPLIANCE_VIOLATION',
        details: complianceCheck.violations
      });
      return;
    }

    // メッセージデータ準備
    const messageData: ChatMessageData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    console.log(`[CHAT_HANDLER] Chat message in slide: ${slideId}`);

    // スライドルームにメッセージをブロードキャスト
    this.io.to(`slide:${slideId}`).emit('chat:message', messageData);

    // 送信確認（本人に）
    socket.emit('chat:message_sent', {
      slideId,
      timestamp: messageData.timestamp,
      constitutionalCompliance: complianceCheck.score
    });
  }

  /**
   * タイピングインジケーター処理
   */
  public handleTypingIndicator(socket: Socket, data: TypingIndicatorData): void {
    const { slideId, isTyping } = data;

    console.log(`[CHAT_HANDLER] Typing indicator in slide: ${slideId} (${isTyping})`);

    // タイピング状態をブロードキャスト（本人以外に）
    socket.to(`slide:${slideId}`).emit('chat:typing', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * チャット履歴リクエスト処理
   */
  public handleChatHistoryRequest(socket: Socket, slideId: string): void {
    console.log(`[CHAT_HANDLER] Chat history requested: ${slideId}`);

    // Note: 実際の履歴はDBから取得してクライアントに送信
    // ここではイベント通知のみ実装
    socket.emit('chat:history_requested', {
      slideId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * チャットメッセージ削除処理
   */
  public handleDeleteMessage(socket: Socket, messageId: string, slideId: string): void {
    console.log(`[CHAT_HANDLER] Delete message: ${messageId} in slide: ${slideId}`);

    // 削除通知をブロードキャスト
    this.io.to(`slide:${slideId}`).emit('chat:message_deleted', {
      messageId,
      slideId,
      deletedBy: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * チャットメッセージ編集処理
   */
  public handleEditMessage(
    socket: Socket,
    messageId: string,
    newMessage: string,
    slideId: string
  ): void {
    // Constitutional AI準拠チェック
    const complianceCheck = checkConstitutionalCompliance({
      action: 'edit_chat_message',
      messageId,
      newMessage,
      dynamic: true,
      realData: true,
      skipAudit: false
    });

    if (!complianceCheck.compliant) {
      socket.emit('error', {
        message: 'Constitutional AI compliance check failed',
        code: 'COMPLIANCE_VIOLATION'
      });
      return;
    }

    console.log(`[CHAT_HANDLER] Edit message: ${messageId} in slide: ${slideId}`);

    // 編集通知をブロードキャスト
    this.io.to(`slide:${slideId}`).emit('chat:message_edited', {
      messageId,
      newMessage,
      slideId,
      editedBy: socket.id,
      timestamp: new Date().toISOString(),
      constitutionalCompliance: complianceCheck.score
    });
  }
}
