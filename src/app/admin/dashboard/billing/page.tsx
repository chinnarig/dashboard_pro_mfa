import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Coins,
  TrendingUp,
  Calendar,
  Phone,
  DollarSign,
  Activity
} from 'lucide-react';
import { PaymentButton } from '@/components/billing/PaymentButton';

// Call data interface
interface Call {
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

interface UsageData {
  totalMinutes: number;
  totalCost: number;
  currentMonth: string;
  agentUsage: {
    agent_name: string;
    minutes: number;
    cost: number;
    calls: number;
  }[];
}

async function getBillingData(): Promise<UsageData> {
  try {
    const response = await fetch('http://localhost:8080/api/v1/calls', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calls');
    }

    const calls: Call[] = await response.json();

    // Calculate billing data
    const costPerMinute = 0.10;
    const agentMap = new Map<string, { minutes: number; cost: number; calls: number }>();

    let totalMinutes = 0;

    calls.forEach((call) => {
      // Convert milliseconds to minutes (round up)
      const minutes = Math.ceil(call.duration_ms / 60000);
      const cost = minutes * costPerMinute;

      totalMinutes += minutes;

      // Aggregate by agent
      const existing = agentMap.get(call.agent_name);
      if (existing) {
        existing.minutes += minutes;
        existing.cost += cost;
        existing.calls += 1;
      } else {
        agentMap.set(call.agent_name, {
          minutes,
          cost,
          calls: 1,
        });
      }
    });

    // Convert map to array
    const agentUsage = Array.from(agentMap.entries()).map(([agent_name, data]) => ({
      agent_name,
      minutes: data.minutes,
      cost: data.cost,
      calls: data.calls,
    }));

    return {
      totalMinutes,
      totalCost: totalMinutes * costPerMinute,
      currentMonth: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      agentUsage,
    };
  } catch (error) {
    console.error('Error fetching billing data:', error);
    // Return empty data on error
    return {
      totalMinutes: 0,
      totalCost: 0,
      currentMonth: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      agentUsage: [],
    };
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export default async function BillingPage() {
  const billingData = await getBillingData();
  const costPerMinute = 0.10;
  const totalCalls = billingData.agentUsage.reduce((sum, agent) => sum + agent.calls, 0);
  const avgMinutesPerCall = totalCalls > 0 ? billingData.totalMinutes / totalCalls : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Usage</h1>
        <p className="text-muted-foreground mt-2">
          Track your AI agent usage and costs for {billingData.currentMonth}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Minutes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData.totalMinutes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatMinutes(billingData.totalMinutes)} of call time
            </p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingData.totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              £{costPerMinute.toFixed(2)} per minute
            </p>
          </CardContent>
        </Card>

        {/* Total Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {avgMinutesPerCall.toFixed(1)} min/call
            </p>
          </CardContent>
        </Card>

        {/* Active Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData.agentUsage.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Agents with usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Card */}
      {billingData.totalCost > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Outstanding Balance
            </CardTitle>
            <CardDescription>
              Pay your current usage charges securely with Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Amount Due</div>
                <div className="text-4xl font-bold text-green-600">
                  {formatCurrency(billingData.totalCost)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  For {billingData.totalMinutes} minutes of usage
                </div>
              </div>
              <PaymentButton
                amount={billingData.totalCost}
                description={`AI Agent Usage - ${billingData.currentMonth}`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Information */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-600" />
            Pricing Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Rate per Minute</div>
              <div className="text-3xl font-bold text-blue-600">£0.10</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Example: 10 Minutes</div>
              <div className="text-2xl font-semibold">= £1.00</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Example: 100 Minutes</div>
              <div className="text-2xl font-semibold">= £10.00</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage by Agent */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Agent</CardTitle>
          <CardDescription>
            Detailed breakdown of minutes and costs per agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingData.agentUsage.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No call data available for this period.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead className="text-center">Calls</TableHead>
                      <TableHead className="text-right">Minutes</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingData.agentUsage
                      .sort((a, b) => b.cost - a.cost)
                      .map((agent, index) => {
                        const percentage = (agent.cost / billingData.totalCost) * 100;
                        return (
                          <TableRow key={`${agent.agent_name}-${index}`}>
                            <TableCell className="font-medium">
                              {agent.agent_name}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{agent.calls}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {agent.minutes} min
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(agent.cost)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground w-12">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>

              {/* Total Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Current Month Total</div>
                    <div className="text-lg font-semibold">{billingData.currentMonth}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {billingData.totalMinutes} minutes × £{costPerMinute.toFixed(2)}
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(billingData.totalCost)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cost Calculation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            How Billing Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">1</span>
              </div>
              <div>
                <div className="font-medium mb-1">Per-Minute Billing</div>
                <p className="text-muted-foreground">
                  You are charged £0.10 for every minute of agent call time. Partial minutes are rounded up.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">2</span>
              </div>
              <div>
                <div className="font-medium mb-1">Monthly Billing Cycle</div>
                <p className="text-muted-foreground">
                  Usage is calculated from the 1st to the last day of each calendar month.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">3</span>
              </div>
              <div>
                <div className="font-medium mb-1">Example Calculation</div>
                <p className="text-muted-foreground">
                  10 minutes of calls = 10 × £0.10 = <strong>£1.00</strong><br />
                  {billingData.totalMinutes > 0 && (
                    <>{billingData.totalMinutes} minutes of calls = {billingData.totalMinutes} × £0.10 = <strong>{formatCurrency(billingData.totalCost)}</strong></>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}