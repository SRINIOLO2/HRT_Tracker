'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import type { MoodEntry } from '@/lib/db';

interface Props {
  data: MoodEntry[];
  syncId?: string;
}

export function MoodTrendChart({ data, syncId }: Props) {
  const sorted = [...data].sort((a, b) => a.createdAt - b.createdAt);
  const chartData = sorted.map(d => ({
    date: format(new Date(d.createdAt), 'MMM d'),
    mood: d.mood,
    energy: d.energy,
  }));

  if (data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <p className="empty-state-desc">No mood data to display yet</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} syncId={syncId} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6b9d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ff6b9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
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
          <Area
            type="monotone"
            dataKey="mood"
            stroke="#7c5cfc"
            strokeWidth={2}
            fill="url(#moodGradient)"
            name="Mood"
          />
          <Area
            type="monotone"
            dataKey="energy"
            stroke="#ff6b9d"
            strokeWidth={2}
            fill="url(#energyGradient)"
            name="Energy"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
