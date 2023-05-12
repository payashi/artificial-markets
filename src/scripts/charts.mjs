import Chart from 'chart.js/auto'

import pams from './pams';
import timer from './timer';

// Number of plots to draw on the graph
const kWindow = 200;

const prices = await pams.prices();
const duration = await pams.duration();

const chart = new Chart(
    document.getElementById('chart'),
    {
        type: 'line',
        data: {
            labels: Array.from({ length: kWindow }, (_, i) => i),
            datasets: [
                {
                    label: 'Market 01',
                    fill: false,
                    borderColor: 'rgb(255, 0, 0)',
                    tension: 0,
                    pointStyle: false,
                },
                {
                    label: 'Market 02',
                    fill: false,
                    borderColor: 'rgb(0, 255, 0)',
                    tension: 0,
                    pointStyle: false,
                },
                {
                    label: 'Index Market',
                    fill: false,
                    borderColor: 'rgb(0, 0, 255)',
                    tension: 0,
                    pointStyle: false,
                },
            ]
        },
        // Drawing options for the line chart
        options: {
            layout: {
                autoPadding: true,
            },
            scales: {
                x: {
                    type: 'category',
                },
                y: {
                    type: 'linear',
                    min: 280,
                    max: 320,
                }
            },
            plugins: {
                legend: { display: false },
            }
        },
    }
);

setInterval(() => {
    if (timer.running) {
        const now = Math.round(timer.time() * 10) % duration;
        updateChart(now);
    }
}, 100);

function updateChart(now) {

    // Update time ticks
    chart.data.labels = Array.from({ length: kWindow }, (_, i) => {
        const num = Math.max(0, i + now - kWindow);
        return ('000' + String(num)).slice(-3);
        // return i + now - kWindow;
    });
    chart.data.datasets.forEach((dataset, i) => {
        if (now <= kWindow) {
            dataset.data = [
                // Padding is added to create a margin at the point of the null value
                ...Array.from({ length: kWindow - now }, () => null),
                ...Array.from({ length: now }, (_, j) => prices[j][i])
            ];
        } else {
            dataset.data = Array.from({ length: kWindow }, (_, j) => prices[j + now - kWindow][i]);
        }
    });

    chart.update('none');
}
