"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Call } from "@/types/call";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function CallsChart({ calls }: { calls: Call[] }) {
  // Group calls by date
  const callsByDate = calls.reduce((acc, call) => {
    const date = new Date(call.start_timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    if (!acc[date]) {
      acc[date] = { date, calls: 0, duration: 0 };
    }

    acc[date].calls += 1;
    acc[date].duration += call.duration_ms / 1000 / 60; // Convert to minutes

    return acc;
  }, {} as Record<string, { date: string; calls: number; duration: number }>);

  const chartData = Object.values(callsByDate).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Volume Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="calls"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorCalls)"
              name="Number of Calls"
            />
            <Area
              type="monotone"
              dataKey="duration"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#colorDuration)"
              name="Duration (min)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}