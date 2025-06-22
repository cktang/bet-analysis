const fs = require('fs');
const path = require('path');

// Find where the AH profit data actually is
function findAHData() {
    console.log('🔍 Finding AH profit data location...\n');
    
    const seasonPath = path.join(__dirname, '../../data/processed/year-2023-2024.json');
    const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
    const match = Object.values(seasonData.matches)[0];
    
    console.log('Match keys:', Object.keys(match));
    console.log('\nEnhanced keys:', Object.keys(match.enhanced || {}));
    
    // Look for any field containing "profit" or "asian"
    function searchForKey(obj, searchTerm, path = '') {
        if (typeof obj !== 'object' || obj === null) return;
        
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
                console.log(`Found "${searchTerm}" in: ${currentPath}`);
                if (typeof value === 'object' && value !== null) {
                    console.log(`  Keys:`, Object.keys(value));
                    if (value.homeProfit !== undefined) {
                        console.log(`  ✅ Has homeProfit: ${value.homeProfit}`);
                    }
                }
            }
            
            if (typeof value === 'object' && value !== null) {
                searchForKey(value, searchTerm, currentPath);
            }
        }
    }
    
    console.log('\nSearching for "profit":');
    searchForKey(match, 'profit');
    
    console.log('\nSearching for "asian":');
    searchForKey(match, 'asian');
    
    console.log('\nSearching for "handicap":');
    searchForKey(match, 'handicap');
    
    // Let's also check what's in enhanced
    console.log('\nFull enhanced structure:');
    if (match.enhanced) {
        Object.keys(match.enhanced).forEach(key => {
            console.log(`enhanced.${key}:`, typeof match.enhanced[key]);
            if (typeof match.enhanced[key] === 'object' && match.enhanced[key] !== null) {
                console.log(`  Sub-keys:`, Object.keys(match.enhanced[key]));
            }
        });
    }
}

findAHData();