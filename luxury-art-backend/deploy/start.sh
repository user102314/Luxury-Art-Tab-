#!/usr/bin/env bash
set -euo pipefail
cd /opt/luxury-art
set -a
# shellcheck disable=SC1091
source /opt/luxury-art/.env
set +a
exec /usr/bin/java -Xms256m -Xmx512m -jar /opt/luxury-art/luxury-art-backend-1.0.0.jar
