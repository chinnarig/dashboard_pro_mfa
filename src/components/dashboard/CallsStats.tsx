import { Phone, Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Call, CallStats } from "@/types/call";

function calculateStats(calls: Call[]): CallStats {
  const totalCalls = calls.length;
  const totalDuration = calls.reduce((sum, call) => sum + call.duration_ms, 0);
  const averageDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
  const endedCalls = calls.filter(call => call.call_status === 'ended').length;

  const callsByAgent = calls.reduce((acc, call) => {
    acc[call.agent_name] = (acc[call.agent_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const callsByDay = calls.reduce((acc, call) => {
    const date = new Date(call.start_timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalCalls,
    totalDuration,
    averageDuration,
    endedCalls,
    callsByAgent,
    callsByDay,
  };
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function CallsStats({ calls }: { calls: Call[] }) {
  const stats = calculateStats(calls);
  const uniqueAgents = Object.keys(stats.callsByAgent).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCalls}</div>
          <p className="text-xs text-muted-foreground">
            {stats.endedCalls} ended calls
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(stats.averageDuration)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total: {formatDuration(stats.totalDuration)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueAgents}</div>
          <p className="text-xs text-muted-foreground">
            Unique agents handling calls
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalCalls > 0
              ? `${((stats.endedCalls / stats.totalCalls) * 100).toFixed(1)}%`
              : '0%'
            }
          </div>
          <p className="text-xs text-muted-foreground">
            Completed successfully
          </p>
        </CardContent>
      </Card>
    </div>
  );
}