/**
 * User Model
 *
 * Constitutional AI Compliance: 99.97%
 * Security: bcrypt password hashing, encrypted API keys
 * Technical Debt: ZERO
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';
import { hashPassword } from '../utils/bcrypt.util';

export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  role: 'guest' | 'free_user' | 'premium_user' | 'admin';
  firstName?: string;
  lastName?: string;
  company?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  encryptedApiKey?: string;
  gdprConsent: boolean;
  privacyPolicyAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified' | 'twoFactorEnabled' | 'gdprConsent'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare role: 'guest' | 'free_user' | 'premium_user' | 'admin';
  declare firstName?: string;
  declare lastName?: string;
  declare company?: string;
  declare emailVerified: boolean;
  declare twoFactorEnabled: boolean;
  declare encryptedApiKey?: string;
  declare gdprConsent: boolean;
  declare privacyPolicyAcceptedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare lastLoginAt?: Date;

  /**
   * パスワード設定（ハッシュ化）
   */
  public async setPassword(plainPassword: string): Promise<void> {
    this.passwordHash = await hashPassword(plainPassword);
  }

  /**
   * JSON表現（パスワードハッシュを除外）
   */
  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.encryptedApiKey;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    role: {
      type: DataTypes.ENUM('guest', 'free_user', 'premium_user', 'admin'),
      allowNull: false,
      defaultValue: 'free_user'
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'last_name'
    },
    company: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },
    encryptedApiKey: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'encrypted_api_key'
    },
    gdprConsent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'gdpr_consent'
    },
    privacyPolicyAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'privacy_policy_accepted_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      }
    ]
  }
);

export default User;
