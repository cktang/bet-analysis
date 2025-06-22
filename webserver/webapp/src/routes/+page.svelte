<style>
    .chart-container {
        margin: 5px;
    }

    td, th {
        padding: 2px 5px;
    }
</style>

<script lang="ts">
    import { onMount, tick } from 'svelte';
    import _ from 'lodash';
    
    import { Chart } from '@highcharts/svelte'; // Chart is also exported by default
    import Highcharts from 'highcharts';
    import HighchartsMore from 'highcharts/highcharts-more';
    import ExportingModule from 'highcharts/modules/exporting';
    import type { ChartOptions } from 'highcharts';
    import moment from 'moment';

    // Ensure Highcharts is properly initialized
    if (typeof Highcharts === 'object') {
        HighchartsMore(Highcharts);
        ExportingModule(Highcharts);
    }
    
    type DataRecord = { 
        id: string,
        home: string,
        away: string,
        date: string,
        ahHome: number,
        ahAway: number,
        oddsHome: number,
        oddsAway: number,
        ts: number
    };

    let matches: Array<any> = $state([]);
    let matchDetails: DataRecord[] = $state([]);
    let match = $state(null);    
    let ahOptions = $state({
        chart: {
            type: 'area'
        },
        title: {
            text: ''
        },
        series: [{
            name: 'AH Home',
            data: []
        }],
        yAxis: {
            title: {
                text: 'AH'
            },
            tickInterval: 0.25,
        },
        xAxis: {
            categories: []
        },
        plotOptions: {
            series: {
                lineWidth: 5, // Thicker line for all series
                marker: {
                    enabled: false // No markers for all series
                }
            }
        }
    } as ChartOptions);

    let oddsOptions = $state({
        chart: {
            type: 'area'
        },
        title: {
            text: ''
        },
        series: [{
            name: 'Odds Home',
            data: []
        }],
        yAxis: {
            title: {
                text: 'Odds'
            },
            tickInterval: 0.1,
            max: 2.3,
            min: 1.6,
            lineWidth: 2 // Thicker line for yAxis
        },
        xAxis: {
            categories: [],
            lineWidth: 2 // Thicker line for xAxis
        },
        plotOptions: {
            series: {
                lineWidth: 5, // Thicker line for all series
                marker: {
                    enabled: false // No markers for all series
                }
            }
        }
    } as ChartOptions);

    onMount(async () => {
        // console.warn('onMount');
        const res = await fetch('http://localhost:3000/matches');
        matches = await res.json();
        match = matches[3];
    });

    $effect(() => {
        fetch(`http://localhost:3000/records/${match?.key}`)
            .then(res => res.json())
            .then(data => {
                matchDetails = _(data).sortBy('ts').value();

                ahOptions = {
                    xAxis: {
                        type: 'datetime',
                        labels: {
                            formatter: function () {
                                return moment(this.value).format('HH:mm');
                            }
                        }
                    },
                    series: [
                        {
                            name: 'AH Home',
                            data: matchDetails.map(detail => [detail.ts, detail.ahHome]),
                            color: 'tomato',
                        }
                    ]
                };

                oddsOptions = {
                    xAxis: {
                        type: 'datetime',
                        labels: {
                            formatter: function () {
                                return moment(this.value).format('HH:mm');
                            }
                        }
                    },
                    series: [
                        {
                            name: 'Odds Home',
                            data: matchDetails.map(detail => [detail.ts, detail.oddsHome]),
                            color: 'skyblue'
                        }
                    ]
                };
            });
    });

    $inspect({ matches, match, matchDetails, ahOptions, oddsOptions });
</script>

<div class="*:matches">
    <select bind:value={match}>
        {#each matches as m}
            <option value="{m}">{m.key}</option>
        {/each}
    </select>
</div>

<div>
    <div class="chart-container">  
        <Chart options={ahOptions}/>
        <Chart options={oddsOptions}/>
    </div>
</div>