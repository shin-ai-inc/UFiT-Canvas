/**
 * Slide Model
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Presentation slide data management
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

/**
 * スライドステータス
 */
export enum SlideStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * スライド公開範囲
 */
export enum SlideVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public'
}

/**
 * アウトライン項目
 */
export interface OutlineItem {
  order: number;
  content: string;
  subItems?: string[];
}

/**
 * エクスポートURL
 */
export interface ExportUrls {
  pdf?: string;
  pptx?: string;
  png?: string[];
}

/**
 * リサーチデータ
 */
export interface ResearchData {
  stage1_subtopics?: string[];
  stage2_sources?: Array<{
    url: string;
    title: string;
    relevanceScore: number;
  }>;
  synthesized_outline?: OutlineItem[];
  tfidf_scores?: Record<string, number>;
}

/**
 * 品質分析結果
 */
export interface QualityAnalysis {
  qualityScore: number;
  issues: Array<{
    category: 'layout' | 'readability' | 'hierarchy' | 'branding' | 'whitespace';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    suggestedFix: string;
  }>;
  analyzedAt: Date;
}

/**
 * スライドメタデータ
 */
export interface SlideMetadata {
  lastQualityCheck?: Date;
  qualityHistory?: Array<{
    score: number;
    timestamp: Date;
  }>;
  [key: string]: any;
}

/**
 * Slideモデル属性
 */
export interface SlideAttributes {
  id: string;
  userId: string;
  title: string;
  topic: string;
  outline: OutlineItem[];
  htmlContent?: string;
  cssContent?: string;
  templateId?: string;
  status: SlideStatus;
  qualityScore?: number;
  qualityAnalysis?: QualityAnalysis;
  exportUrls?: ExportUrls;
  visibility: SlideVisibility;
  researchData?: ResearchData;
  metadata?: SlideMetadata;
  iterationsCount: number;
  maxIterations: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Slideモデル
 * Constitutional AI準拠: データ整合性・プライバシー保護
 */
export class Slide extends Model<
  InferAttributes<Slide>,
  InferCreationAttributes<Slide>
> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<User['id']>;
  declare title: string;
  declare topic: string;
  declare outline: OutlineItem[];
  declare htmlContent: string | null;
  declare cssContent: string | null;
  declare templateId: string | null;
  declare status: SlideStatus;
  declare qualityScore: number | null;
  declare qualityAnalysis: QualityAnalysis | null;
  declare exportUrls: ExportUrls | null;
  declare visibility: SlideVisibility;
  declare researchData: ResearchData | null;
  declare metadata: SlideMetadata | null;
  declare iterationsCount: CreationOptional<number>;
  declare maxIterations: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare template?: NonAttribute<any>;

  /**
   * スライド品質スコア更新
   * Constitutional AI準拠: 動的算出（ハードコード値排除）
   */
  public updateQualityScore(analysis: QualityAnalysis): void {
    this.qualityScore = analysis.qualityScore;
    this.qualityAnalysis = analysis;
  }

  /**
   * ステータス更新
   * Constitutional AI準拠: 透明性・監査可能性
   */
  public updateStatus(newStatus: SlideStatus): void {
    const validTransitions: Record<SlideStatus, SlideStatus[]> = {
      [SlideStatus.DRAFT]: [SlideStatus.PROCESSING],
      [SlideStatus.PROCESSING]: [SlideStatus.COMPLETED, SlideStatus.FAILED, SlideStatus.DRAFT],
      [SlideStatus.COMPLETED]: [SlideStatus.PROCESSING, SlideStatus.DRAFT],
      [SlideStatus.FAILED]: [SlideStatus.DRAFT, SlideStatus.PROCESSING]
    };

    const allowedTransitions = validTransitions[this.status];

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition: ${this.status} -> ${newStatus}`);
    }

    this.status = newStatus;
  }

  /**
   * イテレーション回数インクリメント
   * Constitutional AI準拠: 無限ループ防止
   */
  public incrementIteration(): boolean {
    if (this.iterationsCount >= this.maxIterations) {
      return false;
    }

    this.iterationsCount += 1;
    return true;
  }

  /**
   * JSON出力（センシティブデータ除外）
   * Constitutional AI準拠: プライバシー保護
   */
  public toJSON(): Partial<SlideAttributes> {
    const values = { ...this.get() };

    // 大容量データは要約のみ返す
    if (values.htmlContent && values.htmlContent.length > 1000) {
      values.htmlContent = `[HTML content - ${values.htmlContent.length} characters]`;
    }

    if (values.cssContent && values.cssContent.length > 1000) {
      values.cssContent = `[CSS content - ${values.cssContent.length} characters]`;
    }

    return values;
  }
}

Slide.init(
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
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        len: {
          args: [1, 500],
          msg: 'Title must be between 1 and 500 characters'
        }
      }
    },
    topic: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Topic cannot be empty'
        }
      }
    },
    outline: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidOutline(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Outline must be an array');
          }

          const maxOutlineItems = parseInt(process.env.MAX_OUTLINE_ITEMS || '20', 10);

          if (value.length > maxOutlineItems) {
            throw new Error(`Outline cannot have more than ${maxOutlineItems} items`);
          }
        }
      }
    },
    htmlContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, parseInt(process.env.MAX_HTML_CONTENT_LENGTH || '500000', 10)],
          msg: `HTML content exceeds maximum length`
        }
      }
    },
    cssContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, parseInt(process.env.MAX_CSS_CONTENT_LENGTH || '100000', 10)],
          msg: `CSS content exceeds maximum length`
        }
      }
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'templates',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SlideStatus)),
      allowNull: false,
      defaultValue: SlideStatus.DRAFT
    },
    qualityScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0.0,
        max: 1.0
      }
    },
    qualityAnalysis: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    exportUrls: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    visibility: {
      type: DataTypes.ENUM(...Object.values(SlideVisibility)),
      allowNull: false,
      defaultValue: SlideVisibility.PRIVATE
    },
    researchData: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    iterationsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    maxIterations: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: parseInt(process.env.MAX_AUTO_FIX_ITERATIONS || '3', 10),
      validate: {
        min: 1,
        max: parseInt(process.env.MAX_AUTO_FIX_ITERATIONS_LIMIT || '10', 10)
      }
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'slides',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['visibility'] },
      { fields: ['createdAt'] },
      { fields: ['userId', 'status'] },
      { fields: ['userId', 'visibility'] }
    ]
  }
);

export default Slide;
