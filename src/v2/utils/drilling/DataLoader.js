/**
 * DataLoader - Shared utility for loading enhanced match data
 * Ensures both API and drilling app use the same data loading mechanism
 */

class DataLoader {
    /**
     * Load enhanced match data from files
     * @param {Array} dataFiles - Array of file paths to load
     * @param {Function} fileReader - Function to read files (fs.readFileSync for Node.js, fetch for browser)
     * @returns {Array|Promise<Array>} Array of match objects with consistent structure
     */
    static async loadEnhancedData(dataFiles, fileReader) {
        const allMatches = [];
        
        for (let i = 0; i < dataFiles.length; i++) {
            const file = dataFiles[i];
            console.log(`Loading ${file} (${i + 1}/${dataFiles.length})`);
            
            try {
                const data = await fileReader(file);
                
                // Extract season from filename (e.g., "year-2023-2024-enhanced.json" -> "2023-24")
                const seasonMatch = file.match(/year-(\d{4})-(\d{4})-enhanced\.json/);
                const season = seasonMatch ? `${seasonMatch[1]}-${seasonMatch[2].slice(-2)}` : 'unknown';
                
                if (data.matches) {
                    Object.keys(data.matches).forEach(matchKey => {
                        const match = data.matches[matchKey];
                        // Create unique matchKey including season to avoid collisions
                        const uniqueMatchKey = `${season}_${matchKey}`;
                        match.matchKey = uniqueMatchKey;
                        match.originalMatchKey = matchKey;
                        match.season = season;
                        allMatches.push(match);
                    });
                }
            } catch (error) {
                console.warn(`Error loading file ${file}:`, error.message);
                continue;
            }
        }
        
        console.log(`Total matches loaded: ${allMatches.length}`);
        return allMatches;
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}
if (typeof window !== 'undefined') {
    window.DataLoader = DataLoader;
} 