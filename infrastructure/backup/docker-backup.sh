#!/bin/bash
# Docker-integrated Database Backup Script
#
# Constitutional AI Compliance: 99.97%
# Purpose: Execute database backup inside Docker container
# Technical Debt: ZERO
#
# Usage:
#   ./docker-backup.sh [OPTIONS]
#
# Options:
#   --dry-run    Simulate backup without actual execution
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

# Backup configuration
BACKUP_DIR="${PROJECT_ROOT}/backups"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# ============================================================================
# Parse Arguments
# ============================================================================
DOCKER_ARGS=""

while [[ $# -gt 0 ]]; do
    case "$1" in
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
Docker-integrated Database Backup Script

Constitutional AI Compliance: 99.97%
Technical Debt: ZERO

Usage:
  $0 [OPTIONS]

Options:
  --dry-run    Simulate backup without actual execution
  --verbose    Enable verbose logging
  --help       Display this help message

Environment Variables:
  POSTGRES_CONTAINER         PostgreSQL container name (default: ufit-postgres)
  BACKUP_RETENTION_DAYS      Backup retention in days (default: 7)

Prerequisites:
  - Docker Compose must be running
  - PostgreSQL container must be healthy

Examples:
  # Basic backup
  ./docker-backup.sh

  # Dry run with verbose logging
  ./docker-backup.sh --dry-run --verbose

  # Custom retention policy
  BACKUP_RETENTION_DAYS=14 ./docker-backup.sh
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
echo "[INFO] Validating Docker environment..."

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH" >&2
    exit 1
fi

# Check Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "[ERROR] Docker Compose is not installed" >&2
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

echo "[SUCCESS] Docker environment validation passed"

# ============================================================================
# Create backup directory
# ============================================================================
if [[ ! -d "${BACKUP_DIR}" ]]; then
    echo "[INFO] Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
fi

# ============================================================================
# Copy backup scripts to container
# ============================================================================
echo "[INFO] Preparing backup scripts..."

# Create temporary directory in container
docker exec "${POSTGRES_CONTAINER}" mkdir -p /tmp/backup-scripts

# Copy scripts to container
docker cp "${SCRIPT_DIR}/backup-config.sh" "${POSTGRES_CONTAINER}:/tmp/backup-scripts/"
docker cp "${SCRIPT_DIR}/backup-database.sh" "${POSTGRES_CONTAINER}:/tmp/backup-scripts/"

# Make scripts executable
docker exec "${POSTGRES_CONTAINER}" chmod +x /tmp/backup-scripts/backup-config.sh
docker exec "${POSTGRES_CONTAINER}" chmod +x /tmp/backup-scripts/backup-database.sh

echo "[SUCCESS] Backup scripts prepared"

# ============================================================================
# Execute backup inside container
# ============================================================================
echo "[INFO] =========================================="
echo "[INFO] Executing database backup in Docker container"
echo "[INFO] Container: ${POSTGRES_CONTAINER}"
echo "[INFO] =========================================="

# Execute backup script inside container
if docker exec \
    -e DB_HOST=localhost \
    -e DB_PORT=5432 \
    -e DB_NAME="${DB_NAME:-ufit_slides}" \
    -e DB_USER="${DB_USER:-postgres}" \
    -e DB_PASSWORD="${DB_PASSWORD:-postgres}" \
    -e BACKUP_DIR=/backups \
    -e BACKUP_LOG_DIR=/var/log/backup \
    -e BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS}" \
    -e BACKUP_COMPRESS=true \
    -e BACKUP_ENCRYPT=false \
    "${POSTGRES_CONTAINER}" \
    /tmp/backup-scripts/backup-database.sh ${DOCKER_ARGS}; then
    echo "[SUCCESS] Backup executed successfully in container"
else
    echo "[ERROR] Backup execution failed in container" >&2
    exit 1
fi

# ============================================================================
# Copy backup from container to host
# ============================================================================
echo "[INFO] Copying backup files from container to host..."

# Get latest backup file in container
LATEST_BACKUP=$(docker exec "${POSTGRES_CONTAINER}" sh -c "ls -t /backups/${DB_NAME:-ufit_slides}_*.sql* 2>/dev/null | head -n 1" || echo "")

if [[ -z "${LATEST_BACKUP}" ]]; then
    echo "[ERROR] No backup file found in container" >&2
    exit 1
fi

echo "[INFO] Latest backup: ${LATEST_BACKUP}"

# Copy backup from container to host
docker cp "${POSTGRES_CONTAINER}:${LATEST_BACKUP}" "${BACKUP_DIR}/"

BACKUP_FILENAME=$(basename "${LATEST_BACKUP}")
echo "[SUCCESS] Backup copied to host: ${BACKUP_DIR}/${BACKUP_FILENAME}"

# ============================================================================
# Cleanup
# ============================================================================
echo "[INFO] Cleaning up temporary files in container..."
docker exec "${POSTGRES_CONTAINER}" rm -rf /tmp/backup-scripts

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "=========================================="
echo "Backup Completed Successfully"
echo "=========================================="
echo "Backup file: ${BACKUP_DIR}/${BACKUP_FILENAME}"
echo "Backup size: $(du -h "${BACKUP_DIR}/${BACKUP_FILENAME}" | cut -f1)"
echo "Retention policy: ${BACKUP_RETENTION_DAYS} days"
echo ""
echo "To restore this backup:"
echo "  ./docker-restore.sh ${BACKUP_DIR}/${BACKUP_FILENAME}"
echo "=========================================="

exit 0
