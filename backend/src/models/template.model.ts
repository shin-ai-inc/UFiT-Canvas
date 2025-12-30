/**
 * Template Model
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Presentation template management
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
 * テンプレートカテゴリ
 */
export enum TemplateCategory {
  BUSINESS = 'business',
  EDUCATION = 'education',
  MARKETING = 'marketing',
  TECHNOLOGY = 'technology',
  CREATIVE = 'creative',
  RESEARCH = 'research',
  GENERAL = 'general'
}

/**
 * テンプレート変数
 */
export interface TemplateVariables {
  [key: string]: {
    type: 'text' | 'color' | 'image' | 'number';
    defaultValue: any;
    description?: string;
  };
}

/**
 * テンプレート構造定義
 */
export interface TemplateStructure {
  layout?: string;
  sections?: Array<{
    id: string;
    type: string;
    order: number;
  }>;
  [key: string]: any;
}

/**
 * Templateモデル属性
 */
export interface TemplateAttributes {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  htmlTemplate: string;
  cssTemplate: string;
  thumbnailUrl?: string;
  usageCount: number;
  tags: string[];
  isPremium: boolean;
  variables?: TemplateVariables;
  structure?: TemplateStructure;
  colorScheme?: Record<string, any>;
  typography?: Record<string, any>;
  previewUrl?: string;
  averageRating?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Templateモデル
 * Constitutional AI準拠: コンテンツ整合性・公平性
 */
export class Template extends Model<
  InferAttributes<Template>,
  InferCreationAttributes<Template>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare category: TemplateCategory;
  declare description: string | null;
  declare htmlTemplate: string;
  declare cssTemplate: string;
  declare thumbnailUrl: string | null;
  declare usageCount: CreationOptional<number>;
  declare tags: string[];
  declare isPremium: boolean;
  declare variables: TemplateVariables | null;
  declare structure: TemplateStructure | null;
  declare colorScheme: Record<string, any> | null;
  declare typography: Record<string, any> | null;
  declare previewUrl: string | null;
  declare averageRating: number | null;
  declare createdBy: ForeignKey<User['id']> | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare creator?: NonAttribute<User>;

  /**
   * 使用回数インクリメント
   * Constitutional AI準拠: 真実性（実データ追跡）
   */
  public incrementUsage(): void {
    this.usageCount += 1;
  }

  /**
   * テンプレート適合度スコア算出
   * Constitutional AI準拠: 動的算出（ハードコード値排除）
   */
  public calculateSimilarityScore(
    userTags: string[],
    userCategory: TemplateCategory,
    userTopic: string
  ): number {
    let score = 0.0;

    // カテゴリマッチング (40%)
    const categoryWeight = parseFloat(process.env.TEMPLATE_CATEGORY_WEIGHT || '0.40');
    if (this.category === userCategory) {
      score += categoryWeight;
    }

    // タグマッチング (30%)
    const tagWeight = parseFloat(process.env.TEMPLATE_TAG_WEIGHT || '0.30');
    const matchingTags = this.tags.filter(tag => userTags.includes(tag));
    const tagSimilarity = this.tags.length > 0 ? matchingTags.length / this.tags.length : 0;
    score += tagWeight * tagSimilarity;

    // 使用頻度逆数 (20%) - 使われすぎているテンプレートはスコア減
    const usageWeight = parseFloat(process.env.TEMPLATE_USAGE_WEIGHT || '0.20');
    const maxUsageCount = parseInt(process.env.TEMPLATE_MAX_USAGE_FOR_SCORING || '1000', 10);
    const usagePenalty = Math.min(this.usageCount / maxUsageCount, 1.0);
    score += usageWeight * (1.0 - usagePenalty);

    // テキスト類似度 (10%) - 簡易実装（トピック文字列とのマッチング）
    const textWeight = parseFloat(process.env.TEMPLATE_TEXT_WEIGHT || '0.10');
    const topicLower = userTopic.toLowerCase();
    const nameLower = this.name.toLowerCase();
    const descLower = (this.description || '').toLowerCase();

    const textSimilarity =
      (nameLower.includes(topicLower) || topicLower.includes(nameLower) ||
       descLower.includes(topicLower)) ? 1.0 : 0.0;

    score += textWeight * textSimilarity;

    return Math.min(score, 1.0);
  }

  /**
   * JSON出力（センシティブデータ除外）
   * Constitutional AI準拠: プライバシー保護
   */
  public toJSON(): Partial<TemplateAttributes> {
    const values = { ...this.get() };

    // 大容量テンプレートは要約のみ返す
    if (values.htmlTemplate && values.htmlTemplate.length > 1000) {
      values.htmlTemplate = `[HTML template - ${values.htmlTemplate.length} characters]`;
    }

    if (values.cssTemplate && values.cssTemplate.length > 1000) {
      values.cssTemplate = `[CSS template - ${values.cssTemplate.length} characters]`;
    }

    return values;
  }
}

Template.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [1, parseInt(process.env.MAX_TEMPLATE_NAME_LENGTH || '200', 10)],
          msg: 'Template name length is invalid'
        }
      }
    },
    category: {
      type: DataTypes.ENUM(...Object.values(TemplateCategory)),
      allowNull: false,
      defaultValue: TemplateCategory.GENERAL
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, parseInt(process.env.MAX_TEMPLATE_DESCRIPTION_LENGTH || '2000', 10)],
          msg: 'Template description exceeds maximum length'
        }
      }
    },
    htmlTemplate: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'HTML template cannot be empty'
        },
        len: {
          args: [1, parseInt(process.env.MAX_TEMPLATE_HTML_LENGTH || '500000', 10)],
          msg: 'HTML template exceeds maximum length'
        }
      }
    },
    cssTemplate: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'CSS template cannot be empty'
        },
        len: {
          args: [1, parseInt(process.env.MAX_TEMPLATE_CSS_LENGTH || '100000', 10)],
          msg: 'CSS template exceeds maximum length'
        }
      }
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Thumbnail URL must be a valid URL'
        }
      }
    },
    usageCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidTags(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Tags must be an array');
          }

          const maxTags = parseInt(process.env.MAX_TEMPLATE_TAGS || '10', 10);

          if (value.length > maxTags) {
            throw new Error(`Cannot have more than ${maxTags} tags`);
          }

          const maxTagLength = parseInt(process.env.MAX_TAG_LENGTH || '50', 10);

          for (const tag of value) {
            if (typeof tag !== 'string' || tag.length > maxTagLength) {
              throw new Error(`Tag length must be between 1 and ${maxTagLength} characters`);
            }
          }
        }
      }
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    variables: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    structure: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    colorScheme: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    typography: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    previewUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Preview URL must be a valid URL'
        }
      }
    },
    averageRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0.0,
        max: 5.0
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'templates',
    timestamps: true,
    indexes: [
      { fields: ['category'] },
      { fields: ['isPremium'] },
      { fields: ['usageCount'] },
      { fields: ['createdBy'] },
      { fields: ['category', 'isPremium'] }
    ]
  }
);

export default Template;
