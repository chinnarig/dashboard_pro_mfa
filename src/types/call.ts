// Updated Call types to match API response from backend
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

// Database schema interface (for reference)
export interface CallLogDB {
  id: string;
  livekitRoomId: string;
  agentId?: string;
  agentName?: string;

  // Call details
  direction: 'inbound' | 'outbound';
  callerPhone: string;
  agentPhone?: string;

  // Timing
  startTime: Date | string;
  endTime?: Date | string;
  durationSeconds?: number;

  // Status
  status?: string; // 'initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy'
  disconnectReason?: string;

  // Disposition
  dispositionCode?: string;
  dispositionNotes?: string;

  // Data
  transcript?: any; // JSONB
  analysis?: any; // JSONB

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CallStats {
  totalCalls: number;
  totalDuration: number;
  averageDuration: number;
  endedCalls: number;
  callsByAgent: Record<string, number>;
  callsByDay: Record<string, number>;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  phoneNumber?: string;
  livekitAgentName: string;

  // Voice config
  voiceProvider?: string;
  voiceId?: string;
  language?: string;

  // LLM config
  llmProvider?: string;
  llmModel?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;

  // Status
  status: string;
  isPhoneActive: boolean;

  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string;
}

export interface PhoneNumber {
  id: string;
  phoneNumber: string;
  provider: string;
  providerSid?: string;
  trunkId?: string;
  countryCode?: string;
  numberType?: string;
  isAvailable: boolean;
  assignedToAgentId?: string;
  supportsVoice: boolean;
  supportsSms: boolean;
  friendlyName?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string;
}

export interface Prompt {
  id: string;
  agentId: string;
  greetingMessage?: string;
  systemInstructions?: string;
  endCallPhrases?: string[];
  enableInterruptions: boolean;
  silenceTimeoutSeconds: number;
  maxResponseLength?: number;
  responseStyle?: string;
  version: number;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string;
}
