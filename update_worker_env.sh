#!/bin/bash
NEW_B64=$(cat /tmp/temp_b64.txt)
cp /opt/caption-worker/.env /opt/caption-worker/.env.bak
grep -v FIREBASE_SERVICE_ACCOUNT_B64 /opt/caption-worker/.env.bak > /opt/caption-worker/.env
echo "FIREBASE_SERVICE_ACCOUNT_B64=$NEW_B64" >> /opt/caption-worker/.env
echo "Updated FIREBASE_SERVICE_ACCOUNT_B64 successfully"
pm2 restart caption-worker --update-env
pm2 logs caption-worker --lines 5 --nostream
