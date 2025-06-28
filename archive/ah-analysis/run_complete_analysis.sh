#!/bin/bash

# Asian Handicap Complete Analysis Flow Script
# This script runs the complete analysis pipeline and serves the results

echo "🚀 Asian Handicap Analysis - Complete Flow"
echo "=========================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command_exists node; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Error: npm is not installed" 
    echo "   Please install npm (usually comes with Node.js)"
    exit 1
fi

echo "✅ Dependencies check passed"
echo ""

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." &> /dev/null && pwd )"

echo "📁 Working directories:"
echo "   Script: $SCRIPT_DIR"
echo "   Root: $ROOT_DIR"
echo ""

# Change to root directory
cd "$ROOT_DIR"

# Step 1: Install dependencies if needed
echo "📦 Step 1: Installing/updating dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages..."
    npm install
else
    echo "   ✅ Node modules already installed"
fi
echo ""

# Step 2: Run the analysis
echo "🧪 Step 2: Running Asian Handicap analysis..."
echo "   This will test all strategies and generate results..."
echo "   ⏱️  Expected time: 1-3 minutes"
echo ""

node src/ah-analysis/scripts/run_feedback_loop.js

if [ $? -ne 0 ]; then
    echo "❌ Error: Analysis failed"
    exit 1
fi

echo ""
echo "✅ Analysis completed successfully!"
echo ""

# Step 3: Check if results exist
echo "📊 Step 3: Verifying results..."

SUMMARY_FILE="$ROOT_DIR/src/ah-analysis/results/summary.json"
if [ ! -f "$SUMMARY_FILE" ]; then
    echo "❌ Error: Summary file not found at $SUMMARY_FILE"
    exit 1
fi

RESULT_COUNT=$(ls -1 "$ROOT_DIR/src/ah-analysis/results/"*.json 2>/dev/null | wc -l)
echo "   ✅ Found $RESULT_COUNT result files"
echo ""

# Step 4: Start the web server
echo "🌐 Step 4: Starting web server..."
echo "   The report will be available at: http://localhost:8000"
echo ""

# Kill any existing server on port 8000
if lsof -i :8000 >/dev/null 2>&1; then
    echo "   🔄 Stopping existing server on port 8000..."
    lsof -ti :8000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start the server in background
echo "   🚀 Starting report server..."
node "$SCRIPT_DIR/scripts/serve_report.js" &
SERVER_PID=$!

# Wait for server to start
echo "   ⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "   ✅ Server started successfully (PID: $SERVER_PID)"
else
    echo "   ❌ Failed to start server"
    exit 1
fi

echo ""

# Step 5: Open the browser
echo "🌟 Step 5: Opening browser..."

# Try to open browser (cross-platform)
if command_exists open; then
    # macOS
    open "http://localhost:8000"
elif command_exists xdg-open; then
    # Linux
    xdg-open "http://localhost:8000"
elif command_exists start; then
    # Windows
    start "http://localhost:8000"
else
    echo "   ⚠️  Could not auto-open browser"
    echo "   Please manually open: http://localhost:8000"
fi

echo ""
echo "🎉 SUCCESS! Asian Handicap Analysis Complete"
echo "============================================="
echo ""
echo "📊 Analysis Results:"

# Extract key stats from summary
if command_exists jq; then
    TOTAL_STRATEGIES=$(jq -r '.metadata.totalStrategies' "$SUMMARY_FILE")
    PROFITABLE_STRATEGIES=$(jq -r '.metadata.profitableStrategies' "$SUMMARY_FILE")
    BEST_ROI=$(jq -r '.metadata.bestROI' "$SUMMARY_FILE")
    
    echo "   • Total strategies tested: $TOTAL_STRATEGIES"
    echo "   • Profitable strategies: $PROFITABLE_STRATEGIES"
    echo "   • Best ROI: $BEST_ROI%"
else
    echo "   • Summary available in: $SUMMARY_FILE"
fi

echo ""
echo "🌐 Web Interface:"
echo "   • Report URL: http://localhost:8000"
echo "   • Results: http://localhost:8000/results/"
echo ""
echo "⚙️  Server Control:"
echo "   • Server PID: $SERVER_PID"
echo "   • Stop server: kill $SERVER_PID"
echo "   • Or press Ctrl+C to stop this script"
echo ""
echo "📚 Next Steps:"
echo "   1. Review profitable strategies in the web interface"
echo "   2. Analyze betting records for implementation"
echo "   3. Consider risk management and position sizing"
echo ""

# Keep script running and monitor server
echo "🔄 Monitoring server... (Press Ctrl+C to stop)"

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "   Stopping server (PID: $SERVER_PID)..."
        kill $SERVER_PID
        sleep 2
        if kill -0 $SERVER_PID 2>/dev/null; then
            echo "   Force killing server..."
            kill -9 $SERVER_PID
        fi
    fi
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap for graceful shutdown
trap cleanup SIGINT SIGTERM

# Wait for server process
wait $SERVER_PID 