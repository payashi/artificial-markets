import { GoogleCharts } from 'google-charts';

import pams from './pams';
import timer from './timer';

// Number of plots to draw on the graph
const kNumData = 300;

const prices = await pams.prices();
const duration = await pams.duration();

export function drawChart(time) {
    const data = [
        ...Array.from({ length: kNumData }, (v, i) => [null, null, null]),
        ...prices,
    ];
    const pamsTime = Math.round(time * 10) % duration;

    // Padding is added to create a margin at the point of the null value
    const formattedPrices = [
        [pamsTime - kNumData - 2, 0, 0, 0],
        [pamsTime - kNumData - 1, null, null, null],
        ...data.slice(pamsTime, pamsTime + kNumData).map((v, i) => [
            pamsTime - kNumData + i,
            v[0], v[1], v[2],
        ]),
        [pamsTime, null, null, null],
        [pamsTime + 1, 0, 0, 0],
    ];

    const dataTable = google.visualization.arrayToDataTable([
        [
            { label: 'time', id: 'time', type: 'number' },
            { label: 'Market 01', id: 'm1', type: 'number' },
            { label: 'Market 02', id: 'm2', type: 'number' },
            { label: 'Index Market', id: 'mi', type: 'number' },
        ],
        ...formattedPrices,
    ]);

    const options = {
        curveType: 'function',
        backgroundColor: { fillOpacity: 0.1 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#0f0f0f'],
        chartArea: { 'width': '100%' },
        vAxis: {
            gridlines: { count: 0 },
            textPosition: 'none',
            baselineColor: 'none',
            viewWindow: {
                max: 320,
                min: 200,
            }
        },
        hAxis: {
            gridlines: { count: 0 },
            textPosition: 'none',
            viewWindow: {
                min: pamsTime - kNumData,
                max: pamsTime - 1,
            }
        },
        title: 'Stock Price Movement',
        titleTextStyle: { color: 'white', fontSize: 24, bold: true },
        legend: { position: 'top', textStyle: { color: 'white', fontSize: 16 } },
        interpolateNulls: false,
    };
    const chart = new GoogleCharts.api.visualization.LineChart(document.getElementById('chart'));
    chart.draw(dataTable, options);
}

setInterval(() => {
    if (timer.running) {
        GoogleCharts.load(() => { drawChart(timer.time()); });
    }
}, 30);
