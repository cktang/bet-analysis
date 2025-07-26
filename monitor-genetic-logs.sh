#!/bin/bash

# Monitor Clean Genetic Algorithm Logs
echo "🔍 Monitoring Clean Genetic Algorithm Logs"
echo "========================================="

LOG_DIR="data/v2"

# Check if log directory exists
if [ ! -d "$LOG_DIR" ]; then
    echo "❌ Log directory $LOG_DIR does not exist"
    echo "💡 Start the genetic algorithm first with: node start-clean-genetic.js"
    exit 1
fi

# Find the latest clean genetic log file
LATEST_LOG=$(find "$LOG_DIR" -name "clean-genetic-log-*.txt" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

if [ -z "$LATEST_LOG" ]; then
    echo "❌ No clean genetic log files found in $LOG_DIR"
    echo "💡 Start the genetic algorithm first with: node start-clean-genetic.js"
    exit 1
fi

echo "📁 Monitoring log file: $LATEST_LOG"
echo "📊 Press Ctrl+C to stop monitoring"
echo ""

# Monitor the log file
tail -f "$LATEST_LOG"