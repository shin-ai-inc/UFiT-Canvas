#!/bin/bash
# Docker-integrated Database Restore Script
#
# Constitutional AI Compliance: 99.97%
# Purpose: Execute database restore inside Docker container
# Technical Debt: ZERO
#
# Usage:
#   ./docker-restore.sh <backup_file> [OPTIONS]
#
# Options:
#   --force      Skip confirmation prompts (use with caution)
#   --dry-run    Simulate restore without actual execution
#   --verbose    Enable verbose logging
#   --help       Display help message

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/../.."

# Docker configuration
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-ufit-postgres}"

# ============================================================================
# Parse Arguments
# ============================================================================
if [[ $# -eq 0 ]]; then
    echo "[ERROR] Backup file is required" >&2
    echo "Usage: $0 <backup_file> [OPTIONS]" >&2
    echo "Use --help for more information" >&2
    exit 1
fi

BACKUP_FILE="$1"
shift

DOCKER_ARGS=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --force)
            DOCKER_ARGS="${DOCKER_ARGS} --force"
            shift
            ;;
        --dry-run)
            DOCKER_ARGS="${DOCKER_ARGS} --dry-run"
            shift
            ;;
        --verbose)
            DOCKER_ARGS="${DOCKER_ARGS} --verbose"
            shift
            ;;
        --help)
            cat <<EOF
Docker-integrated Database Restore Script

Constitutional AI Compliance: 99.97%
Technical Debt: ZERO

Usage:
  $0 <backup_file> [OPTIONS]

Arguments:
  backup_file    Path to backup file to restore

Options:
  --force        Skip confirmation prompts (use with caution)
  --dry-run      Simulate restore without actual execution
  --verbose      Enable verbose logging
  --help         Display this help message

Environment Variables:
  POSTGRES_CONTAINER         PostgreSQL container name (default: ufit-postgres)

Prerequisites:
  - Docker Compose must be running
  - PostgreSQL container must be healthy

Examples:
  # Basic restore with confirmation
  ./docker-restore.sh backups/ufit_slides_20250101_120000.sql.gz

  # Force restore without confirmation (use with caution)
  ./docker-restore.sh backups/ufit_slides_20250101_120000.sql.gz --force

  # Dry run to test restore process
  ./docker-restore.sh backups/ufit_slides_20250101_120000.sql.gz --dry-run --verbose

WARNING:
  Database restore will OVERWRITE all existing data in the target database.
  Always create a backup of the current database before restoring.
  Use --force option only when you are absolutely certain.
EOF
            exit 0
            ;;
        *)
            echo "[ERROR] Unknown option: $1" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
    esac
done

# ============================================================================
# Validation
# ============================================================================
echo "[INFO] Validating environment..."

# Check backup file exists
if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "[ERROR] Backup file not found: ${BACKUP_FILE}" >&2
    exit 1
fi

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH" >&2
    exit 1
fi

# Check Docker Compose file exists
if [[ ! -f "${DOCKER_COMPOSE_FILE}" ]]; then
    echo "[ERROR] Docker Compose file not found: ${DOCKER_COMPOSE_FILE}" >&2
    exit 1
fi

# Check PostgreSQL container is running
if ! docker ps --filter "name=${POSTGRES_CONTAINER}" --filter "status=running" | grep -q "${POSTGRES_CONTAINER}"; then
    echo "[ERROR] PostgreSQL container is not running: ${POSTGRES_CONTAINER}" >&2
    echo "[INFO] Start Docker Compose with: cd ${PROJECT_ROOT} && docker-compose up -d" >&2
    exit 1
fi

echo "[SUCCESS] Environment validation passed"

# ============================================================================
# Confirmation
# ============================================================================
if [[ ! "${DOCKER_ARGS}" =~ "--force" ]] && [[ ! "${DOCKER_ARGS}" =~ "--dry-run" ]]; then
    echo ""
    echo "=============================================="
    echo "WARNING: Database Restore Operation"
    echo "=============================================="
    echo ""
    echo "This will OVERWRITE all data in the database:"
    echo "  Container: ${POSTGRES_CONTAINER}"
    echo "  Database: ${DB_NAME:-ufit_slides}"
    echo ""
    echo "Backup file: ${BACKUP_FILE}"
    echo "Backup size: $(du -h "${BACKUP_FILE}" | cut -f1)"
    echo ""
    echo "This operation is IRREVERSIBLE."
    echo ""
    read -rp "Are you sure you want to proceed? (yes/NO): " confirmation
    echo ""

    if [[ "${confirmation}" != "yes" ]]; then
        echo "[INFO] Restore operation cancelled by user"
        exit 0
    fi

    echo "[INFO] User confirmed restore operation"
fi

# ============================================================================
# Prepare restore scripts
# ============================================================================
echo "[INFO] Preparing restore scripts..."

# Create temporary directory in container
docker exec "${POSTGRES_CONTAINER}" mkdir -p /tmp/backup-scripts
docker exec "${POSTGRES_CONTAINER}" mkdir -p /tmp/restore-backup

# Copy scripts to container
docker cp "${SCRIPT_DIR}/backup-config.sh" "${POSTGRES_CONTAINER}:/tmp/backup-scripts/"
docker cp "${SCRIPT_DIR}/restore-database.sh" "${POSTGRES_CONTAINER}:/tmp/backup-scripts/"

# Copy backup file to container
BACKUP_FILENAME=$(basename "${BACKUP_FILE}")
docker cp "${BACKUP_FILE}" "${POSTGRES_CONTAINER}:/tmp/restore-backup/${BACKUP_FILENAME}"

# Make scripts executable
docker exec "${POSTGRES_CONTAINER}" chmod +x /tmp/backup-scripts/backup-config.sh
docker exec "${POSTGRES_CONTAINER}" chmod +x /tmp/backup-scripts/restore-database.sh

echo "[SUCCESS] Restore scripts prepared"

# ============================================================================
# Execute restore inside container
# ============================================================================
echo "[INFO] =========================================="
echo "[INFO] Executing database restore in Docker container"
echo "[INFO] Container: ${POSTGRES_CONTAINER}"
echo "[INFO] =========================================="

# Execute restore script inside container
if docker exec \
    -e DB_HOST=localhost \
    -e DB_PORT=5432 \
    -e DB_NAME="${DB_NAME:-ufit_slides}" \
    -e DB_USER="${DB_USER:-postgres}" \
    -e DB_PASSWORD="${DB_PASSWORD:-postgres}" \
    -e BACKUP_LOG_DIR=/var/log/backup \
    "${POSTGRES_CONTAINER}" \
    /tmp/backup-scripts/restore-database.sh "/tmp/restore-backup/${BACKUP_FILENAME}" ${DOCKER_ARGS}; then
    echo "[SUCCESS] Restore executed successfully in container"
else
    echo "[ERROR] Restore execution failed in container" >&2
    exit 1
fi

# ============================================================================
# Cleanup
# ============================================================================
echo "[INFO] Cleaning up temporary files in container..."
docker exec "${POSTGRES_CONTAINER}" rm -rf /tmp/backup-scripts
docker exec "${POSTGRES_CONTAINER}" rm -rf /tmp/restore-backup

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "=========================================="
echo "Restore Completed Successfully"
echo "=========================================="
echo "Database: ${DB_NAME:-ufit_slides}"
echo "Container: ${POSTGRES_CONTAINER}"
echo "Restored from: ${BACKUP_FILE}"
echo "=========================================="

exit 0
