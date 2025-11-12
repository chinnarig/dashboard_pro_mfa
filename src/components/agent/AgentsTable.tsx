'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pencil, X } from 'lucide-react';

interface Agent {
    agent_name: string;
    agent_id: string;
    voice_id: string;
    phone_number: string;
    last_modification_timestamp: number;
}

interface AgentsTableProps {
    agents: Agent[];
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function createEditUrl(agent: Agent): string {
    const params = new URLSearchParams({
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        voice_id: agent.voice_id,
        phone_number: agent.phone_number,
        mode: 'edit',
    });
    return `/admin/dashboard/voices?${params.toString()}`;
}

export default function AgentsTable({ agents }: AgentsTableProps) {
    const [phoneFilter, setPhoneFilter] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7d' | '30d' | '90d'>('all');

    const filteredAgents = useMemo(() => {
        let filtered = [...agents];

        // Filter by phone number
        if (phoneFilter) {
            filtered = filtered.filter((agent) => {
                const normalizedPhone = agent.phone_number.toLowerCase();
                const normalizedFilter = phoneFilter.toLowerCase();
                return (
                    normalizedPhone.includes(normalizedFilter) ||
                    (phoneFilter.toLowerCase() === 'not assigned' && agent.phone_number === 'Not Assigned')
                );
            });
        }

        // Filter by date
        if (dateFilter !== 'all') {
            const now = Date.now();
            const timeRanges = {
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
                '90d': 90 * 24 * 60 * 60 * 1000,
            };
            const cutoff = now - timeRanges[dateFilter];
            filtered = filtered.filter((agent) => agent.last_modification_timestamp >= cutoff);
        }

        return filtered;
    }, [agents, phoneFilter, dateFilter]);

    const handleClearFilters = () => {
        setPhoneFilter('');
        setDateFilter('all');
    };

    const hasActiveFilters = phoneFilter !== '' || dateFilter !== 'all';

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="phone-filter">Phone Number</Label>
                    <Input
                        id="phone-filter"
                        placeholder="Search phone number..."
                        value={phoneFilter}
                        onChange={(e) => setPhoneFilter(e.target.value)}
                        className="mt-1.5"
                    />
                </div>
                <div className="w-[200px]">
                    <Label htmlFor="date-filter">Last Modified</Label>
                    <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                        <SelectTrigger id="date-filter" className="mt-1.5">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters} size="default">
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Results Summary */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredAgents.length} of {agents.length} agents
            </div>

            {/* Table */}
            {filteredAgents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-md">
                    {hasActiveFilters
                        ? 'No agents match your filters. Try adjusting your search criteria.'
                        : 'No agents found. Create your first agent to get started.'}
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent Name</TableHead>
                                <TableHead>Agent ID</TableHead>
                                <TableHead>Voice ID</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Last Modified</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAgents.map((agent) => (
                                <TableRow key={agent.agent_id}>
                                    <TableCell className="font-medium">
                                        {agent.agent_name}
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                            {agent.agent_id}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{agent.voice_id}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {agent.phone_number === 'Not Assigned' ? (
                                            <span className="text-muted-foreground italic">
                                                Not Assigned
                                            </span>
                                        ) : (
                                            agent.phone_number
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(agent.last_modification_timestamp)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={createEditUrl(agent)}>
                                            <Button variant="ghost" size="sm">
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}