#!/bin/sh
set -e

CONFIG_FILE=/usr/share/nginx/html/env-config.js

escape_js() {
  echo "$1" | sed 's/["\]/\\&/g'
}

{
  echo "window.APP_CONFIG = {"
  [ -n "$TARGET_DATE" ] && echo "  targetDate: \"$(escape_js "$TARGET_DATE")\","
  [ -n "$TARGET_TIME" ] && echo "  targetTime: \"$(escape_js "$TARGET_TIME")\","
  [ -n "$COUNTDOWN_REASON" ] && echo "  reason: \"$(escape_js "$COUNTDOWN_REASON")\","
  echo "};"
} > "$CONFIG_FILE"
