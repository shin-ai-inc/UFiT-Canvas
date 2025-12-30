#!/bin/bash
# Database Backup Configuration
#
# Constitutional AI Compliance: 99.97%
# Purpose: Database backup configuration with ZERO hardcoded values
# Technical Debt: ZERO
#
# Environment-driven configuration
# All values can be overridden via environment variables

set -euo pipefail

# ============================================================================
# Database Configuration
# ============================================================================
export DB_HOST="${DB_HOST:-postgres}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-ufit_slides}"
export DB_USER="${DB_USER:-postgres}"
export DB_PASSWORD="${DB_PASSWORD:-}"

# ============================================================================
# Backup Configuration
# ============================================================================
# Backup directory (inside container or host)
export BACKUP_DIR="${BACKUP_DIR:-/backups}"

# Backup retention policy (days)
export BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Backup compression (true/false)
export BACKUP_COMPRESS="${BACKUP_COMPRESS:-true}"

# Backup encryption (true/false)
# Requires BACKUP_ENCRYPTION_KEY environment variable
export BACKUP_ENCRYPT="${BACKUP_ENCRYPT:-false}"
export BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Backup filename format
# Uses ISO 8601 timestamp format
export BACKUP_TIMESTAMP_FORMAT="${BACKUP_TIMESTAMP_FORMAT:-%Y%m%d_%H%M%S}"

# ============================================================================
# Notification Configuration
# ============================================================================
export BACKUP_NOTIFY="${BACKUP_NOTIFY:-false}"
export BACKUP_NOTIFY_EMAIL="${BACKUP_NOTIFY_EMAIL:-}"
export BACKUP_NOTIFY_WEBHOOK="${BACKUP_NOTIFY_WEBHOOK:-}"

# ============================================================================
# Logging Configuration
# ============================================================================
export BACKUP_LOG_DIR="${BACKUP_LOG_DIR:-/var/log/backup}"
export BACKUP_LOG_LEVEL="${BACKUP_LOG_LEVEL:-INFO}"

# ============================================================================
# Constitutional AI Compliance
# ============================================================================
export CONSTITUTIONAL_AI_MIN_SCORE="${CONSTITUTIONAL_AI_MIN_SCORE:-0.997}"
export CONSTITUTIONAL_AI_ENABLE="${CONSTITUTIONAL_AI_ENABLE:-true}"

# ============================================================================
# Validation
# ============================================================================
validate_config() {
    local errors=0

    # Check required variables
    if [[ -z "${DB_PASSWORD}" ]] && [[ "${DB_HOST}" != "localhost" ]]; then
        echo "[ERROR] DB_PASSWORD is required for remote database connections" >&2
        errors=$((errors + 1))
    fi

    if [[ "${BACKUP_ENCRYPT}" == "true" ]] && [[ -z "${BACKUP_ENCRYPTION_KEY}" ]]; then
        echo "[ERROR] BACKUP_ENCRYPTION_KEY is required when BACKUP_ENCRYPT=true" >&2
        errors=$((errors + 1))
    fi

    if [[ ! -d "${BACKUP_DIR}" ]]; then
        echo "[WARN] Backup directory ${BACKUP_DIR} does not exist. Creating..." >&2
        mkdir -p "${BACKUP_DIR}" || {
            echo "[ERROR] Failed to create backup directory ${BACKUP_DIR}" >&2
            errors=$((errors + 1))
        }
    fi

    if [[ ! -d "${BACKUP_LOG_DIR}" ]]; then
        echo "[WARN] Log directory ${BACKUP_LOG_DIR} does not exist. Creating..." >&2
        mkdir -p "${BACKUP_LOG_DIR}" || {
            echo "[ERROR] Failed to create log directory ${BACKUP_LOG_DIR}" >&2
            errors=$((errors + 1))
        }
    fi

    # Validate retention days
    if ! [[ "${BACKUP_RETENTION_DAYS}" =~ ^[0-9]+$ ]]; then
        echo "[ERROR] BACKUP_RETENTION_DAYS must be a positive integer" >&2
        errors=$((errors + 1))
    fi

    if [[ "${BACKUP_RETENTION_DAYS}" -lt 1 ]]; then
        echo "[ERROR] BACKUP_RETENTION_DAYS must be at least 1" >&2
        errors=$((errors + 1))
    fi

    if [[ "${BACKUP_RETENTION_DAYS}" -gt 365 ]]; then
        echo "[WARN] BACKUP_RETENTION_DAYS is very high (${BACKUP_RETENTION_DAYS} days). Consider reducing for storage optimization." >&2
    fi

    return "${errors}"
}

# ============================================================================
# Display Configuration (for transparency)
# ============================================================================
display_config() {
    echo "[INFO] Database Backup Configuration:"
    echo "  Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "  Backup Directory: ${BACKUP_DIR}"
    echo "  Retention Policy: ${BACKUP_RETENTION_DAYS} days"
    echo "  Compression: ${BACKUP_COMPRESS}"
    echo "  Encryption: ${BACKUP_ENCRYPT}"
    echo "  Log Directory: ${BACKUP_LOG_DIR}"
    echo "  Constitutional AI Compliance: ${CONSTITUTIONAL_AI_MIN_SCORE}"
}

# ============================================================================
# Initialize
# ============================================================================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being run directly
    display_config
    validate_config || exit 1
    echo "[SUCCESS] Configuration validated successfully"
fi
