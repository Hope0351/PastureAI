import React from 'react';
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
import { DistrictForecast, NdviRecord } from '../types';
import { useLanguage } from '../i18n';

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

interface NdviChartProps {
  districtName: string;
  historical: NdviRecord[];
  forecast: DistrictForecast | null;
  darkMode?: boolean;
}

export const NdviChart: React.FC<NdviChartProps> = ({ districtName, historical = [], forecast, darkMode = true }) => {
  const { t, tf } = useLanguage();
  // Combine historical Sentinel-2 dates + forecast horizon dates
  const historicalLabels = historical.map((h) => h.date);
  const historicalNdvi = historical.map((h) => h.ndvi);

  const forecastPoints = forecast && forecast.forecasts
    ? [0, 15, 30, 45, 60].map((day) => forecast.forecasts[day]).filter((p) => p != null)
    : [];
  const forecastLabels = forecastPoints.map((p) => p.date);

  const labels = [...historicalLabels, ...forecastLabels.slice(1)];

  // Safe padding array lengths
  const forecastPadLength = Math.max(0, forecastLabels.length - 1);
  const historicalPadLength = Math.max(0, historicalNdvi.length - 1);

  // Datasets setup
  const historicalDataPoints = [...historicalNdvi, ...Array(forecastPadLength).fill(null)];

  // Ensembled forecast dataset
  const lastHistoricalNdvi = historicalNdvi.length > 0 ? historicalNdvi[historicalNdvi.length - 1] : 0.3;
  
  const forecastDataPoints = [
    ...(historicalNdvi.length > 0 ? Array(historicalPadLength).fill(null) : []),
    lastHistoricalNdvi,
    ...forecastPoints.slice(1).map((p) => p.forecastNdvi),
  ];

  // Moving Average model curve
  const movingAvgPoints = [
    ...(historicalNdvi.length > 0 ? Array(historicalPadLength).fill(null) : []),
    lastHistoricalNdvi,
    ...forecastPoints.slice(1).map((p) => p.movingAverageNdvi),
  ];

  // Exponential Smoothing model curve
  const expSmoothingPoints = [
    ...(historicalNdvi.length > 0 ? Array(historicalPadLength).fill(null) : []),
    lastHistoricalNdvi,
    ...forecastPoints.slice(1).map((p) => p.exponentialSmoothingNdvi),
  ];

  // Polynomial Regression model curve
  const polyPoints = [
    ...(historicalNdvi.length > 0 ? Array(historicalPadLength).fill(null) : []),
    lastHistoricalNdvi,
    ...forecastPoints.slice(1).map((p) => p.polynomialRegressionNdvi),
  ];

  const textColor = darkMode ? '#E7E5E4' : '#1E293B';
  const subTextColor = darkMode ? '#A8A29E' : '#64748B';
  const gridColor = darkMode ? 'rgba(68, 64, 60, 0.3)' : 'rgba(203, 213, 225, 0.6)';
  const tooltipBg = darkMode ? '#1C1917' : '#FFFFFF';
  const tooltipText = darkMode ? '#F5F5F4' : '#0F172A';
  const tooltipBorder = darkMode ? '#44403C' : '#CBD5E1';

  const data = {
    labels,
    datasets: [
      {
        label: t.charts.observedNdvi,
        data: historicalDataPoints,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 2,
      },
      {
        label: t.charts.ensembleForecast,
        data: forecastDataPoints,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderDash: [5, 5],
        borderWidth: 2.5,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: t.charts.movingAverage,
        data: movingAvgPoints,
        borderColor: '#0284C7',
        borderDash: [2, 2],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
      {
        label: t.charts.holt,
        data: expSmoothingPoints,
        borderColor: '#A855F7',
        borderDash: [2, 2],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
      {
        label: t.charts.polynomial,
        data: polyPoints,
        borderColor: '#EF4444',
        borderDash: [2, 2],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          font: { size: 11 },
          boxWidth: 12,
        },
      },
      title: {
        display: true,
        text: tf(t.charts.ndviTitle, { name: districtName }),
        color: textColor,
        font: { size: 13, weight: 'bold' as const },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        borderColor: tooltipBorder,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: subTextColor, font: { size: 10 } },
        grid: { color: gridColor },
      },
      y: {
        min: 0.0,
        max: 0.8,
        ticks: { color: subTextColor, font: { size: 10 } },
        grid: { color: gridColor },
        title: {
          display: true,
          text: t.charts.ndviAxis,
          color: subTextColor,
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="w-full h-[320px] bg-white dark:bg-stone-900 p-4 rounded-xl border border-slate-200 dark:border-stone-800 shadow-xs transition-colors">
      <Line data={data} options={options} />
    </div>
  );
};
