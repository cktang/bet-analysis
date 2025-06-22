#!/bin/bash

# Football Data Processing Pipeline
# Automates team mapping updates and data processing for specified seasons
#
# Usage: ./scripts/process-football-data.sh [OPTIONS] YEAR [YEAR2 YEAR3...]
# Options:
#   -u, --update-mapping    Update team mappings before processing
#   -a, --all-seasons      Process all available seasons (2022, 2023, 2024)
#   -e, --enhance-ah       Add Asian handicap analysis to output
#   -f, --force            Overwrite existing output files
#   -v, --verbose          Verbose output
#   -h, --help             Show help
#
# Examples:
#   ./scripts/process-football-data.sh 2024                    # Process 2024 season only
#   ./scripts/process-football-data.sh -u 2023 2024           # Update mappings then process 2023 & 2024
#   ./scripts/process-football-data.sh -a                     # Process all seasons
#   ./scripts/process-football-data.sh -u -a                  # Update mappings then process all seasons

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
UPDATE_MAPPING=false
ALL_SEASONS=false
FORCE=false
VERBOSE=false
ENHANCE_AH=false
YEARS=()

# Available seasons
AVAILABLE_SEASONS=(2022 2023 2024)

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    cat << EOF
Football Data Processing Pipeline

USAGE:
    $0 [OPTIONS] YEAR [YEAR2 YEAR3...]

DESCRIPTION:
    Automates the complete football data processing pipeline including:
    - Team mapping updates (optional)
    - Data merging from FBRef and match files
    - JSON output generation

OPTIONS:
    -u, --update-mapping    Update team mappings before processing data
    -a, --all-seasons      Process all available seasons (${AVAILABLE_SEASONS[*]})
    -e, --enhance-ah       Add Asian handicap analysis and advanced metrics
    -f, --force            Overwrite existing output files without prompting
    -v, --verbose          Enable verbose output
    -h, --help             Show this help message

ARGUMENTS:
    YEAR                   Season year (e.g., 2024 for 2024-2025 season)
                          Available: ${AVAILABLE_SEASONS[*]}

EXAMPLES:
    # Process 2024 season only
    $0 2024

    # Update team mappings then process 2023 and 2024 seasons
    $0 -u 2023 2024

    # Process all available seasons
    $0 -a

    # Update mappings and process all seasons with Asian handicap enhancement
    $0 -u -e -a

    # Full pipeline: update mappings, enhance, all seasons, verbose
    $0 -u -e -a -v

    # Force overwrite and process specific seasons with enhancement
    $0 -f -e 2022 2023

OUTPUT:
    Generated files will be placed in:
    - data/processed/year-YYYY-YYYY.json (e.g., year-2024-2025.json)
    - data/raw/team-mapping.csv (updated if -u flag used)

DEPENDENCIES:
    - Node.js
    - Required npm packages: csv-parser, csv-writer
    - Source scripts: src/scripts/update-team-mapping.js, src/scripts/merge-football-data-json.js

EOF
}

# Function to check if year is valid
is_valid_year() {
    local year=$1
    for valid_year in "${AVAILABLE_SEASONS[@]}"; do
        if [[ "$year" == "$valid_year" ]]; then
            return 0
        fi
    done
    return 1
}

# Function to check if output file exists
output_file_exists() {
    local year=$1
    local season_dir=""
    
    case $year in
        2022) season_dir="2022-2023" ;;
        2023) season_dir="2023-2024" ;;
        2024) season_dir="2024-2025" ;;
    esac
    
    [[ -f "data/processed/year-${season_dir}.json" ]]
}

# Function to get season string from year
get_season_string() {
    local year=$1
    case $year in
        2022) echo "2022-2023" ;;
        2023) echo "2023-2024" ;;
        2024) echo "2024-2025" ;;
        *) echo "" ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    # Check if required scripts exist
    local scripts=("src/scripts/update-team-mapping.js" "src/scripts/merge-football-data-json.js")
    for script in "${scripts[@]}"; do
        if [[ ! -f "$script" ]]; then
            log_error "Required script not found: $script"
            exit 1
        fi
    done
    
    # Check if npm packages are available
    if ! node -e "require('csv-parser'); require('csv-writer')" 2>/dev/null; then
        log_warning "Required npm packages may be missing. Installing..."
        npm install csv-parser csv-writer
    fi
    
    # Check data directories
    if [[ ! -d "data/raw/matches" ]] || [[ ! -d "data/raw/fbref" ]]; then
        log_error "Required data directories not found: data/raw/matches or data/raw/fbref"
        exit 1
    fi
    
    # Create processed directory if it doesn't exist
    mkdir -p data/processed
    
    log_success "Prerequisites check completed"
}

# Function to update team mapping
update_team_mapping() {
    log_info "Updating team mappings..."
    
    if [[ $VERBOSE == true ]]; then
        node src/scripts/update-team-mapping.js
    else
        node src/scripts/update-team-mapping.js > /tmp/team-mapping-update.log 2>&1
        if [[ $? -eq 0 ]]; then
            # Show summary from log
            grep -E "(New mappings added|Total.*mappings)" /tmp/team-mapping-update.log || true
        else
            log_error "Team mapping update failed. Check /tmp/team-mapping-update.log for details"
            cat /tmp/team-mapping-update.log
            exit 1
        fi
    fi
    
    log_success "Team mappings updated successfully"
}

# Function to enhance data with Asian handicap analysis
enhance_asian_handicap() {
    local year=$1
    local season=$(get_season_string $year)
    local input_file="data/processed/year-${season}.json"
    local output_file="data/enhanced/year-${season}-enhanced.json"
    
    log_info "Enhancing $season with Asian handicap analysis..."
    
    # Check if input file exists
    if [[ ! -f "$input_file" ]]; then
        log_error "Input file not found: $input_file"
        return 1
    fi
    
    # Check if lodash is available
    if ! node -e "require('lodash')" 2>/dev/null; then
        log_warning "Installing lodash for Asian handicap enhancement..."
        npm install lodash
    fi
    
    # Create enhanced directory if it doesn't exist
    mkdir -p data/enhanced
    
    # Run enhancement
    if [[ $VERBOSE == true ]]; then
        node src/scripts/enhance-asian-handicap.js "$input_file"
    else
        node src/scripts/enhance-asian-handicap.js "$input_file" > /tmp/enhance-${year}.log 2>&1
        if [[ $? -eq 0 ]]; then
            # Show summary from log
            grep -E "(Enhanced|matches)" /tmp/enhance-${year}.log || true
        else
            log_error "Enhancement failed for season $season. Check /tmp/enhance-${year}.log for details"
            cat /tmp/enhance-${year}.log
            return 1
        fi
    fi
    
    if [[ -f "$output_file" ]]; then
        local file_size=$(ls -lh "$output_file" | awk '{print $5}')
        log_success "Asian handicap enhancement completed for $season (Output: $file_size)"
    else
        log_error "Enhanced file was not created: $output_file"
        return 1
    fi
}

# Function to process a single year
process_year() {
    local year=$1
    local season=$(get_season_string $year)
    local output_file="data/processed/year-${season}.json"
    
    log_info "Processing season $season..."
    
    # Check if output file exists and ask for confirmation if not forcing
    if output_file_exists $year && [[ $FORCE == false ]]; then
        log_warning "Output file already exists: $output_file"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping $season season"
            return 0
        fi
    fi
    
    # Process the year
    local start_time=$(date +%s)
    
    if [[ $VERBOSE == true ]]; then
        node src/scripts/merge-football-data-json.js $year
    else
        node src/scripts/merge-football-data-json.js $year > /tmp/process-${year}.log 2>&1
        if [[ $? -eq 0 ]]; then
            # Show summary from log
            grep -E "(Total matches|With FBRef data|Successfully)" /tmp/process-${year}.log || true
        else
            log_error "Processing failed for season $season. Check /tmp/process-${year}.log for details"
            cat /tmp/process-${year}.log
            return 1
        fi
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ -f "$output_file" ]]; then
        local file_size=$(ls -lh "$output_file" | awk '{print $5}')
        log_success "Season $season processed successfully in ${duration}s (Output: $file_size)"
    else
        log_error "Output file was not created: $output_file"
        return 1
    fi
}

# Function to show processing summary
show_summary() {
    local processed_years=("$@")
    
    echo
    log_info "=== PROCESSING SUMMARY ==="
    
    for year in "${processed_years[@]}"; do
        local season=$(get_season_string $year)
        local output_file="data/processed/year-${season}.json"
        
        if [[ -f "$output_file" ]]; then
            local file_size=$(ls -lh "$output_file" | awk '{print $5}')
            local match_count=$(grep -o '"totalMatches": *[0-9]*' "$output_file" | grep -o '[0-9]*')
            local fbref_count=$(grep -o '"matchesWithFBRef": *[0-9]*' "$output_file" | grep -o '[0-9]*')
            local success_rate=0
            if [[ $match_count -gt 0 ]]; then
                success_rate=$((fbref_count * 100 / match_count))
            fi
            
            echo -e "  ${GREEN}✓${NC} $season: $match_count matches, $fbref_count with FBRef (${success_rate}%) - $file_size"
        else
            echo -e "  ${RED}✗${NC} $season: Processing failed"
        fi
    done
    
    echo
    log_info "Output files location: data/processed/"
    log_info "Team mapping file: data/raw/team-mapping.csv"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--update-mapping)
            UPDATE_MAPPING=true
            shift
            ;;
        -a|--all-seasons)
            ALL_SEASONS=true
            shift
            ;;
        -e|--enhance-ah)
            ENHANCE_AH=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            log_error "Unknown option: $1"
            echo "Use -h or --help for help"
            exit 1
            ;;
        *)
            # Check if it's a valid year
            if is_valid_year "$1"; then
                YEARS+=("$1")
            else
                log_error "Invalid year: $1. Available years: ${AVAILABLE_SEASONS[*]}"
                exit 1
            fi
            shift
            ;;
    esac
done

# If all seasons flag is set, use all available seasons
if [[ $ALL_SEASONS == true ]]; then
    YEARS=("${AVAILABLE_SEASONS[@]}")
fi

# Check if any years were specified
if [[ ${#YEARS[@]} -eq 0 ]]; then
    log_error "No years specified. Use -a for all seasons or specify year(s)"
    echo "Use -h or --help for help"
    exit 1
fi

# Main execution
main() {
    echo "=== FOOTBALL DATA PROCESSING PIPELINE ==="
    echo "Years to process: ${YEARS[*]}"
    echo "Update mappings: $UPDATE_MAPPING"
    echo "Enhance Asian handicap: $ENHANCE_AH"
    echo "Force overwrite: $FORCE"
    echo "Verbose mode: $VERBOSE"
    echo

    # Check prerequisites
    check_prerequisites
    
    # Update team mapping if requested
    if [[ $UPDATE_MAPPING == true ]]; then
        update_team_mapping
        echo
    fi
    
    # Process each year
    local processed_years=()
    local failed_years=()
    
    for year in "${YEARS[@]}"; do
        if process_year $year; then
            processed_years+=($year)
            
            # Enhance with Asian handicap analysis if requested
            if [[ $ENHANCE_AH == true ]]; then
                if enhance_asian_handicap $year; then
                    log_success "Enhancement completed for $year"
                else
                    log_warning "Enhancement failed for $year, but base processing succeeded"
                fi
                echo
            fi
        else
            failed_years+=($year)
        fi
        echo
    done
    
    # Show summary
    if [[ ${#processed_years[@]} -gt 0 ]]; then
        show_summary "${processed_years[@]}"
    fi
    
    # Report failures
    if [[ ${#failed_years[@]} -gt 0 ]]; then
        log_error "Failed to process: ${failed_years[*]}"
        exit 1
    fi
    
    log_success "All processing completed successfully!"
}

# Run main function
main 