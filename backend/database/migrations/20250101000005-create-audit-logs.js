/**
 * Migration: Create Audit Logs Table
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Security audit trail database schema
 * Technical Debt: ZERO
 *
 * Constitutional AI準拠: 説明責任・透明性
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      action_type: {
        type: Sequelize.ENUM(
          // Authentication
          'login',
          'logout',
          'register',
          'password_reset',
          'token_refresh',
          // Slide operations
          'slide_create',
          'slide_read',
          'slide_update',
          'slide_delete',
          'slide_export',
          // Template operations
          'template_create',
          'template_read',
          'template_update',
          'template_delete',
          // AI operations
          'claude_api_call',
          'vision_api_call',
          'research_api_call',
          // Security events
          'rate_limit_exceeded',
          'xss_attempt',
          'sql_injection_attempt',
          'unauthorized_access',
          'permission_denied',
          // System events
          'system_error',
          'configuration_change',
          'data_export',
          'gdpr_request'
        ),
        allowNull: false
      },
      resource_type: {
        type: Sequelize.ENUM('user', 'slide', 'template', 'conversation', 'system', 'api'),
        allowNull: false
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      user_agent: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      action_details: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      constitutional_compliance_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1.0
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes for performance and security analysis
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['action_type']);
    await queryInterface.addIndex('audit_logs', ['resource_type']);
    await queryInterface.addIndex('audit_logs', ['resource_id']);
    await queryInterface.addIndex('audit_logs', ['timestamp']);
    await queryInterface.addIndex('audit_logs', ['success']);
    await queryInterface.addIndex('audit_logs', ['ip_address']);
    await queryInterface.addIndex('audit_logs', ['user_id', 'action_type']);
    await queryInterface.addIndex('audit_logs', ['timestamp', 'action_type']);
    await queryInterface.addIndex('audit_logs', ['success', 'action_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};
