import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { WeatherData } from '../types';
import { useLanguage } from '../i18n';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherChartProps {
  weatherList: WeatherData[];
  darkMode?: boolean;
}

export const WeatherChart: React.FC<WeatherChartProps> = ({ weatherList = [], darkMode = true }) => {
  const { t } = useLanguage();
  const labels = weatherList.map((w) => w.districtName);
  const rainfall7Day = weatherList.map((w) => w.rainfall7DaySum);
  const maxTemps = weatherList.map((w) => w.maxTemp);
  const droughtIndex = weatherList.map((w) => w.droughtSeverityIndex);

  const textColor = darkMode ? '#E7E5E4' : '#1E293B';
  const subTextColor = darkMode ? '#A8A29E' : '#64748B';
  const gridColor = darkMode ? 'rgba(68, 64, 60, 0.2)' : 'rgba(203, 213, 225, 0.6)';
  const tooltipBg = darkMode ? '#1C1917' : '#FFFFFF';
  const tooltipText = darkMode ? '#F5F5F4' : '#0F172A';

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: t.charts.rainfallSeries,
        data: rainfall7Day,
        backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.7)' : 'rgba(2, 132, 199, 0.7)',
        borderColor: '#0284C7',
        borderWidth: 1,
        yAxisID: 'yRain',
      },
      {
        type: 'line' as const,
        label: t.charts.maxTempSeries,
        data: maxTemps,
        borderColor: '#F97316',
        backgroundColor: '#F97316',
        borderWidth: 2,
        pointRadius: 4,
        yAxisID: 'yTemp',
      },
      {
        type: 'line' as const,
        label: t.charts.droughtSeries,
        data: droughtIndex,
        borderColor: '#EF4444',
        borderDash: [4, 4],
        borderWidth: 2,
        pointRadius: 3,
        yAxisID: 'yTemp',
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
        text: t.charts.weatherTitle,
        color: textColor,
        font: { size: 13, weight: 'bold' as const },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
      },
    },
    scales: {
      x: {
        ticks: { color: subTextColor, font: { size: 10 } },
        grid: { color: gridColor },
      },
      yRain: {
        type: 'linear' as const,
        position: 'left' as const,
        min: 0,
        ticks: { color: darkMode ? '#38BDF8' : '#0284C7', font: { size: 10 } },
        grid: { color: gridColor },
        title: {
          display: true,
          text: t.charts.rainfallAxis,
          color: darkMode ? '#38BDF8' : '#0284C7',
          font: { size: 11 },
        },
      },
      yTemp: {
        type: 'linear' as const,
        position: 'right' as const,
        min: 0,
        max: 100,
        ticks: { color: '#F97316', font: { size: 10 } },
        grid: { drawOnChartArea: false },
        title: {
          display: true,
          text: t.charts.tempDroughtAxis,
          color: '#F97316',
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="w-full h-[320px] bg-white dark:bg-stone-900 p-4 rounded-xl border border-slate-200 dark:border-stone-800 shadow-xs transition-colors">
      <Chart type="bar" data={data} options={options} />
    </div>
  );
};
