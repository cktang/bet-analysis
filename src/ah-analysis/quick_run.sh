#!/bin/bash

# Quick Asian Handicap Analysis Runner
# Simple script to run analysis and serve results

echo "🚀 Quick AH Analysis Runner"
echo "=========================="

# Get script directory and change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Working from: $PROJECT_ROOT"
echo "📊 Running analysis..."
node src/ah-analysis/scripts/run_feedback_loop.js

echo ""
echo "🌐 Starting server..."
node src/ah-analysis/scripts/serve_report.js &
SERVER_PID=$!

echo "✅ Server started (PID: $SERVER_PID)"
echo "📱 Open: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop server"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping server...'; kill $SERVER_PID 2>/dev/null; echo '✅ Done'; exit 0" SIGINT SIGTERM

wait $SERVER_PID 