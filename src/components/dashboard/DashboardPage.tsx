"use client";

import { useEffect, useState } from "react";
import { CallsTable } from "@/components/dashboard/CallsTable"
import { CallsStats } from "@/components/dashboard/CallsStats"
import { CallsChart } from "@/components/dashboard/CallsChart"
import { Loader2 } from "lucide-react";
import { Call } from "@/types/call";

export default function DashBoardPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCalls() {
      try {
        setIsLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        const response = await fetch(`${backendUrl}/api/v1/calls`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch calls');
        }

        const data = await response.json();
        setCalls(data);
      } catch (error) {
        console.error('Error fetching calls:', error);
        setError('Failed to load call data');
        setCalls([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCalls();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading call data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Call Analytics Dashboard</h1>
        <p className="text-muted-foreground">Monitor and analyze your call data</p>
      </div>

      <CallsStats calls={calls} />
      <CallsChart calls={calls} />
      <CallsTable calls={calls} />
    </div>
  )
}