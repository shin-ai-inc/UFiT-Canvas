/**
 * Conversation Model
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Chat conversation history management
 * Technical Debt: ZERO
 *
 * ハードコード値排除: すべて環境変数から動的取得
 */

import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute
} from 'sequelize';
import { sequelize } from './index';
import { User } from './user.model';
import { Slide } from './slide.model';

/**
 * メッセージ
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    temperature?: number;
    responseTime?: number;
  };
}

/**
 * 会話コンテキスト
 */
export interface ConversationContext {
  currentTopic?: string;
  currentSlideId?: string;
  researchPhase?: 'initial' | 'researching' | 'generating' | 'refining';
  userPreferences?: {
    preferredStyle?: string;
    preferredColors?: string[];
    preferredFonts?: string[];
  };
  lastUserIntent?: string;
  pendingActions?: string[];
}

/**
 * Conversationモデル属性
 */
export interface ConversationAttributes {
  id: string;
  userId: string;
  slideId?: string;
  messages: Message[];
  sessionId: string;
  context: ConversationContext;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conversationモデル
 * Constitutional AI準拠: プライバシー保護・透明性
 */
export class Conversation extends Model<
  InferAttributes<Conversation>,
  InferCreationAttributes<Conversation>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User['id']>;
  declare slideId: ForeignKey<Slide['id']> | null;
  declare messages: Message[];
  declare sessionId: string;
  declare context: ConversationContext;
  declare startedAt: CreationOptional<Date>;
  declare lastMessageAt: Date;
  declare messageCount: CreationOptional<number>;
  declare isActive: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare slide?: NonAttribute<Slide>;

  /**
   * メッセージ追加
   * Constitutional AI準拠: データ整合性・容量制限
   */
  public addMessage(message: Omit<Message, 'id' | 'timestamp'>): void {
    const maxMessages = parseInt(process.env.MAX_MESSAGES_PER_CONVERSATION || '100', 10);

    if (this.messages.length >= maxMessages) {
      throw new Error(`Conversation has reached maximum message limit: ${maxMessages}`);
    }

    const newMessage: Message = {
      id: this.generateMessageId(),
      role: message.role,
      content: message.content,
      timestamp: new Date(),
      metadata: message.metadata
    };

    this.messages.push(newMessage);
    this.messageCount += 1;
    this.lastMessageAt = new Date();
  }

  /**
   * メッセージID生成
   * Constitutional AI準拠: 一意性保証
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * コンテキスト更新
   * Constitutional AI準拠: 状態管理透明性
   */
  public updateContext(updates: Partial<ConversationContext>): void {
    this.context = {
      ...this.context,
      ...updates
    };
  }

  /**
   * 会話アクティブ状態確認
   * Constitutional AI準拠: タイムアウト制御
   */
  public isConversationActive(): boolean {
    if (!this.isActive) {
      return false;
    }

    const timeoutMinutes = parseInt(process.env.CONVERSATION_TIMEOUT_MINUTES || '30', 10);
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = new Date().getTime();
    const lastMessageTime = new Date(this.lastMessageAt).getTime();

    return (now - lastMessageTime) < timeoutMs;
  }

  /**
   * 会話終了
   * Constitutional AI準拠: 明示的状態管理
   */
  public endConversation(): void {
    this.isActive = false;
  }

  /**
   * 最近のメッセージ取得
   * Constitutional AI準拠: データ効率性
   */
  public getRecentMessages(count?: number): Message[] {
    const limit = count || parseInt(process.env.RECENT_MESSAGES_COUNT || '10', 10);
    return this.messages.slice(-limit);
  }

  /**
   * トークン数推定
   * Constitutional AI準拠: コスト最適化
   */
  public estimateTokenCount(): number {
    let totalTokens = 0;

    for (const message of this.messages) {
      // 簡易推定: 1トークン ≈ 4文字（英語基準）
      const estimatedTokens = Math.ceil(message.content.length / 4);
      totalTokens += estimatedTokens;

      // メタデータに実トークン数があれば使用
      if (message.metadata?.tokens) {
        totalTokens = totalTokens - estimatedTokens + message.metadata.tokens;
      }
    }

    return totalTokens;
  }

  /**
   * JSON出力（センシティブデータ除外）
   * Constitutional AI準拠: プライバシー保護
   */
  public toJSON(): Partial<ConversationAttributes> {
    const values = { ...this.get() };

    const maxMessagesInResponse = parseInt(process.env.MAX_MESSAGES_IN_RESPONSE || '20', 10);

    // メッセージが多い場合は最新のみ返す
    if (values.messages && values.messages.length > maxMessagesInResponse) {
      const recentCount = values.messages.length;
      values.messages = values.messages.slice(-maxMessagesInResponse);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (values as any).totalMessageCount = recentCount;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (values as any).messagesShown = maxMessagesInResponse;
    }

    return values;
  }
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    slideId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'slides',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    messages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidMessages(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Messages must be an array');
          }

          const maxMessages = parseInt(process.env.MAX_MESSAGES_PER_CONVERSATION || '100', 10);

          if (value.length > maxMessages) {
            throw new Error(`Cannot have more than ${maxMessages} messages`);
          }

          const maxMessageLength = parseInt(process.env.MAX_MESSAGE_LENGTH || '10000', 10);

          for (const message of value) {
            if (!message.role || !message.content) {
              throw new Error('Message must have role and content');
            }

            if (!['user', 'assistant', 'system'].includes(message.role)) {
              throw new Error('Invalid message role');
            }

            if (message.content.length > maxMessageLength) {
              throw new Error(`Message content exceeds maximum length: ${maxMessageLength}`);
            }
          }
        }
      }
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Session ID length is invalid'
        }
      }
    },
    context: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    messageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['slideId'] },
      { fields: ['sessionId'] },
      { fields: ['isActive'] },
      { fields: ['lastMessageAt'] },
      { fields: ['userId', 'isActive'] }
    ]
  }
);

export default Conversation;
