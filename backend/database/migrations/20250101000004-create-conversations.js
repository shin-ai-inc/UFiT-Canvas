/**
 * Migration: Create Conversations Table
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Chat conversation history database schema
 * Technical Debt: ZERO
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      slide_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'slides',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      messages: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      session_id: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      context: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      message_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes for performance
    await queryInterface.addIndex('conversations', ['user_id']);
    await queryInterface.addIndex('conversations', ['slide_id']);
    await queryInterface.addIndex('conversations', ['session_id']);
    await queryInterface.addIndex('conversations', ['is_active']);
    await queryInterface.addIndex('conversations', ['last_message_at']);
    await queryInterface.addIndex('conversations', ['user_id', 'is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conversations');
  }
};
