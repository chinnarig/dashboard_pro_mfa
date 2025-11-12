import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AgentsTable from '@/components/agent/AgentsTable';

interface Agent {
  agent_name: string;
  agent_id: string;
  voice_id: string;
  phone_number: string;
  last_modification_timestamp: number;
}

async function getAgents(): Promise<Agent[]> {
  try {
    const response = await fetch(
      'https://zstream-qa-1073093827343.us-central1.run.app/api/v1/agents',
      {
        cache: 'no-store', // Ensures fresh data on each request
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all your AI agents
          </p>
        </div>
        <Link href="/admin/dashboard/voices">
          <Button>Create New Agent</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Agents ({agents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentsTable agents={agents} />
        </CardContent>
      </Card>
    </div>
  );
}