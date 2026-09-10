import React from 'react';

interface PressureGaugeProps {
  score: number;
  size?: number;
}

function PressureGauge({ score, size = 100 }: PressureGaugeProps) {
  const getColor = (score: number) => {
    if (score >= 75) return '#ef4444'; // Red
    if (score >= 50) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const getLabel = (score: number) => {
    if (score >= 75) return 'HIGH';
    if (score >= 50) return 'MED';
    return 'LOW';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke="#334155"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="4"
          strokeDasharray={`${(score / 100) * (Math.PI * (size - 16))} ${Math.PI * (size - 16)}`}
          strokeLinecap="round"
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dy="0.3em"
          className="transform rotate-90"
          style={{ fontSize: `${size / 4}px`, fontWeight: 'bold', fill: getColor(score) }}
        >
          {score}
        </text>
      </svg>
      <span className="text-xs font-semibold mt-2" style={{ color: getColor(score) }}>
        {getLabel(score)}
      </span>
    </div>
  );
}

export default PressureGauge;
