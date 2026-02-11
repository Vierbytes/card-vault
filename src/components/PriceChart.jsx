/**
 * PriceChart Component
 *
 * Displays historical price data using Chart.js.
 * I learned Chart.js needs to register components before use with React.
 */

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { cardAPI } from '../services/api';
import './PriceChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function PriceChart({ cardId, duration = '30d' }) {
  const [chartData, setChartData] = useState(null);
  const [priceInfo, setPriceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(duration);

  // Fetch price history when cardId or duration changes
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (!cardId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await cardAPI.getPriceHistory(cardId, selectedDuration);
        const data = response.data.data;

        // If we have history data, use it for the chart
        // If not but we have a current price, show it as a single data point
        // so the chart isn't completely empty
        const hasHistory = data.history && data.history.length > 0;
        const hasCurrentPrice = data.currentPrice && data.currentPrice > 0;

        if (!hasHistory && !hasCurrentPrice) {
          setError('No price data available for this card');
          setLoading(false);
          return;
        }

        let labels, prices;

        if (hasHistory) {
          // Use the stored price history for the chart
          labels = data.history.map((entry) =>
            new Date(entry.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          );
          prices = data.history.map((entry) => entry.price);
        } else {
          // No history yet - show just today's current price as a starting point
          // This gives users something to see instead of an empty chart
          const today = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          labels = [today];
          prices = [data.currentPrice];
        }

        setChartData({
          labels,
          datasets: [
            {
              label: 'Price ($)',
              data: prices,
              fill: true,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.4,
              pointRadius: hasHistory ? 2 : 6,
              pointHoverRadius: 6,
            },
          ],
        });

        setPriceInfo({
          currentPrice: data.currentPrice,
          priceChange: data.priceChange,
          isNewTracking: !hasHistory && hasCurrentPrice,
        });
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError('Failed to load price history');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [cardId, selectedDuration]);

  // Chart.js options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `$${context.raw.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  // Duration selector buttons
  const durations = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '180d', label: '6M' },
  ];

  if (loading) {
    return (
      <div className="price-chart-container">
        <div className="chart-loading">Loading price history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-chart-container">
        <div className="chart-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="price-chart-container">
      {/* Header with price info */}
      <div className="chart-header">
        <div className="price-info">
          {priceInfo && (
            <>
              <span className="current-price">${priceInfo.currentPrice?.toFixed(2)}</span>
              {priceInfo.priceChange && (
                <div className="price-changes">
                  <span
                    className={`change ${priceInfo.priceChange.day >= 0 ? 'positive' : 'negative'}`}
                  >
                    24h: {priceInfo.priceChange.day >= 0 ? '+' : ''}
                    {priceInfo.priceChange.day?.toFixed(1)}%
                  </span>
                  <span
                    className={`change ${priceInfo.priceChange.week >= 0 ? 'positive' : 'negative'}`}
                  >
                    7d: {priceInfo.priceChange.week >= 0 ? '+' : ''}
                    {priceInfo.priceChange.week?.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Duration selector */}
        <div className="duration-selector">
          {durations.map((d) => (
            <button
              key={d.value}
              className={`duration-btn ${selectedDuration === d.value ? 'active' : ''}`}
              onClick={() => setSelectedDuration(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="chart-wrapper">
        {chartData && <Line data={chartData} options={chartOptions} />}
      </div>

      {/* Show a note when we only have today's price (no history yet) */}
      {priceInfo?.isNewTracking && (
        <p className="chart-note">
          Price tracking started today. The chart will fill in over time as we record daily prices.
        </p>
      )}
    </div>
  );
}

export default PriceChart;
