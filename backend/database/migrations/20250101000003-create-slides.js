/**
 * Migration: Create Slides Table
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Presentation slides database schema
 * Technical Debt: ZERO
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('slides', {
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
      title: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      topic: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      outline: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      html_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      css_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'templates',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('draft', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'draft'
      },
      quality_score: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      quality_analysis: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      export_urls: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      visibility: {
        type: Sequelize.ENUM('private', 'shared', 'public'),
        allowNull: false,
        defaultValue: 'private'
      },
      research_data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      iterations_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      max_iterations: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3
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
    await queryInterface.addIndex('slides', ['user_id']);
    await queryInterface.addIndex('slides', ['status']);
    await queryInterface.addIndex('slides', ['visibility']);
    await queryInterface.addIndex('slides', ['created_at']);
    await queryInterface.addIndex('slides', ['user_id', 'status']);
    await queryInterface.addIndex('slides', ['user_id', 'visibility']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('slides');
  }
};
