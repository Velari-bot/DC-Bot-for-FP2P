#!/bin/bash
cd /opt/caption-worker
echo "Checking environment variable consistency..."

# Check code usage
grep "process.env.WORKER_SECRET" index.js > /dev/null && USES_OLD=1 || USES_OLD=0
grep "process.env.CAPTION_WORKER_SECRET" index.js > /dev/null && USES_NEW=1 || USES_NEW=0

echo "Code checks: WORKER_SECRET=$USES_OLD, CAPTION_WORKER_SECRET=$USES_NEW"

if [ "$USES_OLD" -eq 1 ]; then
    if ! grep -q "^WORKER_SECRET=" .env; then
        echo "Missing WORKER_SECRET in .env"
        if grep -q "^CAPTION_WORKER_SECRET=" .env; then
            echo "Found CAPTION_WORKER_SECRET, copying to WORKER_SECRET"
            VAL=$(grep "^CAPTION_WORKER_SECRET=" .env | cut -d'=' -f2-)
            echo "WORKER_SECRET=$VAL" >> .env
            echo "Restarting worker..."
            pm2 restart caption-worker --update-env
        fi
    else
        echo "WORKER_SECRET already exists in .env"
    fi
fi
