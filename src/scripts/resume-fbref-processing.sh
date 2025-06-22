#!/bin/bash

# Resume FBRef Processing Script
# Resumes processing with very conservative rate limiting to avoid 429 errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (increased due to persistent 429 errors)
DELAY=5000   # 5 seconds between requests
RETRIES=3
OUTPUT_DIR="data/raw/fbref"

echo -e "${BLUE}🔄 FBRef Processing Recovery Script${NC}"
echo -e "${BLUE}===================================${NC}\n"

# Check if we have partial processing results
if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${RED}❌ No existing processing found in $OUTPUT_DIR${NC}"
    echo -e "${YELLOW}💡 Run the main processing script first: ./scripts/process-all-fbref-incidents.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checking for incomplete processing...${NC}"

# Find years that need processing
YEARS_TO_PROCESS=()
for year in 2022 2023 2024; do
    year_dir="$OUTPUT_DIR/$year"
    if [ -d "$year_dir" ]; then
        summary_file="$year_dir/processing-summary.json"
        if [ -f "$summary_file" ]; then
            # Check if processing was complete
            total=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$summary_file')).total)")
            processed=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$summary_file')).processed)")
            failed=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$summary_file')).failed)")
            
            if [ "$processed" -lt "$total" ] || [ "$failed" -gt 50 ]; then
                echo -e "   ⚠️  $year: $processed/$total processed, $failed failed - needs retry"
                YEARS_TO_PROCESS+=("$year")
            else
                echo -e "   ✅ $year: Complete ($processed/$total processed)"
            fi
        else
            echo -e "   🔄 $year: No summary found - needs processing"
            YEARS_TO_PROCESS+=("$year")
        fi
    else
        echo -e "   🆕 $year: Not started - needs processing"
        YEARS_TO_PROCESS+=("$year")
    fi
done

if [ ${#YEARS_TO_PROCESS[@]} -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All processing appears complete!${NC}"
    exit 0
fi

echo -e "\n${YELLOW}📊 Years needing processing: ${YEARS_TO_PROCESS[*]}${NC}"
echo -e "${YELLOW}⏱️  Estimated time: ~30 minutes per season (5s delay)${NC}\n"

read -p "🚀 Resume processing with conservative rate limiting? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Processing cancelled${NC}"
    exit 0
fi

# Process each year that needs work
for year in "${YEARS_TO_PROCESS[@]}"; do
    echo -e "\n${BLUE}🔄 Resuming $year season processing...${NC}"
    echo -e "${BLUE}====================================${NC}"
    
    # Run with very conservative settings
    if node src/scripts/process-fbref-season.js "$year" --delay "$DELAY" --retries "$RETRIES" --output "$OUTPUT_DIR"; then
        echo -e "${GREEN}✅ $year season completed successfully${NC}"
    else
        echo -e "${RED}❌ $year season encountered errors${NC}"
        echo -e "${YELLOW}💡 Check the failed/ directory for problematic matches${NC}"
    fi
done

echo -e "\n${GREEN}🏁 Recovery processing complete!${NC}"
echo -e "${BLUE}📁 Results in: $OUTPUT_DIR${NC}"

# Show final summary
echo -e "\n${YELLOW}📊 Final Status:${NC}"
for year in 2022 2023 2024; do
    summary_file="$OUTPUT_DIR/$year/processing-summary.json"
    if [ -f "$summary_file" ]; then
        total=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$summary_file')).total)")
        processed=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$summary_file')).processed)")
        clean=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$summary_file')).clean)")
        incidents=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$summary_file')).incidents)")
        failed=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$summary_file')).failed)")
        
        echo -e "   $year: $processed/$total processed | $clean clean | $incidents incidents | $failed failed"
    else
        echo -e "   $year: No data"
    fi
done 