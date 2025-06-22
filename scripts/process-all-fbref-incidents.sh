#!/bin/bash

# FBRef Match Incidents Batch Processor
# Processes all available FBRef seasons and extracts match incident data

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DELAY=5000  # 5 seconds between requests (increased due to persistent 429 errors)
RETRIES=3
OUTPUT_DIR="data/raw/fbref"

echo -e "${BLUE}🏈 FBRef Match Incidents Batch Processor${NC}"
echo -e "${BLUE}=======================================${NC}\n"

# Check if Node.js script exists
if [ ! -f "src/scripts/process-fbref-season.js" ]; then
    echo -e "${RED}❌ Error: src/scripts/process-fbref-season.js not found${NC}"
    exit 1
fi

# Find available FBRef data years
echo -e "${YELLOW}🔍 Scanning for available FBRef data...${NC}"
YEARS=()
for dir in data/raw/fbref/*/; do
    if [ -d "$dir" ]; then
        year=$(basename "$dir" | cut -d'-' -f1)
        csv_file="$dir/fbref_${year}_$(($year + 1))_data.csv"
        if [ -f "$csv_file" ]; then
            YEARS+=("$year")
            echo -e "   ✅ Found: $year season ($csv_file)"
        fi
    fi
done

if [ ${#YEARS[@]} -eq 0 ]; then
    echo -e "${RED}❌ No FBRef CSV files found in data/raw/fbref/${NC}"
    exit 1
fi

echo -e "\n${GREEN}📊 Found ${#YEARS[@]} seasons to process: ${YEARS[*]}${NC}\n"

# Confirm processing
read -p "🚀 Process all seasons? This will take ~30 minutes per season (5s delay). (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Processing cancelled${NC}"
    exit 0
fi

# Create main output directory
mkdir -p "$OUTPUT_DIR"

# Process each year
TOTAL_PROCESSED=0
TOTAL_CLEAN=0
TOTAL_INCIDENTS=0
TOTAL_FAILED=0
START_TIME=$(date +%s)

for year in "${YEARS[@]}"; do
    echo -e "\n${BLUE}🏃 Processing $year season...${NC}"
    echo -e "${BLUE}================================${NC}"
    
    # Run the Node.js processor
    if node src/scripts/process-fbref-season.js "$year" --delay "$DELAY" --retries "$RETRIES" --output "$OUTPUT_DIR"; then
        echo -e "${GREEN}✅ $year season completed successfully${NC}"
        
        # Extract results from summary file
        SUMMARY_FILE="$OUTPUT_DIR/$year/processing-summary.json"
        if [ -f "$SUMMARY_FILE" ]; then
            PROCESSED=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SUMMARY_FILE')).processed)")
            CLEAN=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SUMMARY_FILE')).clean)")
            INCIDENTS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SUMMARY_FILE')).incidents)")
            FAILED=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$SUMMARY_FILE')).failed)")
            
            echo -e "   📈 Results: $PROCESSED processed, $CLEAN clean, $INCIDENTS with incidents, $FAILED failed"
            
            TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
            TOTAL_CLEAN=$((TOTAL_CLEAN + CLEAN))
            TOTAL_INCIDENTS=$((TOTAL_INCIDENTS + INCIDENTS))
            TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
        fi
    else
        echo -e "${RED}❌ $year season failed${NC}"
    fi
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Final summary
echo -e "\n${GREEN}🎉 All seasons processed successfully!${NC}"
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}📊 Total Results:${NC}"
echo -e "   • Seasons processed: ${#YEARS[@]}"
echo -e "   • Total matches: $TOTAL_PROCESSED"
echo -e "   • Clean matches: $TOTAL_CLEAN"
echo -e "   • Matches with incidents: $TOTAL_INCIDENTS"
echo -e "   • Failed matches: $TOTAL_FAILED"
echo -e "   • Processing time: ${MINUTES}m ${SECONDS}s"
echo -e "\n${BLUE}📁 Output saved to: $OUTPUT_DIR${NC}"

# Create master summary
MASTER_SUMMARY="$OUTPUT_DIR/master-summary.json"
echo "{
  \"processing_date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"seasons_processed\": [$(printf '\"%s\",' "${YEARS[@]}" | sed 's/,$//')]",
  \"totals\": {
    \"seasons\": ${#YEARS[@]},
    \"matches\": $TOTAL_PROCESSED,
    \"clean_matches\": $TOTAL_CLEAN,
    \"incident_matches\": $TOTAL_INCIDENTS,
    \"failed_matches\": $TOTAL_FAILED
  },
  \"processing_time_seconds\": $DURATION,
  \"output_directory\": \"$OUTPUT_DIR\"
}" > "$MASTER_SUMMARY"

echo -e "${GREEN}📋 Master summary saved to: $MASTER_SUMMARY${NC}"

# Usage instructions
echo -e "\n${YELLOW}💡 Usage Instructions:${NC}"
echo -e "   • Processed match data: $OUTPUT_DIR/*/"
echo -e "   • Individual season summaries: $OUTPUT_DIR/*/processing-summary.json"
echo -e "   • Master summary: $MASTER_SUMMARY"

echo -e "\n${GREEN}✨ Ready for football analysis with fbref data!${NC}" 