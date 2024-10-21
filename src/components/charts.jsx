import React, { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function BinanceFuturesChart() {
    const [tradingPairs, setTradingPairs] = useState([]);
    const [currentSymbol, setCurrentSymbol] = useState('BTCUSDT');
    const [timeFrame, setTimeFrame] = useState('1d');
    const [chartInstance, setChartInstance] = useState(null);

    useEffect(() => {
        loadTradingPairs();
        fetchData('1d');
    }, []);

    useEffect(() => {
        if (chartInstance) {
            fetchData(timeFrame);
        }
    }, [chartInstance, currentSymbol, timeFrame]);

    // Load available trading pairs from Binance API
    const loadTradingPairs = () => {
        fetch('https://fapi.binance.com/fapi/v1/exchangeInfo')
            .then((response) => response.json())
            .then((data) => {
                const pairs = data.symbols
                    .filter((symbol) => symbol.contractType === 'PERPETUAL')
                    .map((symbol) => symbol.symbol);
                setTradingPairs(pairs);
            })
            .catch((error) => console.error('Error fetching trading pairs:', error));
    };

    // Fetch data for the selected symbol and time frame
    const fetchData = (timeFrame) => {
        const endpoint = `https://fapi.binance.com/fapi/v1/klines?symbol=${currentSymbol}&interval=${timeFrame}`;

        fetch(endpoint)
            .then((response) => response.json())
            .then((data) => {
                const formattedData = formatChartData(data);
                updateChart(formattedData);
            })
            .catch((error) => console.error('Error fetching data:', error));
    };

    // Format Binance kline data for Chart.js
    const formatChartData = (data) => {
        return data.map((item) => ({
            time: new Date(item[0]),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
        }));
    };

    // Update chart with new data
    const updateChart = (chartData) => {
        const labels = chartData.map((candle) => candle.time.toLocaleString());
        const chartDataset = {
            labels: labels,
            datasets: [
                {
                    label: currentSymbol,
                    data: chartData.map((candle) => ({
                        x: candle.time,
                        y: [candle.open, candle.high, candle.low, candle.close],
                    })),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        };

        if (chartInstance) {
            chartInstance.destroy();
        }

        const ctx = document.getElementById('chart').getContext('2d');
        const newChartInstance = new Chart(ctx, {
            type: 'candlestick', // Use candlestick chart type
            data: chartDataset,
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                        },
                    },
                },
            },
        });

        setChartInstance(newChartInstance);
    };

    // Event handler for changing the trading pair
    const handleSymbolChange = (e) => {
        setCurrentSymbol(e.target.value);
    };

    // Event handler for changing the time frame
    const handleTimeFrameChange = (timeFrame) => {
        setTimeFrame(timeFrame);
    };

    return (
        <div>
            <h1>Binance Futures Chart</h1>

            {/* Symbol Selector */}
            <div>
                <label htmlFor="symbolSelect">Select Trading Pair:</label>
                <select id="symbolSelect" onChange={handleSymbolChange} value={currentSymbol}>
                    {tradingPairs.map((pair) => (
                        <option key={pair} value={pair}>
                            {pair}
                        </option>
                    ))}
                </select>
            </div>

            {/* Time Frame Buttons */}
            <div>
                <button onClick={() => handleTimeFrameChange('1m')}>1 Min</button>
                <button onClick={() => handleTimeFrameChange('3m')}>3 Min</button>
                <button onClick={() => handleTimeFrameChange('5m')}>5 Min</button>
                <button onClick={() => handleTimeFrameChange('15m')}>15 Min</button>
                <button onClick={() => handleTimeFrameChange('30m')}>30 Min</button>
                <button onClick={() => handleTimeFrameChange('1h')}>1 Hour</button>
                <button onClick={() => handleTimeFrameChange('2h')}>2 Hours</button>
                <button onClick={() => handleTimeFrameChange('4h')}>4 Hours</button>
                <button onClick={() => handleTimeFrameChange('8h')}>8 Hours</button>
                <button onClick={() => handleTimeFrameChange('12h')}>12 Hours</button>
                <button onClick={() => handleTimeFrameChange('1d')}>1 Day</button>
                <button onClick={() => handleTimeFrameChange('2d')}>2 Days</button>
                <button onClick={() => handleTimeFrameChange('1w')}>1 Week</button>
                <button onClick={() => handleTimeFrameChange('1M')}>1 Month</button>
            </div>

            {/* Chart Canvas */}
            <canvas id="chart" width="800" height="400"></canvas>
        </div>
    );
}

export default BinanceFuturesChart;
