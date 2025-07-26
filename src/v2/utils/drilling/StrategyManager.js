/**
 * StrategyManager - Handles strategy persistence and management
 * Isolates all strategy save/load operations for better organization
 */
class StrategyManager {
    constructor() {
        this.storageKey = 'ah_strategies';
        this.fallbackUrl = 'strategy.json';
    }

    /**
     * Save a strategy to localStorage
     * @param {string} name - Strategy name
     * @param {Object} selectedSide - Selected side configuration
     * @param {Object} selectedSize - Selected size configuration
     * @param {Array} selectedFactors - Array of selected factors
     * @param {Object} currentResults - Current performance results (optional)
     * @returns {Promise<boolean>} Success status
     */
    async saveStrategy(name, selectedSide, selectedSize, selectedFactors, currentResults = null) {
        try {
            if (!name?.trim()) {
                throw new Error('Strategy name is required');
            }
            
            if (!selectedSide || !selectedSize) {
                throw new Error('Both betting side and stake size must be selected');
            }

            const strategy = {
                name: name.trim(),
                timestamp: Date.now(),
                side: selectedSide,
                size: selectedSize,
                factors: selectedFactors || [],
                performance: currentResults ? {
                    roi: currentResults.summary.roi,
                    totalBets: currentResults.summary.totalBets,
                    winRate: currentResults.summary.winRate,
                    totalProfit: currentResults.summary.totalProfit
                } : null,
                version: '1.0'
            };

            // Get existing strategies
            let savedStrategies = await this.getSavedStrategies();
            
            // Check if name already exists
            const existingIndex = savedStrategies.findIndex(s => s.name === name);
            if (existingIndex !== -1) {
                // Replace existing strategy
                savedStrategies[existingIndex] = strategy;
            } else {
                // Add new strategy
                savedStrategies.push(strategy);
            }

            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(savedStrategies));
            
            console.log('💾 Strategy saved:', strategy);
            return true;
            
        } catch (error) {
            console.error('Error saving strategy:', error);
            throw error;
        }
    }

    /**
     * Load a strategy by name
     * @param {string} name - Strategy name to load
     * @returns {Promise<Object|null>} Strategy object or null if not found
     */
    async loadStrategy(name) {
        try {
            const savedStrategies = await this.getSavedStrategies();
            const strategy = savedStrategies.find(s => s.name === name);
            
            if (!strategy) {
                throw new Error(`Strategy "${name}" not found`);
            }
            
            console.log('📂 Strategy loaded:', strategy);
            return strategy;
            
        } catch (error) {
            console.error('Error loading strategy:', error);
            throw error;
        }
    }

    /**
     * Delete a strategy by name
     * @param {string} name - Strategy name to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteStrategy(name) {
        try {
            let savedStrategies = await this.getSavedStrategies();
            const initialLength = savedStrategies.length;
            
            savedStrategies = savedStrategies.filter(s => s.name !== name);
            
            if (savedStrategies.length === initialLength) {
                throw new Error(`Strategy "${name}" not found`);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(savedStrategies));
            console.log(`🗑️ Strategy "${name}" deleted`);
            return true;
            
        } catch (error) {
            console.error('Error deleting strategy:', error);
            throw error;
        }
    }

    /**
     * Export a strategy as JSON
     * @param {string} name - Strategy name (optional, can be unnamed)
     * @param {Object} selectedSide - Selected side configuration
     * @param {Object} selectedSize - Selected size configuration
     * @param {Array} selectedFactors - Array of selected factors
     * @param {Object} currentResults - Current performance results (optional)
     * @returns {void} Triggers file download
     */
    exportStrategy(name, selectedSide, selectedSize, selectedFactors, currentResults = null) {
        try {
            if (!selectedSide || !selectedSize) {
                throw new Error('Both betting side and stake size must be selected before exporting');
            }

            const strategy = {
                name: name?.trim() || 'Unnamed Strategy',
                timestamp: Date.now(),
                side: selectedSide,
                size: selectedSize,
                factors: selectedFactors || [],
                performance: currentResults ? {
                    roi: currentResults.summary.roi,
                    totalBets: currentResults.summary.totalBets,
                    winRate: currentResults.summary.winRate,
                    totalProfit: currentResults.summary.totalProfit
                } : null,
                exportedFrom: 'Asian Handicap Factor Drilling Tool',
                version: '1.0'
            };

            const blob = new Blob([JSON.stringify(strategy, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ah_strategy_${strategy.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log(`📤 Strategy exported: ${a.download}`);
            return a.download;
            
        } catch (error) {
            console.error('Error exporting strategy:', error);
            throw error;
        }
    }

    /**
     * Import a strategy from JSON file
     * @param {File} file - File object from input
     * @returns {Promise<Object>} Imported strategy object
     */
    async importStrategy(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const strategy = JSON.parse(e.target.result);
                    
                    // Validate strategy structure
                    if (!strategy.side || !strategy.size) {
                        throw new Error('Invalid strategy file format - missing required fields');
                    }
                    
                    console.log('📥 Strategy imported:', strategy);
                    resolve(strategy);
                    
                } catch (error) {
                    console.error('Import error:', error);
                    reject(new Error(`Error importing strategy: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Get all saved strategies from localStorage or fallback file
     * @returns {Promise<Array>} Array of strategy objects
     */
    async getSavedStrategies() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const strategies = JSON.parse(saved);
                return Array.isArray(strategies) ? strategies : [];
            }
            
            // If localStorage is empty, try to load from strategy.json
            console.log('📂 No saved strategies in localStorage, loading from strategy.json...');
            try {
                const response = await fetch(this.fallbackUrl);
                if (response.ok) {
                    const strategies = await response.json();
                    console.log(`✅ Loaded ${strategies.length} strategies from strategy.json`);
                    
                    // Save to localStorage for future use
                    if (Array.isArray(strategies)) {
                        localStorage.setItem(this.storageKey, JSON.stringify(strategies));
                        return strategies;
                    }
                } else {
                    console.log('⚠️ strategy.json not found or not accessible');
                }
            } catch (fetchError) {
                console.log('⚠️ Error loading strategy.json:', fetchError.message);
            }
            
            return [];
            
        } catch (error) {
            console.error('Error loading saved strategies:', error);
            return [];
        }
    }

    /**
     * Check if a strategy name already exists
     * @param {string} name - Strategy name to check
     * @returns {Promise<boolean>} True if name exists
     */
    async strategyExists(name) {
        try {
            const strategies = await this.getSavedStrategies();
            return strategies.some(s => s.name === name);
        } catch (error) {
            console.error('Error checking strategy existence:', error);
            return false;
        }
    }

    /**
     * Get strategies sorted by timestamp (newest first)
     * @returns {Promise<Array>} Sorted array of strategy objects
     */
    async getStrategiesSorted() {
        try {
            const strategies = await this.getSavedStrategies();
            return strategies.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } catch (error) {
            console.error('Error getting sorted strategies:', error);
            return [];
        }
    }

    /**
     * Clear all saved strategies (with confirmation)
     * @returns {Promise<boolean>} Success status
     */
    async clearAllStrategies() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🧹 All strategies cleared');
            return true;
        } catch (error) {
            console.error('Error clearing strategies:', error);
            return false;
        }
    }

    /**
     * Validate strategy object structure
     * @param {Object} strategy - Strategy object to validate
     * @returns {boolean} True if valid
     */
    validateStrategy(strategy) {
        if (!strategy || typeof strategy !== 'object') return false;
        if (!strategy.name || typeof strategy.name !== 'string') return false;
        if (!strategy.side || typeof strategy.side !== 'object') return false;
        if (!strategy.size || typeof strategy.size !== 'object') return false;
        if (!Array.isArray(strategy.factors)) return false;
        
        // Check required fields in side and size
        if (!strategy.side.category || !strategy.side.key) return false;
        if (!strategy.size.category || !strategy.size.key) return false;
        
        return true;
    }

    /**
     * Get strategy statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics() {
        try {
            const strategies = await this.getSavedStrategies();
            
            const totalStrategies = strategies.length;
            const strategiesWithPerformance = strategies.filter(s => s.performance).length;
            const avgRoi = strategiesWithPerformance > 0 
                ? strategies
                    .filter(s => s.performance)
                    .reduce((sum, s) => sum + s.performance.roi, 0) / strategiesWithPerformance
                : 0;
            
            const oldestStrategy = strategies.length > 0 
                ? Math.min(...strategies.map(s => s.timestamp || Date.now()))
                : null;
            
            return {
                totalStrategies,
                strategiesWithPerformance,
                strategiesWithoutPerformance: totalStrategies - strategiesWithPerformance,
                averageRoi: UtilityHelper.roundNumber(avgRoi, 2),
                oldestStrategyDate: oldestStrategy ? new Date(oldestStrategy) : null
            };
            
        } catch (error) {
            console.error('Error getting strategy statistics:', error);
            return {
                totalStrategies: 0,
                strategiesWithPerformance: 0,
                strategiesWithoutPerformance: 0,
                averageRoi: 0,
                oldestStrategyDate: null
            };
        }
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StrategyManager;
}
if (typeof window !== 'undefined') {
    window.StrategyManager = StrategyManager;
}