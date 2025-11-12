export interface Call {
  call_id: string;
  agent_name: string;
  start_timestamp: number;
  end_timestamp: number;
  duration_ms: number;
  call_status: string;
  from_number: string;
  to_number: string;
  disconnection_reason: string;
}

export interface CallStats {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
  endedCalls: number;
  callsByAgent: Record<string, number>;
  callsByDay: Record<string, number>;
}