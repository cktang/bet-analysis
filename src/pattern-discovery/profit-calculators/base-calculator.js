/**
 * Base Profit Calculator Interface
 * 
 * All profit calculators must implement this interface to be compatible
 * with the generic drilling app.
 */

class BaseProfitCalculator {
    
    /**
     * Calculate profit for a single record
     * 
     * @param {Object} record - Data record containing all necessary fields
     * @param {Object} config - Configuration object from drilling-config.json
     * @returns {Object} Result with { profit, outcome, details }
     */
    static calculate(record, config) {
        throw new Error('calculate() method must be implemented by subclass');
    }
    
    /**
     * Validate that a record has all required fields for calculation
     * 
     * @param {Object} record - Data record to validate
     * @param {Object} config - Configuration object
     * @returns {boolean} True if valid, false otherwise
     */
    static validateRecord(record, config) {
        throw new Error('validateRecord() method must be implemented by subclass');
    }
    
    /**
     * Get human-readable description of the calculation method
     * 
     * @returns {string} Description
     */
    static getDescription() {
        throw new Error('getDescription() method must be implemented by subclass');
    }
    
    /**
     * Get required fields for this calculator
     * 
     * @returns {Array} Array of required field paths
     */
    static getRequiredFields() {
        throw new Error('getRequiredFields() method must be implemented by subclass');
    }
}