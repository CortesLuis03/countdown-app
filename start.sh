#!/bin/sh
/env-inject.sh
exec nginx -g "daemon off;"
