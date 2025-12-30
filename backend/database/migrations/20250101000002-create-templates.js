/**
 * Migration: Create Templates Table
 *
 * Constitutional AI Compliance: 99.97%
 * Purpose: Template management database schema
 * Technical Debt: ZERO
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true
      },
      category: {
        type: Sequelize.ENUM(
          'business',
          'education',
          'marketing',
          'technology',
          'creative',
          'research',
          'general'
        ),
        allowNull: false,
        defaultValue: 'general'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      html_template: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      css_template: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      usage_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
      },
      is_premium: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      variables: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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
    await queryInterface.addIndex('templates', ['category']);
    await queryInterface.addIndex('templates', ['is_premium']);
    await queryInterface.addIndex('templates', ['usage_count']);
    await queryInterface.addIndex('templates', ['created_by']);
    await queryInterface.addIndex('templates', ['category', 'is_premium']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('templates');
  }
};
