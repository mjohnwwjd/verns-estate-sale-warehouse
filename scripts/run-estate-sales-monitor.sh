#!/bin/zsh
set -euo pipefail

cd "/Users/mikesmac/Documents/Codex/2026-05-31/project-title-vern-s-website-create/Vern’s website"
mkdir -p output/estate-sales-monitor

set +e
/usr/bin/env npm run estatesales:monitor >> output/estate-sales-monitor/launchd.log 2>&1
monitor_status=$?
set -e

# Exit code 2 means the monitor found a normal business alert, not that the
# scheduled job broke. Keep launchd clean while preserving real failures.
if [ "$monitor_status" -eq 2 ]; then
  exit 0
fi

exit "$monitor_status"
