#!/bin/bash

# Get current date for backup filename
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/backup_${BACKUP_DATE}.sql"

# Create backup
mysqldump -h db -u root -p${MYSQL_ROOT_PASSWORD} ${DB_NAME} > ${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}

# Remove backups older than 7 days
find /backups -name "backup_*.sql.gz" -type f -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
