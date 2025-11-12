"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Call } from "@/types/call";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getStatusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ended: "default",
    active: "secondary",
    failed: "destructive",
  };

  return (
    <Badge variant={variants[status] || "outline"}>
      {status}
    </Badge>
  );
}

export function CallsTable({ calls }: { calls: Call[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Calls</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Call ID</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <TableRow key={call.call_id}>
                <TableCell className="font-mono text-xs">
                  {call.call_id.slice(0, 15)}...
                </TableCell>
                <TableCell>{call.agent_name}</TableCell>
                <TableCell>{call.from_number}</TableCell>
                <TableCell>{call.to_number}</TableCell>
                <TableCell className="text-xs">
                  {formatDate(call.start_timestamp)}
                </TableCell>
                <TableCell>{formatDuration(call.duration_ms)}</TableCell>
                <TableCell>{getStatusBadge(call.call_status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {call.disconnection_reason.replace('_', ' ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}