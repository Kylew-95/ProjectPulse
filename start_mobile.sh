#!/bin/bash
# ProjectPulse Mobile Suite - Automatic Starter

echo "----------------------------------------------------"
echo "🚀 Starting ProjectPulse Backend + Mobile..."
echo "----------------------------------------------------"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    # Kill all child processes in the current process group
    kill $(jobs -p) 2>/dev/null
}
trap cleanup EXIT INT TERM

# Start Backend
echo "Starting Backend (Python)..."
# Run backend in background
(cd pythonPulse && (python src/main.py || python3 src/main.py)) &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start Mobile in Foreground (Interactive Mode)
echo "Starting Mobile (Expo)..."
echo "👉 You can now interact with the Expo CLI (press 'a' for Android, 'r' to reload, etc.)"
# We enter the directory and run npm start in foreground
cd mobilepulse && npm start
