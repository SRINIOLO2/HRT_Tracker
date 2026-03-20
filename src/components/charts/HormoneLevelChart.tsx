'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import type { BloodTest } from '@/lib/db';

interface Props {
  data: BloodTest[];
}

export function HormoneLevelChart({ data }: Props) {
  // Group data by hormone type
  const hormoneTypes = [...new Set(data.map(d => d.hormone))];
  const colors = ['#7c5cfc', '#ff6b9d', '#22c997', '#f5a623', '#4da6ff', '#b44dff'];

  // Create chart data points sorted by date
  const sorted = [...data].sort((a, b) => a.testDate - b.testDate);
  const chartData = sorted.map(d => ({
    date: format(new Date(d.testDate), 'MMM d'),
    dateRaw: d.testDate,
    [d.hormone]: d.value,
    [`${d.hormone}_unit`]: d.unit,
  }));

  // Merge entries with same date
  const merged = chartData.reduce((acc, item) => {
    const existing = acc.find(a => a.date === item.date);
    if (existing) {
      Object.assign(existing, item);
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as Record<string, unknown>[]);

  if (data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <p className="empty-state-desc">No blood test data to display yet</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
            }}
          />
          <Legend />
          {hormoneTypes.map((hormone, i) => (
            <Line
              key={hormone}
              type="monotone"
              dataKey={hormone}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: colors[i % colors.length] }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
