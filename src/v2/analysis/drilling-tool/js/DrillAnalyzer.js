/**
 * DrillAnalyzer - Main orchestrator class for the drilling tool
 * Coordinates all components and manages application state
 */
class DrillAnalyzer {
    constructor() {
        // Initialize core components
        this.calculationEngine = new CalculationEngine();
        this.strategyManager = new StrategyManager();
        this.uiRenderer = new UIRenderer(this.calculationEngine);
        
        // Application state
        this.allMatches = [];
        this.selectedSide = null;
        this.selectedSize = null;
        this.selectedFactors = [];
        this.currentResults = null;
        this.factorDefinitions = {};
        
        // Bind event handlers to maintain context
        this.setupEventHandlers();
    }

    /**
     * Initialize the application
     */
    async initialize() {
        console.log('🚀 Asian Handicap Factor Analysis Tool with Performance Optimization');
        console.log('💡 Performance Features:');
        console.log('   • Factor evaluation caching');
        console.log('   • Asian Handicap calculation caching');
        console.log('   • Match filtering caching');
        console.log('   • Complete betting result caching');
        console.log('🎯 Interactive Features:');
        console.log('   • Click team names in betting records for detailed analysis');
        console.log('   • Complete match history and streak analysis per team');
        console.log('💾 Strategy Management:');
        console.log('   • Save/load factor combinations with localStorage');
        console.log('   • Export/import strategies as JSON files');
        console.log('   • Performance tracking for saved strategies');
        console.log('⌨️  Shortcuts: Ctrl+Shift+C = Clear cache, ESC = Close modal');
        
        this.uiRenderer.updateStatus('Initializing...');
        
        try {
            await this.loadData();
            
            // Debug: Log match data structure
            if (this.allMatches.length > 0) {
                console.log('🔍 MATCH DATA STRUCTURE DEBUG:');
                console.log('Sample match object:', this.allMatches[0]);
                console.log('Match fields:', Object.keys(this.allMatches[0]));
                if (this.allMatches[0].preMatch) {
                    console.log('preMatch fields:', Object.keys(this.allMatches[0].preMatch));
                    if (this.allMatches[0].preMatch.match) {
                        console.log('preMatch.match fields:', Object.keys(this.allMatches[0].preMatch.match));
                    }
                    if (this.allMatches[0].preMatch.fbref) {
                        console.log('preMatch.fbref fields:', Object.keys(this.allMatches[0].preMatch.fbref));
                    }
                }
            }
            
        } catch (error) {
            console.error('Error initializing application:', error);
            this.uiRenderer.updateStatus('Error initializing - check console');
        }
    }

    /**
     * Setup keyboard shortcuts and other event handlers
     */
    setupEventHandlers() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+C to clear cache
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                this.calculationEngine.clearCache();
                this.uiRenderer.updateStatus('Cache cleared - next calculations will be slower but fresh');
                setTimeout(() => {
                    const baseStatus = `Ready | ${Object.keys(this.factorDefinitions).length} categories | ${this.allMatches.length} matches`;
                    this.uiRenderer.updateStatusWithPerformance(baseStatus);
                }, 2000);
            }
            
            // ESC to close modal
            if (e.key === 'Escape') {
                this.closeTeamModal();
            }
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('teamModal');
            if (event.target === modal) {
                this.closeTeamModal();
            }
        });
    }

    /**
     * Load factor definitions and match data
     */
    async loadData() {
        try {
            this.uiRenderer.updateStatus('Loading factor definitions...');
            
            // Load factor definitions first
            await this.loadFactorDefinitions();
            
            this.uiRenderer.updateStatus('Loading match data...');
            
            const dataFiles = [
                '/analysis/data/enhanced/year-2022-2023-enhanced.json',
                '/analysis/data/enhanced/year-2023-2024-enhanced.json',
                '/analysis/data/enhanced/year-2024-2025-enhanced.json'
            ];
            
            // Create file reader function for browser environment
            const fileReader = async (filePath) => {
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
                }
                return await response.json();
            };
            
            this.allMatches = await DataLoader.loadEnhancedData(dataFiles, fileReader);
            
            const baseStatus = `Ready | ${Object.keys(this.factorDefinitions).length} categories | ${this.allMatches.length} matches`;
            this.uiRenderer.updateStatusWithPerformance(baseStatus);
            
            // Initial render
            this.renderFactorSelection();
            this.renderSelectedFactors();
            this.updateResults();
            await this.uiRenderer.renderSavedStrategies(this.strategyManager);
            this.updateStrategyControls();
            
        } catch (error) {
            this.uiRenderer.updateStatus(`ERROR: ${error.message}`);
            
            document.getElementById('results').innerHTML = `
                <div class="error">
                    <strong>Data Loading Error</strong><br>
                    ${error.message}<br>
                    Make sure you're serving this page from a web server and both the enhanced data files and factor_definitions.json are available.
                </div>
            `;
            
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Load factor definitions from external file
     */
    async loadFactorDefinitions() {
        try {
                    // Add cache-busting timestamp to ensure fresh data
        const cacheBuster = new Date().getTime();
        const response = await fetch(`/analysis/utils/drilling/factor_definitions.json?v=${cacheBuster}`);
            if (!response.ok) {
                throw new Error(`Failed to load factor definitions: ${response.statusText}`);
            }
            
            this.factorDefinitions = await response.json();
            console.log('✅ Factor definitions loaded:', Object.keys(this.factorDefinitions));
            
        } catch (error) {
            console.error('❌ Error loading factor definitions:', error);
            
            // Fallback to minimal factors if loading fails
            this.factorDefinitions = {
                side: {
                    home: { expression: "true", description: "Bet on home team", betSide: "home" },
                    away: { expression: "true", description: "Bet on away team", betSide: "away" },
                    higherOdds: { expression: "true", description: "Bet on team with higher odds", betSide: "preMatch.match.asianHandicapOdds.homeOdds > preMatch.match.asianHandicapOdds.awayOdds ? 'home' : 'away'" },
                    lowerOdds: { expression: "true", description: "Bet on team with lower odds", betSide: "preMatch.match.asianHandicapOdds.homeOdds < preMatch.match.asianHandicapOdds.awayOdds ? 'home' : 'away'" }
                },
                size: {
                    fix: { expression: "200", description: "Fixed $200 stake", stakingMethod: "fixed" },
                    dynamic: { expression: "preMatch.match.asianHandicapOdds.homeOdds <= 1.88 || preMatch.match.asianHandicapOdds.awayOdds <= 1.88 ? 200 : 200 + Math.floor((Math.max(preMatch.match.asianHandicapOdds.homeOdds, preMatch.match.asianHandicapOdds.awayOdds) - 1.88) * 100) * 150", description: "Variable staking", stakingMethod: "variable" }
                }
            };
            
            throw error;
        }
    }

    /**
     * Select a mandatory factor (side or size)
     */
    selectMandatoryFactor(category, factorKey, factor) {
        if (category === 'side') {
            this.selectedSide = { category, key: factorKey, ...factor };
        } else if (category === 'size') {
            this.selectedSize = { category, key: factorKey, ...factor };
        }
        
        this.refreshUI();
    }

    /**
     * Select an additional factor
     */
    selectFactor(category, factorKey, factor) {
        this.selectedFactors.push({ category, key: factorKey, ...factor });
        this.refreshUI();
    }

    /**
     * Remove a selected factor by index
     */
    removeFactor(index) {
        this.selectedFactors.splice(index, 1);
        this.refreshUI();
    }

    /**
     * Deselect a factor from sidebar
     */
    deselectFactor(category, factorKey) {
        const index = this.selectedFactors.findIndex(f => f.category === category && f.key === factorKey);
        if (index !== -1) {
            this.selectedFactors.splice(index, 1);
            this.refreshUI();
        }
    }

    /**
     * Deselect a mandatory factor
     */
    deselectMandatory(type) {
        if (type === 'side') {
            this.selectedSide = null;
        } else if (type === 'size') {
            this.selectedSize = null;
        }
        this.refreshUI();
    }

    /**
     * Clear all selected factors
     */
    clearStrategy() {
        if (this.selectedSide || this.selectedSize || this.selectedFactors.length > 0) {
            if (!confirm('Clear all selected factors?')) {
                return;
            }
        }
        
        this.selectedSide = null;
        this.selectedSize = null;
        this.selectedFactors = [];
        
        this.refreshUI();
        this.uiRenderer.updateStatus('Strategy cleared');
    }

    /**
     * Refresh all UI components
     */
    refreshUI() {
        this.renderFactorSelection();
        this.renderSelectedFactors();
        this.updateResults();
        this.updateStrategyControls();
    }

    /**
     * Render factor selection UI
     */
    renderFactorSelection() {
        this.uiRenderer.renderFactorSelection(
            this.factorDefinitions,
            this.selectedSide,
            this.selectedSize,
            this.selectedFactors,
            this.allMatches
        );
    }

    /**
     * Render selected factors
     */
    renderSelectedFactors() {
        this.uiRenderer.renderSelectedFactors(
            this.selectedSide,
            this.selectedSize,
            this.selectedFactors
        );
    }

    /**
     * Update results based on current selections
     */
    updateResults() {
        if (!this.allMatches.length) {
            document.getElementById('results').innerHTML = '<div class="loading">Loading strategy engine...</div>';
            return;
        }
        
        if (!this.selectedSide || !this.selectedSize) {
            document.getElementById('results').innerHTML = `
                <div class="loading">
                    <strong>Configuration Required</strong><br><br>
                    Select betting side and staking method to begin analysis.<br><br>
                    Current: ${this.selectedSide ? 'SIDE: ' + this.selectedSide.key : 'SIDE: Not selected'}<br>
                    Current: ${this.selectedSize ? 'SIZE: ' + this.selectedSize.key : 'SIZE: Not selected'}
                </div>
            `;
            return;
        }
        
        try {
            // Filter matches by selected factors
            const filteredMatches = this.calculationEngine.getFilteredMatches(this.allMatches, this.selectedFactors);
            
            // Calculate betting results
            this.currentResults = this.calculationEngine.calculateBettingResults(filteredMatches, this.selectedSide, this.selectedSize);
            
            // Render results
            this.uiRenderer.renderResults(this.currentResults, this.selectedFactors, this.allMatches);
            
        } catch (error) {
            document.getElementById('results').innerHTML = `
                <div class="error">
                    <strong>Analysis Error</strong><br>
                    ${error.message}<br>
                    Check factor selections and try again.
                </div>
            `;
            console.error('Analysis error:', error);
        }
    }

    /**
     * Update strategy control button states
     */
    updateStrategyControls() {
        this.uiRenderer.updateStrategyControls(this.selectedSide, this.selectedSize);
    }

    /**
     * Save current strategy
     */
    async saveStrategy() {
        const nameInput = document.getElementById('strategyName');
        const name = nameInput?.value?.trim();
        
        try {
            const success = await this.strategyManager.saveStrategy(
                name,
                this.selectedSide,
                this.selectedSize,
                this.selectedFactors,
                this.currentResults
            );
            
            if (success) {
                // Clear input and refresh display
                if (nameInput) nameInput.value = '';
                await this.uiRenderer.renderSavedStrategies(this.strategyManager);
                this.uiRenderer.updateStatus(`Strategy "${name}" saved successfully`);
            }
            
        } catch (error) {
            alert(error.message);
            console.error('Error saving strategy:', error);
        }
    }

    /**
     * Load a strategy by name
     */
    async loadStrategy(name) {
        try {
            const strategy = await this.strategyManager.loadStrategy(name);
            
            // Load the strategy state
            this.selectedSide = strategy.side;
            this.selectedSize = strategy.size;
            this.selectedFactors = strategy.factors || [];
            
            // Refresh the UI
            this.refreshUI();
            this.uiRenderer.updateStatus(`Strategy "${name}" loaded successfully`);
            
        } catch (error) {
            alert(error.message);
            console.error('Error loading strategy:', error);
        }
    }

    /**
     * Delete a strategy by name
     */
    async deleteStrategy(name) {
        if (!confirm(`Delete strategy "${name}"?`)) {
            return;
        }
        
        try {
            const success = await this.strategyManager.deleteStrategy(name);
            
            if (success) {
                await this.uiRenderer.renderSavedStrategies(this.strategyManager);
                this.uiRenderer.updateStatus(`Strategy "${name}" deleted`);
            }
            
        } catch (error) {
            alert(error.message);
            console.error('Error deleting strategy:', error);
        }
    }

    /**
     * Export current strategy
     */
    exportStrategy() {
        const nameInput = document.getElementById('strategyName');
        const name = nameInput?.value?.trim();
        
        try {
            const filename = this.strategyManager.exportStrategy(
                name,
                this.selectedSide,
                this.selectedSize,
                this.selectedFactors,
                this.currentResults
            );
            
            this.uiRenderer.updateStatus(`Strategy exported: ${filename}`);
            
        } catch (error) {
            alert(error.message);
            console.error('Error exporting strategy:', error);
        }
    }

    /**
     * Import strategy from file
     */
    async importStrategy(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const strategy = await this.strategyManager.importStrategy(file);
            
            // Load the imported strategy
            this.selectedSide = strategy.side;
            this.selectedSize = strategy.size;
            this.selectedFactors = strategy.factors || [];
            
            // Update name input
            const nameInput = document.getElementById('strategyName');
            if (nameInput) nameInput.value = strategy.name || '';
            
            // Refresh the UI
            this.refreshUI();
            this.uiRenderer.updateStatus(`Strategy "${strategy.name}" imported successfully`);
            
        } catch (error) {
            alert(error.message);
            console.error('Error importing strategy:', error);
        }
        
        // Clear the file input
        event.target.value = '';
    }

    /**
     * Open team analysis modal
     */
    openTeamModal(teamName) {
        this.analyzeTeam(teamName);
        const modal = document.getElementById('teamModal');
        if (modal) modal.style.display = 'block';
    }

    /**
     * Close team analysis modal
     */
    closeTeamModal() {
        const modal = document.getElementById('teamModal');
        if (modal) modal.style.display = 'none';
    }

    /**
     * Analyze a specific team
     */
    analyzeTeam(teamName) {
        console.log(`🔍 Analyzing team: ${teamName}`);
        
        // Get all matches for this team
        const teamMatches = this.allMatches.filter(match => {
            const matchData = match.preMatch?.match || {};
            return matchData.homeTeam === teamName || matchData.awayTeam === teamName;
        }).sort((a, b) => new Date(a.preMatch?.match?.date || 0) - new Date(b.preMatch?.match?.date || 0));
        
        // Calculate team statistics
        const stats = this.calculateTeamStats(teamMatches, teamName);
        
        // Update modal content
        this.renderTeamModal(teamName, stats, teamMatches);
    }

    /**
     * Calculate team statistics
     */
    calculateTeamStats(teamMatches, teamName) {
        let wins = 0, losses = 0, draws = 0;
        let ahWins = 0, ahLosses = 0, ahPushes = 0;
        let homeRecord = { wins: 0, losses: 0, draws: 0 };
        let awayRecord = { wins: 0, losses: 0, draws: 0 };
        let currentStreak = { type: '', count: 0 };
        let ahCurrentStreak = { type: '', count: 0 };
        
        teamMatches.forEach((match, index) => {
            const matchData = match.preMatch?.match || {};
            const isHome = matchData.homeTeam === teamName;
            const homeScore = matchData.homeScore || 0;
            const awayScore = matchData.awayScore || 0;
            const handicap = matchData.asianHandicapOdds?.homeHandicap;
            
            // Overall result
            let result = 'draw';
            if (isHome) {
                if (homeScore > awayScore) { result = 'win'; wins++; homeRecord.wins++; }
                else if (homeScore < awayScore) { result = 'loss'; losses++; homeRecord.losses++; }
                else { draws++; homeRecord.draws++; }
            } else {
                if (awayScore > homeScore) { result = 'win'; wins++; awayRecord.wins++; }
                else if (awayScore < homeScore) { result = 'loss'; losses++; awayRecord.losses++; }
                else { draws++; awayRecord.draws++; }
            }
            
            // Update current streak
            if (index === 0) {
                currentStreak = { type: result, count: result === 'draw' ? 0 : 1 };
            } else if (result === currentStreak.type && result !== 'draw') {
                currentStreak.count++;
            } else if (result !== 'draw') {
                currentStreak = { type: result, count: 1 };
            }
            
            // Asian Handicap result
            if (handicap != null) {
                const betSide = isHome ? 'home' : 'away';
                const odds = isHome ? matchData.asianHandicapOdds?.homeOdds || 2.0 : matchData.asianHandicapOdds?.awayOdds || 2.0;
                const ahResult = AsianHandicapCalculator.calculate(homeScore, awayScore, handicap, betSide, odds, 100);
                
                if (ahResult.outcome === 'win' || ahResult.outcome === 'half-win') ahWins++;
                else if (ahResult.outcome === 'loss' || ahResult.outcome === 'half-loss') ahLosses++;
                else ahPushes++;
                
                // Update AH streak
                if (index === 0) {
                    ahCurrentStreak = { type: ahResult.outcome, count: ahResult.outcome === 'push' ? 0 : 1 };
                } else if (ahResult.outcome === ahCurrentStreak.type && ahResult.outcome !== 'push') {
                    ahCurrentStreak.count++;
                } else if (ahResult.outcome !== 'push') {
                    ahCurrentStreak = { type: ahResult.outcome, count: 1 };
                }
            }
        });
        
        return {
            totalMatches: teamMatches.length,
            wins, losses, draws,
            homeRecord, awayRecord,
            ahWins, ahLosses, ahPushes,
            currentStreak, ahCurrentStreak
        };
    }

    /**
     * Render team analysis modal
     */
    renderTeamModal(teamName, stats, teamMatches) {
        // Update modal title
        const titleElement = document.getElementById('modalTeamName');
        if (titleElement) {
            titleElement.textContent = `${teamName} - Complete Analysis`;
        }
        
        // Render team statistics
        const winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches * 100).toFixed(1) : '0.0';
        const ahWinRate = (stats.ahWins + stats.ahLosses + stats.ahPushes) > 0 ? 
            (stats.ahWins / (stats.ahWins + stats.ahLosses + stats.ahPushes) * 100).toFixed(1) : '0.0';
        
        const statsHTML = `
            <div class="team-stat">
                <div class="team-stat-value">${stats.totalMatches}</div>
                <div class="team-stat-label">Total Matches</div>
            </div>
            <div class="team-stat">
                <div class="team-stat-value">${stats.wins}W-${stats.losses}L-${stats.draws}D</div>
                <div class="team-stat-label">Overall Record</div>
            </div>
            <div class="team-stat">
                <div class="team-stat-value">${winRate}%</div>
                <div class="team-stat-label">Win Rate</div>
            </div>
            <div class="team-stat">
                <div class="team-stat-value">${stats.homeRecord.wins}W-${stats.homeRecord.losses}L-${stats.homeRecord.draws}D</div>
                <div class="team-stat-label">Home Record</div>
            </div>
            <div class="team-stat">
                <div class="team-stat-value">${stats.awayRecord.wins}W-${stats.awayRecord.losses}L-${stats.awayRecord.draws}D</div>
                <div class="team-stat-label">Away Record</div>
            </div>
            <div class="team-stat">
                <div class="team-stat-value">${stats.ahWins}W-${stats.ahLosses}L-${stats.ahPushes}P</div>
                <div class="team-stat-label">AH Record</div>
            </div>
            <div class="team-stat">
                <div class="team-stat-value">${ahWinRate}%</div>
                <div class="team-stat-label">AH Win Rate</div>
            </div>
            <div class="team-stat">
                <div class="team-stat-value ${stats.currentStreak.type === 'win' ? 'profit-positive' : stats.currentStreak.type === 'loss' ? 'profit-negative' : ''}">${stats.currentStreak.count} ${stats.currentStreak.type.toUpperCase()}</div>
                <div class="team-stat-label">Current Streak</div>
            </div>
        `;
        
        const statsContainer = document.getElementById('teamStats');
        if (statsContainer) {
            statsContainer.innerHTML = statsHTML;
        }
        
        // Render matches table
        this.renderTeamMatchesTable(teamMatches, teamName);
    }

    /**
     * Render team matches table
     */
    renderTeamMatchesTable(teamMatches, teamName) {
        const matchesHTML = teamMatches.map(match => {
            const matchData = match.preMatch?.match || {};
            const isHome = matchData.homeTeam === teamName;
            const opponent = isHome ? matchData.awayTeam : matchData.homeTeam;
            const venue = isHome ? 'HOME' : 'AWAY';
            const homeScore = matchData.homeScore || 0;
            const awayScore = matchData.awayScore || 0;
            const score = `${homeScore}-${awayScore}`;
            
            // Overall result
            let result = 'DRAW';
            let resultClass = 'profit-neutral';
            if (isHome) {
                if (homeScore > awayScore) { result = 'WIN'; resultClass = 'profit-positive'; }
                else if (homeScore < awayScore) { result = 'LOSS'; resultClass = 'profit-negative'; }
            } else {
                if (awayScore > homeScore) { result = 'WIN'; resultClass = 'profit-positive'; }
                else if (awayScore < homeScore) { result = 'LOSS'; resultClass = 'profit-negative'; }
            }
            
            // AH result
            const handicap = matchData.asianHandicapOdds?.homeHandicap || 'N/A';
            let ahResult = 'N/A';
            let ahResultClass = '';
            
            if (handicap !== 'N/A') {
                const betSide = isHome ? 'home' : 'away';
                const odds = isHome ? matchData.asianHandicapOdds?.homeOdds || 2.0 : matchData.asianHandicapOdds?.awayOdds || 2.0;
                const calculation = AsianHandicapCalculator.calculate(homeScore, awayScore, handicap, betSide, odds, 100);
                ahResult = calculation.outcome.toUpperCase();
                ahResultClass = (calculation.outcome === 'win' || calculation.outcome === 'half-win') ? 'profit-positive' : 
                               (calculation.outcome === 'loss' || calculation.outcome === 'half-loss') ? 'profit-negative' : 'profit-neutral';
            }
            
            // Get streak info from timeSeries if available
            let streakInfo = '';
            if (match.timeSeries) {
                const teamSeries = isHome ? match.timeSeries.home : match.timeSeries.away;
                if (teamSeries?.streaks?.overall?.current) {
                    const streak = teamSeries.streaks.overall.current;
                    streakInfo = `${streak.count} ${streak.type.toUpperCase()}`;
                }
            }
            
            return `
                <tr>
                    <td>${new Date(matchData.date).toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'2-digit'})}</td>
                    <td>${opponent}</td>
                    <td>${venue}</td>
                    <td>${score}</td>
                    <td class="${resultClass}">${result}</td>
                    <td>${handicap}</td>
                    <td class="${ahResultClass}">${ahResult}</td>
                    <td>${streakInfo}</td>
                </tr>
            `;
        }).join('');
        
        const matchesTableBody = document.getElementById('teamMatchesBody');
        if (matchesTableBody) {
            matchesTableBody.innerHTML = matchesHTML;
        }
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DrillAnalyzer;
}
if (typeof window !== 'undefined') {
    window.DrillAnalyzer = DrillAnalyzer;
}