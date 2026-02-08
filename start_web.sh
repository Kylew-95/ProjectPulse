#!/bin/bash
# ProjectPulse Web Suite - Automatic Starter

echo "----------------------------------------------------"
echo "🚀 Starting ProjectPulse Web (Backend + Frontend)..."
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

# Start Frontend in Foreground (Interactive Mode)
echo "Starting Frontend (Vite)..."
echo "👉 You can now interact with the Vite CLI (press 'h' for help, 'u' for url, etc.)"
# We enter the directory and run npm run dev in foreground
cd frontendPulse && npm run dev
