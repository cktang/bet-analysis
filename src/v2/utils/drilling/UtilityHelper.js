/**
 * UtilityHelper - Reusable utility functions
 * This class contains pure functions that can be used both frontend and backend
 */
class UtilityHelper {
    /**
     * Format a number as currency
     * @param {number} value - The value to format
     * @returns {string} Formatted currency string
     */
    static formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    /**
     * Format a number as percentage with sign
     * @param {number} value - The value to format
     * @returns {string} Formatted percentage string
     */
    static formatPercent(value) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }

    /**
     * Get CSS class for profit display based on value
     * @param {number} value - The profit value
     * @returns {string} CSS class name
     */
    static getProfitColorClass(value) {
        if (value > 0) return 'profit-positive';
        if (value < 0) return 'profit-negative';
        return 'profit-neutral';
    }

    /**
     * Convert camelCase or snake_case strings to Start Case
     * @param {string} str - String to convert
     * @returns {string} String in Start Case
     */
    static toStartCase(str) {
        return str
            // Insert space before uppercase letters (for camelCase)
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            // Insert space before numbers
            .replace(/([a-zA-Z])(\d)/g, '$1 $2')
            // Insert space after numbers
            .replace(/(\d)([a-zA-Z])/g, '$1 $2')
            // Split by various delimiters and join with spaces
            .replace(/[_-]+/g, ' ')
            // Capitalize first letter of each word
            .replace(/\b\w/g, l => l.toUpperCase())
            // Clean up multiple spaces
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Abbreviate team names to avoid display issues
     * @param {string} teamName - Full team name
     * @returns {string} Abbreviated team name
     */
    static abbreviateTeamName(teamName) {
        // Smart team name abbreviations to avoid collisions
        const abbreviations = {
            'Manchester United': 'Man Utd',
            'Manchester City': 'Man City',
            'Tottenham Hotspur': 'Spurs',
            'Brighton & Hove Albion': 'Brighton',
            'Brighton': 'Brighton',
            'Newcastle United': 'Newcastle',
            'Sheffield United': 'Sheffield',
            'West Ham United': 'West Ham',
            'Wolverhampton Wanderers': 'Wolves',
            'Wolverhampton': 'Wolves',
            'Leicester City': 'Leicester',
            'Norwich City': 'Norwich',
            'Crystal Palace': 'C Palace',
            'Nottingham Forest': "Nott'm F",
            'Aston Villa': 'Villa',
            'Southampton': 'Saints',
            'Bournemouth': 'Bmth'
        };
        
        // Use custom abbreviation if available
        if (abbreviations[teamName]) {
            return abbreviations[teamName];
        }
        
        // Fallback: take first word and limit to 8 chars
        const firstWord = teamName.split(' ')[0];
        return firstWord.length > 8 ? firstWord.substring(0, 8) : firstWord;
    }

    /**
     * Get relative time string (e.g., "2h ago", "3d ago")
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Human readable time ago string
     */
    static getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    /**
     * Calculate ROI background bar properties for visual display
     * @param {number} roi - ROI percentage
     * @returns {Object} Object with width and color properties
     */
    static calculateRoiBar(roi) {
        if (!roi || roi === 0) {
            return { width: '0%', color: 'transparent' };
        }
        
        // Scale ROI to a reasonable bar width (max 100% width for ±20% ROI)
        const maxRoi = 20; // ROI values beyond ±20% will be capped for display
        const scaledRoi = Math.max(-maxRoi, Math.min(maxRoi, roi));
        const width = Math.abs(scaledRoi / maxRoi) * 100;
        
        // Color based on positive/negative ROI
        const color = roi > 0 ? '#00ff88' : '#ff0000'; // Light green for positive, bright red for negative
        
        return {
            width: `${width}%`,
            color: color
        };
    }

    /**
     * Evaluate a factor expression against match data with caching
     * @param {Object} match - Match data object
     * @param {string} expression - JavaScript expression to evaluate
     * @param {Map} cache - Optional cache map for performance
     * @returns {*} Result of expression evaluation
     */
    static evaluateFactorExpression(match, expression, cache = null) {
        // Create cache key if cache is provided
        const cacheKey = cache ? `${match.matchKey}|${expression}` : null;
        
        // Check cache first
        if (cache && cacheKey && cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }
        
        // Calculate result - factors work directly with raw match data
        let result;
        try {
            const { preMatch, timeSeries } = match;
            result = new Function('match', 'preMatch', 'timeSeries', 'Math', `return ${expression}`)(match, preMatch, timeSeries, Math);
            
        } catch (error) {
            console.warn(`Error evaluating factor expression: ${expression}`, error);
            result = false;
        }
        
        // Cache the result if cache is provided
        if (cache && cacheKey) {
            cache.set(cacheKey, result);
        }
        
        return result;
    }

    /**
     * Generate a hash for betting configuration to enable caching
     * @param {Array} matches - Array of match objects
     * @param {Object} sideSelection - Side selection object
     * @param {Object} sizeSelection - Size selection object
     * @returns {string} Hash string for the configuration
     */
    static getBettingConfigHash(matches, sideSelection, sizeSelection) {
        const matchKeys = matches.map(m => m.matchKey).sort().join(',');
        
        // Handle different sideSelection formats
        const sideKey = sideSelection.category && sideSelection.key 
            ? `${sideSelection.category}:${sideSelection.key}`
            : `${sideSelection.betSide || 'unknown'}:${sideSelection.description || ''}`;
            
        // Handle different sizeSelection formats  
        const sizeKey = sizeSelection.category && sizeSelection.key
            ? `${sizeSelection.category}:${sizeSelection.key}`
            : `${sizeSelection.expression || 'unknown'}:${sizeSelection.stakingMethod || ''}`;
            
        return `${matchKeys}|${sideKey}|${sizeKey}`;
    }

    /**
     * Round number to specified decimal places
     * @param {number} value - Number to round
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {number} Rounded number
     */
    static roundNumber(value, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /**
     * Check if a value is a valid number
     * @param {*} value - Value to check
     * @returns {boolean} True if valid number
     */
    static isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }

    /**
     * Safely get nested object property
     * @param {Object} obj - Object to traverse
     * @param {string} path - Dot-notation path (e.g., 'a.b.c')
     * @param {*} defaultValue - Default value if path doesn't exist
     * @returns {*} Value at path or default value
     */
    static getNestedProperty(obj, path, defaultValue = null) {
        try {
            return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        return obj;
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UtilityHelper;
}
if (typeof window !== 'undefined') {
    window.UtilityHelper = UtilityHelper;
}