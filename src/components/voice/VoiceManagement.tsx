"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';


// Interface for the voice data from the API
interface Voice {
    voice_id: string;
    voice_name: string;
    gender: string;
    accent: string;
    age: string;
    preview_audio_url: string;
}

// Interface for the phone number data from the API
interface PhoneNumber {
    display_name: string;
    phone_number: string;
}

// Interface for the created agent card
interface Agent {
    id: string;
    agentName: string;
    prompt: string;
    voice: Voice;
    phoneNumber: PhoneNumber;
}



interface VoiceManagementProps {
    users: any[];
}
const VoiceManagement = (props: VoiceManagementProps) => {
    const { users } = props;
    // State for voices and phone numbers fetched from APIs
    const [voices, setVoices] = useState<Voice[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);

    // State for the list of created agents
    const [createdAgents, setCreatedAgents] = useState<Agent[]>([]);

    // Form input states
    const [prompt, setPrompt] = useState('');
    const [agentName, setAgentName] = useState('');
    const [selectedVoiceId, setSelectedVoiceId] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dialog states
    const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


    // Fetch voices and phone numbers from APIs on component mount
    // Fetch voices and phone numbers from APIs on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

                // Fetch voices - Updated endpoint
                const voicesResponse = await fetch(`${backendUrl}/api/v1/voices`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                });

                if (!voicesResponse.ok) {
                    throw new Error(`Failed to fetch voices: ${voicesResponse.status}`);
                }

                const voicesData = await voicesResponse.json();
                console.log('Voices response:', voicesData); // Debug log

                // Check if voicesData is an array or an object with nested array
                if (Array.isArray(voicesData)) {
                    setVoices(voicesData);
                } else if (voicesData && typeof voicesData === 'object') {
                    // If it's an object, try to find the array inside
                    // Common patterns: voicesData.voices, voicesData.data, voicesData.results, voicesData.cartesia
                    const voicesArray = voicesData.voices ||
                        voicesData.data ||
                        voicesData.results ||
                        voicesData.cartesia ||
                        [];
                    setVoices(voicesArray);
                } else {
                    setVoices([]);
                }

                // Fetch phone numbers - Updated endpoint
                const phoneNumbersResponse = await fetch(`${backendUrl}/api/v1/phone-numbers`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                });

                if (!phoneNumbersResponse.ok) {
                    throw new Error(`Failed to fetch phone numbers: ${phoneNumbersResponse.status}`);
                }

                const phoneNumbersData = await phoneNumbersResponse.json();
                console.log('Phone numbers response:', phoneNumbersData); // Debug log

                // Same logic for phone numbers
                if (Array.isArray(phoneNumbersData)) {
                    setPhoneNumbers(phoneNumbersData);
                } else if (phoneNumbersData && typeof phoneNumbersData === 'object') {
                    const phoneArray = phoneNumbersData.phone_numbers ||
                        phoneNumbersData.data ||
                        phoneNumbersData.results ||
                        [];
                    setPhoneNumbers(phoneArray);
                } else {
                    setPhoneNumbers([]);
                }

            } catch (err: any) {
                console.error('Error fetching data:', err);

                if (err instanceof TypeError && err.message === 'Failed to fetch') {
                    setError('Network error: Unable to connect to the API. Please check CORS configuration.');
                } else {
                    setError(err.message || 'An error occurred while fetching data');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAddAgent = async () => {
        // Validation
        if (!prompt.trim() || !agentName.trim() || !selectedVoiceId || !selectedPhoneNumber) {
            setError('Please fill out all required fields.');
            return;
        }

        // Check for duplicate agent name
        if (createdAgents.some(agent => agent.agentName.toLowerCase() === agentName.trim().toLowerCase())) {
            setError('An agent with this name already exists.');
            return;
        }

        console.log('Creating agent with:', { prompt, agentName, selectedVoiceId, selectedPhoneNumber });
        try {
            setIsCreating(true);
            setError(null);

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
            const response = await fetch(`${backendUrl}/api/v1/agents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agent_name: agentName.trim(),
                    voice_id: selectedVoiceId,
                    phone_number: selectedPhoneNumber,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create agent');
            }

            // On success, find the full voice and phone number objects to display in the card
            const selectedVoice = voices.find(v => v.voice_id === selectedVoiceId);
            const selectedPhone = phoneNumbers.find(p => p.phone_number === selectedPhoneNumber);

            if (selectedVoice && selectedPhone) {
                const newAgent: Agent = {
                    id: `agent_${Date.now()}`,
                    agentName: agentName.trim(),
                    prompt: prompt.trim(),
                    voice: selectedVoice,
                    phoneNumber: selectedPhone,
                };

                setCreatedAgents(prev => [...prev, newAgent]);

                // Reset form fields
                setPrompt('');
                setAgentName('');
                setSelectedVoiceId('');
                setSelectedPhoneNumber('');
            }

        } catch (err: any) {
            setError(err.message);
            console.error('Error creating agent:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const openDeleteDialog = (agent: Agent) => {
        setAgentToDelete(agent);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (agentToDelete) {
            setCreatedAgents(prev => prev.filter(a => a.id !== agentToDelete.id));
            setIsDeleteDialogOpen(false);
            setAgentToDelete(null);
        }
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold  mb-2">Manage your agents</h1>
                    <p>Select and assign custom agents</p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="rounded-xl shadow-sm border p-6 mb-6">
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Prompt Section */}
                        <div className="space-y-2">
                            <Label htmlFor="prompt-id">Prompt *</Label>
                            <Textarea
                                id="prompt-id"
                                placeholder="Enter your prompt here"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="min-h-[400px] max-h-[400px] resize-none overflow-y-auto"
                            />
                        </div>

                        {/* Form Fields Section */}
                        <div className="space-y-6">
                            {/* Agent Name */}
                            <div className="space-y-2">
                                <Label htmlFor="agentName">Agent Name *</Label>
                                <Input
                                    id="agentName"
                                    type="text"
                                    placeholder="Enter custom agent name"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    className="h-11"
                                />
                            </div>

                            {/* Select Voice */}
                            <div className="space-y-2">
                                <Label htmlFor="voiceSelect">Select Voice *</Label>
                                <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId} disabled={isLoading}>
                                    <SelectTrigger className="h-11 w-full">
                                        <SelectValue placeholder="Select a voice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {voices?.map((voice) => (
                                            <SelectItem key={voice.voice_id} value={voice.voice_id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{voice.voice_name}</span>
                                                    <span className="text-xs text-slate-500">• {voice.accent}</span>
                                                    <span className="text-xs text-slate-500">• {voice.age}</span>
                                                    <span className="text-xs text-slate-500">• {voice.gender}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phoneSelect">Select Phone Number *</Label>
                                <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber} disabled={isLoading}>
                                    <SelectTrigger className="h-11 w-full">
                                        <SelectValue placeholder="Select a phone number" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {phoneNumbers?.map((phone) => (
                                            <SelectItem key={phone.phone_number} value={phone.phone_number}>
                                                {phone.display_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select User Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phoneSelect">Select User Number *</Label>
                                <Select value={selectedPhoneNumber} onValueChange={setSelectedPhoneNumber} disabled={isLoading}>
                                    <SelectTrigger className="h-11 w-full">
                                        <SelectValue placeholder="Select a user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users?.map((users: any) => (
                                            <SelectItem key={users.id} value={users.id}>
                                                {users.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Add Agent Button */}
                            <Button
                                className="w-full h-11"
                                onClick={handleAddAgent}
                                disabled={isCreating || isLoading}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add Agent
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-2">Loading voices and numbers...</span>
                    </div>
                ) : (
                    <>
                        {/* Created Agents Header */}
                        {createdAgents.length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-2xl font-semibold text-slate-800 mb-4">
                                    Created Agents ({createdAgents.length})
                                </h2>
                            </div>
                        )}

                        {/* Agent Cards Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {createdAgents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="rounded-lg border p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
                                >
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-semibold text-slate-800">
                                                {agent.agentName}
                                            </h3>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDeleteDialog(agent)}
                                                className="h-8 w-8"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-3 text-sm border-t pt-3">
                                            <div>
                                                <p className="font-medium">Prompt:</p>
                                                <p className="text-slate-600 line-clamp-3">{agent.prompt}</p>
                                            </div>
                                            <div>
                                                <p className=" font-medium">Voice:</p>
                                                <p className="text-slate-600">{agent.voice.voice_name} ({agent.voice.accent})</p>
                                            </div>
                                            <div>
                                                <p className=" font-medium">Phone:</p>
                                                <p >{agent.phoneNumber.display_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {createdAgents.length === 0 && !isLoading && (
                            <div className="text-center py-12 rounded-lg border border-slate-200">
                                <p className="text-slate-500 text-lg">No agents created yet</p>
                                <p className="text-slate-400 text-sm mt-2">Fill out the form above to create your first agent.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove Agent?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove <strong>{agentToDelete?.agentName}</strong>. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                            >
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

export default VoiceManagement;