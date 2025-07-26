/**
 * UIRenderer - Handles all UI rendering and display logic
 * Isolates DOM manipulation and HTML generation for better organization
 */
class UIRenderer {
    constructor(calculationEngine) {
        this.calculationEngine = calculationEngine;
        this.chartInstance = null; // Store chart instance for cleanup
    }

    /**
     * Render factor selection UI including mandatory and optional factors
     * @param {Object} factorDefinitions - Factor definitions object
     * @param {Object} selectedSide - Currently selected side
     * @param {Object} selectedSize - Currently selected size
     * @param {Array} selectedFactors - Array of selected factors
     * @param {Array} allMatches - All available matches for ROI calculation
     */
    renderFactorSelection(factorDefinitions, selectedSide, selectedSize, selectedFactors, allMatches) {
        if (Object.keys(factorDefinitions).length === 0) return;
        
        this.renderMandatoryFactors(factorDefinitions, selectedSide, selectedSize, selectedFactors, allMatches);
        this.renderAvailableFactors(factorDefinitions, selectedSide, selectedSize, selectedFactors, allMatches);
    }

    /**
     * Render mandatory factors (side and size)
     */
    renderMandatoryFactors(factorDefinitions, selectedSide, selectedSize, selectedFactors, allMatches) {
        const mandatoryContainer = document.getElementById('mandatory-factors');
        if (!mandatoryContainer) return;
        
        mandatoryContainer.innerHTML = '';
        
        // Handle both old structure (direct side/size) and new structure (nested in mandatory)
        const sideFactors = factorDefinitions.side || factorDefinitions.mandatory?.side || {};
        const sizeFactors = factorDefinitions.size || factorDefinitions.mandatory?.size || {};
        
        // Create mandatory grid
        const mandatoryGrid = document.createElement('div');
        mandatoryGrid.className = 'mandatory-grid';
        
        // Render SIDE factors
        this.renderFactorGroup(sideFactors, 'side', 'SIDE', selectedSide, selectedSize, selectedFactors, allMatches, mandatoryGrid);
        
        // Render SIZE factors
        this.renderFactorGroup(sizeFactors, 'size', 'SIZE', selectedSide, selectedSize, selectedFactors, allMatches, mandatoryGrid);
        
        mandatoryContainer.appendChild(mandatoryGrid);
    }

    /**
     * Render a group of factors (side or size)
     */
    renderFactorGroup(factors, category, displayPrefix, selectedSide, selectedSize, selectedFactors, allMatches, container) {
        const factorsWithRoi = [];
        
        Object.keys(factors).forEach(factorKey => {
            const factor = factors[factorKey];
            const isSelected = (category === 'side' && selectedSide?.key === factorKey) ||
                             (category === 'size' && selectedSize?.key === factorKey);
            
            let roi = 0;
            let roiHtml = '';
            
            // Calculate ROI if not selected and we have the required data
            if (!isSelected && allMatches.length > 0) {
                const otherSelection = category === 'side' ? selectedSize : selectedSide;
                if (otherSelection) {
                    try {
                        const tempFactor = { category, key: factorKey, ...factor };
                        const tempMatches = this.calculationEngine.getFilteredMatches(allMatches, selectedFactors);
                        
                        if (tempMatches.length > 0) {
                            const tempSide = category === 'side' ? tempFactor : selectedSide;
                            const tempSize = category === 'size' ? tempFactor : selectedSize;
                            const tempResults = this.calculationEngine.calculateBettingResults(tempMatches, tempSide, tempSize);
                            roi = tempResults.summary.roi;
                            const matchCount = tempResults.summary.totalBets;
                            const roiClass = roi > 0 ? 'roi-positive' : roi < 0 ? 'roi-negative' : 'roi-neutral';
                            roiHtml = `<div class="factor-roi ${roiClass}">${matchCount} / ${roi.toFixed(2)}%</div>`;
                        }
                    } catch (error) {
                        // Silently ignore ROI calculation errors
                    }
                }
            }
            
            factorsWithRoi.push({ factorKey, factor, isSelected, roi, roiHtml });
        });
        
        // Sort by ROI (descending)
        factorsWithRoi.sort((a, b) => b.roi - a.roi);
        
        // Render sorted factors
        factorsWithRoi.forEach(({ factorKey, factor, isSelected, roi, roiHtml }) => {
            const factorDiv = document.createElement('div');
            const negativeRoiClass = roiHtml.includes('roi-negative') ? ' negative-roi' : '';
            factorDiv.className = `mandatory-item ${isSelected ? 'selected' : ''}${negativeRoiClass}`;
            
            // Apply ROI background bar
            const roiBarData = UtilityHelper.calculateRoiBar(roi);
            factorDiv.style.setProperty('--roi-width', roiBarData.width);
            factorDiv.style.setProperty('--roi-color', roiBarData.color);
            
            factorDiv.innerHTML = `
                <div class="mandatory-item-name">${displayPrefix}: ${UtilityHelper.toStartCase(factorKey)}</div>
                <div class="mandatory-item-desc">${factor.description}</div>
                ${roiHtml}
            `;
            factorDiv.onclick = () => window.drillAnalyzer.selectMandatoryFactor(category, factorKey, factor);
            container.appendChild(factorDiv);
        });
    }

    /**
     * Render available factors (non-mandatory)
     */
    renderAvailableFactors(factorDefinitions, selectedSide, selectedSize, selectedFactors, allMatches) {
        const availableContainer = document.getElementById('available-factors');
        if (!availableContainer) return;
        
        availableContainer.innerHTML = '';
        
        Object.keys(factorDefinitions).forEach(category => {
            // Skip mandatory categories and empty categories
            if (category === 'side' || category === 'size' || category === 'mandatory') return;
            if (!factorDefinitions[category] || Object.keys(factorDefinitions[category]).length === 0) return;
            
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'factor-section';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'factor-title';
            titleDiv.textContent = UtilityHelper.toStartCase(category);
            sectionDiv.appendChild(titleDiv);
            
            const gridDiv = document.createElement('div');
            gridDiv.className = 'factor-grid';
            
            // Collect all factors with their ROI data for sorting
            const factorsWithRoi = [];
            
            Object.keys(factorDefinitions[category]).forEach(factorKey => {
                const factor = factorDefinitions[category][factorKey];
                const isSelected = selectedFactors.some(f => f.category === category && f.key === factorKey);
                
                if (factor.expression && factor.description) {
                    let roi = 0;
                    let roiHtml = '';
                    
                    // Calculate ROI if we have mandatory factors and data loaded
                    if (!isSelected && selectedSide && selectedSize && allMatches.length > 0) {
                        try {
                            const tempFactors = [...selectedFactors, { category, key: factorKey, ...factor }];
                            const tempMatches = this.calculationEngine.getFilteredMatches(allMatches, tempFactors);
                            
                            if (tempMatches.length > 0) {
                                const tempResults = this.calculationEngine.calculateBettingResults(tempMatches, selectedSide, selectedSize);
                                roi = tempResults.summary.roi;
                                const matchCount = tempResults.summary.totalBets;
                                const roiClass = roi > 0 ? 'roi-positive' : roi < 0 ? 'roi-negative' : 'roi-neutral';
                                roiHtml = `<div class="factor-roi ${roiClass}">${matchCount} / ${roi.toFixed(2)}%</div>`;
                            }
                        } catch (error) {
                            // Silently ignore ROI calculation errors
                        }
                    }
                    
                    factorsWithRoi.push({
                        factorKey,
                        factor,
                        isSelected,
                        roi,
                        roiHtml
                    });
                }
            });
            
            // Sort factors by ROI (descending)
            factorsWithRoi.sort((a, b) => b.roi - a.roi);
            
            // Render sorted factors
            let hasVisibleFactors = false;
            factorsWithRoi.forEach(({ factorKey, factor, isSelected, roi, roiHtml }) => {
                hasVisibleFactors = true;
                
                const factorDiv = document.createElement('div');
                const negativeRoiClass = roiHtml.includes('roi-negative') ? ' negative-roi' : '';
                factorDiv.className = `factor-item ${isSelected ? 'selected' : ''}${negativeRoiClass}`;
                
                // Apply ROI background bar
                const roiBarData = UtilityHelper.calculateRoiBar(roi);
                factorDiv.style.setProperty('--roi-width', roiBarData.width);
                factorDiv.style.setProperty('--roi-color', roiBarData.color);
                
                factorDiv.innerHTML = `
                    <div class="factor-name">${UtilityHelper.toStartCase(factorKey)}</div>
                    <div class="factor-desc">${factor.description}</div>
                    ${roiHtml}
                `;
                factorDiv.onclick = () => {
                    if (isSelected) {
                        window.drillAnalyzer.deselectFactor(category, factorKey);
                    } else {
                        window.drillAnalyzer.selectFactor(category, factorKey, factor);
                    }
                };
                gridDiv.appendChild(factorDiv);
            });
            
            if (hasVisibleFactors) {
                sectionDiv.appendChild(gridDiv);
                availableContainer.appendChild(sectionDiv);
            }
        });
    }

    /**
     * Render selected factors as tags
     */
    renderSelectedFactors(selectedSide, selectedSize, selectedFactors) {
        const selectedContainer = document.getElementById('selected-factors-list');
        if (!selectedContainer) return;
        
        let tags = [];
        
        // Add mandatory selections
        if (selectedSide) {
            tags.push(`<div class="selected-tag mandatory" title="${selectedSide.description}">
                SIDE: ${UtilityHelper.toStartCase(selectedSide.key)} <span class="remove-x" onclick="window.drillAnalyzer.deselectMandatory('side')">×</span>
            </div>`);
        }
        
        if (selectedSize) {
            tags.push(`<div class="selected-tag mandatory" title="${selectedSize.description}">
                SIZE: ${UtilityHelper.toStartCase(selectedSize.key)} <span class="remove-x" onclick="window.drillAnalyzer.deselectMandatory('size')">×</span>
            </div>`);
        }
        
        // Add optional factors
        selectedFactors.forEach((factor, index) => {
            tags.push(`<div class="selected-tag" title="${factor.description}">
                ${UtilityHelper.toStartCase(factor.category)}.${UtilityHelper.toStartCase(factor.key)} <span class="remove-x" onclick="window.drillAnalyzer.removeFactor(${index})">×</span>
            </div>`);
        });
        
        if (tags.length === 0) {
            selectedContainer.innerHTML = '<div style="color: #666; font-size: 9px;">Select betting side and stake method to begin</div>';
        } else {
            selectedContainer.innerHTML = tags.join('');
        }
    }

    /**
     * Render complete analysis results
     */
    renderResults(currentResults, selectedFactors, allMatches) {
        const resultsContainer = document.getElementById('results');
        if (!resultsContainer || !currentResults) return;
        
        const { summary, bettingRecords } = currentResults;
        
        // Get factors with displayExpressions for the table
        const factorsWithDisplay = selectedFactors.filter(f => f.displayExpression);
        
        // Calculate risk metrics
        const riskMetrics = this.calculationEngine.calculateRiskMetrics(bettingRecords);
        
        const resultsHTML = this.generateResultsHTML(summary, bettingRecords, riskMetrics, factorsWithDisplay, selectedFactors, allMatches);
        
        resultsContainer.innerHTML = resultsHTML;
        
        // Create the profit chart
        try {
            this.createProfitChart(bettingRecords);
        } catch (error) {
            console.error('Error creating profit chart:', error);
            this.showChartError();
        }
    }

    /**
     * Generate complete results HTML
     */
    generateResultsHTML(summary, bettingRecords, riskMetrics, factorsWithDisplay, selectedFactors, allMatches) {
        return `
            <div class="summary">
                <div class="summary-header">Strategy Performance</div>
                <div class="summary-stats">
                    Filtered ${summary.filteredMatches || 0} matches from ${allMatches.length} total (${((summary.filteredMatches || 0)/allMatches.length*100).toFixed(1)}% match rate)<br>
                    Active factors: ${selectedFactors.map(f => UtilityHelper.toStartCase(f.key)).join(', ') || 'Base strategy only'}
                </div>
                <div class="summary-grid">
                    <div class="summary-metric">
                        <div class="summary-value">${summary.totalBets}</div>
                        <div class="summary-label">Bets</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value">${UtilityHelper.formatCurrency(summary.totalStake)}</div>
                        <div class="summary-label">Stake</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value ${UtilityHelper.getProfitColorClass(summary.totalProfit)}">${UtilityHelper.formatCurrency(summary.totalProfit)}</div>
                        <div class="summary-label">Profit</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value ${UtilityHelper.getProfitColorClass(summary.roi)}">${UtilityHelper.formatPercent(summary.roi)}</div>
                        <div class="summary-label">ROI</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value">${summary.winRate.toFixed(1)}%</div>
                        <div class="summary-label">Win Rate</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value">${summary.wins}W/${summary.losses}L/${summary.pushes}P</div>
                        <div class="summary-label">Record</div>
                    </div>
                </div>
            </div>
            
            ${this.generateRiskAnalysisHTML(riskMetrics)}
            ${this.generateChartHTML()}
            ${this.generateBettingRecordsHTML(bettingRecords, factorsWithDisplay)}
        `;
    }

    /**
     * Generate risk analysis HTML section
     */
    generateRiskAnalysisHTML(riskMetrics) {
        return `
            <div class="summary">
                <div class="summary-header">Risk Analysis</div>
                <div class="summary-stats">
                    Risk-adjusted performance metrics to evaluate strategy safety and consistency<br>
                    🟢 Green = Good | ⚪ Gray = Fair | 🔴 Red = Poor (hover for thresholds)
                </div>
                <div class="summary-grid">
                    <div class="summary-metric">
                        <div class="summary-value ${this.calculationEngine.getRiskMetricDisplay('maxDrawdown', riskMetrics.maxDrawdown).class}" 
                             title="${this.calculationEngine.getRiskMetricDisplay('maxDrawdown', riskMetrics.maxDrawdown).tooltip}">
                            ${UtilityHelper.formatCurrency(riskMetrics.maxDrawdown)}
                        </div>
                        <div class="summary-label">Max Drawdown</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value ${this.calculationEngine.getRiskMetricDisplay('maxDrawdownPercent', riskMetrics.maxDrawdownPercent).class}"
                             title="${this.calculationEngine.getRiskMetricDisplay('maxDrawdownPercent', riskMetrics.maxDrawdownPercent).tooltip}">
                            ${riskMetrics.maxDrawdownPercent.toFixed(1)}%
                        </div>
                        <div class="summary-label">Max DD %</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value ${this.calculationEngine.getRiskMetricDisplay('recoveryFactor', riskMetrics.recoveryFactor).class}"
                             title="${this.calculationEngine.getRiskMetricDisplay('recoveryFactor', riskMetrics.recoveryFactor).tooltip}">
                            ${riskMetrics.recoveryFactor === 999 ? '∞' : riskMetrics.recoveryFactor.toFixed(2)}
                        </div>
                        <div class="summary-label">Recovery Factor</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value ${this.calculationEngine.getRiskMetricDisplay('profitFactor', riskMetrics.profitFactor).class}"
                             title="${this.calculationEngine.getRiskMetricDisplay('profitFactor', riskMetrics.profitFactor).tooltip}">
                            ${riskMetrics.profitFactor === 999 ? '∞' : riskMetrics.profitFactor.toFixed(2)}
                        </div>
                        <div class="summary-label">Profit Factor</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value ${this.calculationEngine.getRiskMetricDisplay('maxConsecutiveLosses', riskMetrics.maxConsecutiveLosses).class}"
                             title="${this.calculationEngine.getRiskMetricDisplay('maxConsecutiveLosses', riskMetrics.maxConsecutiveLosses).tooltip}">
                            ${riskMetrics.maxConsecutiveLosses}
                        </div>
                        <div class="summary-label">Max Loss Streak</div>
                    </div>
                    <div class="summary-metric">
                        <div class="summary-value ${riskMetrics.timeToRecovery > 0 ? 'profit-neutral' : 'profit-positive'}" 
                             title="Number of bets to recover from max drawdown. Lower is better.">
                            ${riskMetrics.timeToRecovery}
                        </div>
                        <div class="summary-label">Recovery Time</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate chart HTML section
     */
    generateChartHTML() {
        return `
            <div class="chart-section">
                <div class="chart-header">Cumulative Profit Over Time</div>
                <div class="chart-container">
                    <canvas id="profitChart"></canvas>
                </div>
            </div>
        `;
    }

    /**
     * Generate betting records table HTML
     */
    generateBettingRecordsHTML(bettingRecords, factorsWithDisplay) {
        const recordsHTML = bettingRecords.map(record => `
            <tr>
                <td>${new Date(record.date).toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'2-digit'})}</td>
                <td>
                    <span class="team-link" onclick="window.drillAnalyzer.openTeamModal('${record.homeTeam}')">${record.homeTeam}</span> v 
                    <span class="team-link" onclick="window.drillAnalyzer.openTeamModal('${record.awayTeam}')">${record.awayTeam}</span>
                    <span style="font-size: 8px; color: #666; margin-left: 4px;">(${record.season || 'S?'})</span>
                </td>
                <td>${record.score}</td>
                <td>${record.handicap}</td>
                <td>${record.betSide.toUpperCase()}</td>
                <td>${record.odds.toFixed(2)}</td>
                <td>${UtilityHelper.formatCurrency(record.stake)}</td>
                <td>${record.outcome.toUpperCase()}</td>
                <td class="${UtilityHelper.getProfitColorClass(record.profit)}">${UtilityHelper.formatCurrency(record.profit)}</td>
                ${factorsWithDisplay.map(factor => {
                    const displayExpression = factor.displayExpression;
                    let displayValue = '-';
                    try {
                        const expressions = Array.isArray(displayExpression) ? displayExpression : [displayExpression];
                        const value = expressions.map(exp => {
                            try {
                                return new Function('Math', 'preMatch', 'timeSeries', `return ${exp}`)(
                                    Math,
                                    record.match.preMatch || {},
                                    record.match.timeSeries || {},
                                );
                            } catch (error) {
                                console.warn(`Error evaluating display expression: ${exp}`, error, record);
                                return 'Error';
                            }
                        }).join(', ');
                        displayValue = value ?? '-';
                    } catch (error) {
                        console.warn(`Error evaluating display expression for ${factor.key}:${displayExpression}`, error);
                        displayValue = 'Error';
                    }
                    return `<td>${displayValue}</td>`;
                }).join('')}
            </tr>
        `).join('');

        return `
            <div class="records-section">
                <div class="records-header">Betting Records (${bettingRecords.length} matches)</div>
                <table class="records-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Match</th>
                            <th>Score</th>
                            <th>Handicap</th>
                            <th>Side</th>
                            <th>Odds</th>
                            <th>Stake</th>
                            <th>Result</th>
                            <th>P&L</th>
                            ${factorsWithDisplay.map(factor => `
                                <th title="${factor.description || factor.key}">${UtilityHelper.toStartCase(factor.key)}</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${recordsHTML}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Create profit chart using Chart.js
     */
    createProfitChart(bettingRecords) {
        const canvas = document.getElementById('profitChart');
        if (!canvas) return;

        // Destroy existing chart if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Sort records by date and calculate cumulative profit
        const sortedRecords = [...bettingRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let cumulativeProfit = 0;
        const chartData = [{
            x: sortedRecords.length > 0 ? new Date(sortedRecords[0].date) : new Date(),
            y: 0
        }];
        
        sortedRecords.forEach(record => {
            cumulativeProfit += record.profit;
            chartData.push({
                x: new Date(record.date),
                y: cumulativeProfit
            });
        });

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Cumulative Profit',
                    data: chartData,
                    borderColor: cumulativeProfit >= 0 ? '#00ff88' : '#ff6b6b',
                    backgroundColor: cumulativeProfit >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        grid: {
                            color: '#404040'
                        },
                        ticks: {
                            color: '#888'
                        }
                    },
                    y: {
                        grid: {
                            color: '#404040'
                        },
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return UtilityHelper.formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * Show chart error message
     */
    showChartError() {
        const canvas = document.getElementById('profitChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Chart error - check console', canvas.width / 2, canvas.height / 2);
        }
    }

    /**
     * Render saved strategies in the pinned panel
     */
    async renderSavedStrategies(strategyManager) {
        const container = document.getElementById('pinnedSavedStrategies');
        if (!container) return;

        try {
            const savedStrategies = await strategyManager.getStrategiesSorted();
            
            if (savedStrategies.length === 0) {
                container.innerHTML = '<div style="color: #666; font-size: 9px; text-align: center; padding: 20px;">No saved strategies</div>';
                return;
            }

            const strategiesHTML = savedStrategies.map(strategy => {
                const perf = strategy.performance;
                const perfText = perf ? 
                    `${perf.totalBets} bets, ${perf.roi.toFixed(1)}% ROI` : 
                    'No performance data';
                
                const timeAgo = UtilityHelper.getTimeAgo(strategy.timestamp);
                
                return `
                    <div class="pinned-strategy">
                        <div class="pinned-strategy-name" onclick="window.drillAnalyzer.loadStrategy('${strategy.name}')" title="Click to load: ${strategy.name}">
                            ${strategy.name}
                        </div>
                        <div class="pinned-strategy-info" title="${perfText}">
                            ${timeAgo} • ${perfText}
                        </div>
                        <div class="pinned-strategy-controls">
                            <button class="pinned-strategy-btn danger" onclick="window.drillAnalyzer.deleteStrategy('${strategy.name}')" title="Delete strategy">×</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = strategiesHTML;
            
        } catch (error) {
            console.error('Error rendering saved strategies:', error);
            container.innerHTML = '<div style="color: #ff6b6b; font-size: 9px; text-align: center; padding: 20px;">Error loading strategies</div>';
        }
    }

    /**
     * Update status message
     */
    updateStatus(message) {
        const statusElement = document.getElementById('status-line');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    /**
     * Update status with performance information
     */
    updateStatusWithPerformance(baseMessage) {
        const hitRates = this.calculationEngine.getCacheHitRates();
        const perfMessage = `${baseMessage} | Cache: F:${hitRates.factorEvaluation}% AH:${hitRates.asianHandicap}% M:${hitRates.matchFilter}% R:${hitRates.bettingResult}%`;
        this.updateStatus(perfMessage);
    }

    /**
     * Update strategy control button states
     */
    updateStrategyControls(selectedSide, selectedSize) {
        const hasValidStrategy = selectedSide && selectedSize;
        const saveBtn = document.getElementById('saveBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (saveBtn) saveBtn.disabled = !hasValidStrategy;
        if (exportBtn) exportBtn.disabled = !hasValidStrategy;
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIRenderer;
}
if (typeof window !== 'undefined') {
    window.UIRenderer = UIRenderer;
}