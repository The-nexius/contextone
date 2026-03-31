#!/bin/bash
# Auto-restart script for Context One backend
# Run this in background: nohup ./restart.sh &

cd /home/charbel/contextone/backend

while true; do
    # Check for changes in the app directory
    inotifywait -e modify -e move -e create -e delete -r app/ main.py 2>/dev/null || sleep 5
    
    echo "Changes detected, restarting..."
    source venv/bin/activate
    pkill -f 'uvicorn main:app' || true
    sleep 2
    nohup uvicorn main:app --host 0.0.0.0 --port 8018 > /tmp/contextone.log 2>&1 &
    echo "Restarted at $(date)"
    sleep 5
done