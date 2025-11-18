"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, Pencil, ArrowLeft, CheckCircle, Play, Pause, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

// Props interface for edit mode
interface VoiceManagementAppProps {
    editData?: {
        agent_id: string;
        agent_name: string;
        voice_id: string;
        phone_number: string;
    } | null;
}

const VoiceManagementApp = ({ editData }: VoiceManagementAppProps) => {
    const router = useRouter();

    // State for voices and phone numbers fetched from APIs
    const [voices, setVoices] = useState<Voice[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);

    // State for the list of created agents
    const [createdAgents, setCreatedAgents] = useState<Agent[]>([]);

    // Form input states
    const [prompt, setPrompt] = useState('');
    const [agentName, setAgentName] = useState('');
    const [selectedVoiceId, setSelectedVoiceId] = useState('');
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');
    const [agentId, setAgentId] = useState(''); // Store agent ID for updates

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isFetchingAgent, setIsFetchingAgent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Dialog states
    const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);

    // Audio playback state
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch full agent details when in edit mode
    useEffect(() => {
        if (editData) {
            setIsEditMode(true);
            setAgentId(editData.agent_id);
            setAgentName(editData.agent_name);
            setSelectedVoiceId(editData.voice_id);
            setSelectedPhoneNumber(editData.phone_number !== 'Not Assigned' ? editData.phone_number : '');

            // Fetch full agent details including prompt
            fetchAgentDetails(editData.agent_id);
        }
    }, [editData]);

    // Fetch full agent details by ID
    const fetchAgentDetails = async (id: string) => {
        setIsFetchingAgent(true);
        setError(null);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
            const response = await fetch(
                `${backendUrl}/api/v1/agents/${id}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch agent details: ${response.status}`);
            }

            const agentData = await response.json();
            console.log('Agent details:', agentData);

            // Pre-fill form with fetched data
            if (agentData.prompt) {
                setPrompt(agentData.prompt);
            }
            // You can add more fields here if your API returns additional data

        } catch (err: any) {
            console.error('Error fetching agent details:', err);
            setError('Failed to load agent details. Please try again.');
        } finally {
            setIsFetchingAgent(false);
        }
    };

    // Fetch voices and phone numbers from APIs on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

                // Fetch voices
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
                console.log('Voices response:', voicesData);

                if (Array.isArray(voicesData)) {
                    setVoices(voicesData);
                } else if (voicesData && typeof voicesData === 'object') {
                    const voicesArray = voicesData.voices ||
                        voicesData.data ||
                        voicesData.results ||
                        voicesData.cartesia ||
                        [];
                    setVoices(voicesArray);
                } else {
                    setVoices([]);
                }

                // Fetch phone numbers
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
                console.log('Phone numbers response:', phoneNumbersData);

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
        // Validation - removed prompt validation
        if (!agentName.trim() || !selectedVoiceId || !selectedPhoneNumber) {
            setError('Please fill out all required fields.');
            return;
        }

        if (isEditMode) {
            // Handle update logic
            await handleUpdateAgent();
        } else {
            // Handle create logic
            await handleCreateAgent();
        }
    };

    const handleCreateAgent = async () => {
        // Check for duplicate agent name
        if (createdAgents.some(agent => agent.agentName.toLowerCase() === agentName.trim().toLowerCase())) {
            setError('An agent with this name already exists.');
            return;
        }

        setIsCreating(true);
        setError(null);
        setSuccess(null);

        try {
            // Find the selected voice and phone number objects
            const selectedVoice = voices.find(v => v.voice_id === selectedVoiceId);
            const selectedPhone = phoneNumbers.find(p => p.phone_number === selectedPhoneNumber);

            if (!selectedVoice || !selectedPhone) {
                throw new Error('Selected voice or phone number not found');
            }

            // TODO: Replace with your actual API call to create agent
            // const response = await fetch('https://zstream-qa-1073093827343.us-central1.run.app/api/v1/agents', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         agent_name: agentName,
            //         prompt: prompt,
            //         voice_id: selectedVoiceId,
            //         phone_number: selectedPhoneNumber
            //     })
            // });

            // For now, creating a mock agent
            const newAgent: Agent = {
                id: Date.now().toString(),
                agentName: agentName.trim(),
                prompt: prompt.trim(),
                voice: selectedVoice,
                phoneNumber: selectedPhone
            };

            setCreatedAgents([...createdAgents, newAgent]);
            setSuccess('Agent created successfully!');

            // Clear form
            setPrompt('');
            setAgentName('');
            setSelectedVoiceId('');
            setSelectedPhoneNumber('');

            console.log('Agent created successfully:', newAgent);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Error creating agent:', err);
            setError(err.message || 'Failed to create agent');
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateAgent = async () => {
        setIsCreating(true);
        setError(null);
        setSuccess(null);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
            const response = await fetch(
                `${backendUrl}/api/v1/agents/${agentId}`,
                {
                    method: 'PUT', // or 'PATCH' depending on your API
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                    body: JSON.stringify({
                        agent_name: agentName,
                        prompt: prompt,
                        voice_id: selectedVoiceId,
                        phone_number: selectedPhoneNumber,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to update agent: ${response.status}`);
            }

            const updatedAgent = await response.json();
            console.log('Agent updated successfully:', updatedAgent);

            setSuccess('Agent updated successfully!');

            // Wait a moment to show success message, then redirect
            setTimeout(() => {
                router.push('/admin/dashboard/agents');
            }, 1500);

        } catch (err: any) {
            console.error('Error updating agent:', err);
            setError(err.message || 'Failed to update agent. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancelEdit = () => {
        router.push('/admin/dashboard/agents');
    };

    const openDeleteDialog = (agent: Agent) => {
        setAgentToDelete(agent);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!agentToDelete) return;

        try {
            // TODO: Replace with your actual API call to delete agent
            // await fetch(`https://zstream-qa-1073093827343.us-central1.run.app/api/v1/agents/${agentToDelete.id}`, {
            //     method: 'DELETE'
            // });

            setCreatedAgents(createdAgents.filter(agent => agent.id !== agentToDelete.id));
            console.log('Agent deleted:', agentToDelete);
        } catch (err: any) {
            console.error('Error deleting agent:', err);
            setError(err.message || 'Failed to delete agent');
        } finally {
            setIsDeleteDialogOpen(false);
            setAgentToDelete(null);
        }
    };

    // Handle audio playback
    const handlePlayAudio = (voiceId: string, audioUrl: string) => {
        // If clicking the same voice that's playing, pause it
        if (playingVoiceId === voiceId) {
            audioRef.current?.pause();
            setPlayingVoiceId(null);
            return;
        }

        // Stop current audio if playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Create and play new audio
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.play().catch((err) => {
            console.error('Error playing audio:', err);
            setError('Failed to play audio preview');
        });

        setPlayingVoiceId(voiceId);

        // Reset playing state when audio ends
        audio.onended = () => {
            setPlayingVoiceId(null);
        };
    };

    // Handle voice selection from dialog
    const handleSelectVoice = (voiceId: string) => {
        setSelectedVoiceId(voiceId);
        setIsVoiceDialogOpen(false);

        // Stop any playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingVoiceId(null);
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        {isEditMode ? (
                            <>
                                <Pencil className="w-8 h-8" />
                                Edit Agent
                            </>
                        ) : (
                            'Voice Management'
                        )}
                    </h1>
                    <p className="text-slate-600 mt-2">
                        {isEditMode
                            ? 'Update your agent configuration'
                            : 'Create and manage your AI voice agents'}
                    </p>
                </div>

                {/* Edit Mode Banner */}
                {isEditMode && (
                    <div className="mb-6">
                        <Alert className="border-blue-200 bg-blue-50">
                            <Pencil className="h-5 w-5 text-blue-600" />
                            <AlertDescription className="text-blue-900">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <strong>Edit Mode:</strong> You are editing agent &quot;{agentName}&quot;
                                        {isFetchingAgent && <span className="ml-2 text-sm">(Loading details...)</span>}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        className="text-blue-600 hover:text-blue-800"
                                        disabled={isCreating}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Agents List
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* Success Alert */}
                {success && (
                    <Alert className="mb-4 border-green-200 bg-green-50">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertDescription className="text-green-900">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-5 w-5" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg border p-6 shadow-sm bg-white sticky top-4">
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">
                                {isEditMode ? 'Update Agent' : 'Create New Agent'}
                            </h2>

                            {/* Loading state for fetching agent details */}
                            {isFetchingAgent ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="ml-2">Loading agent details...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Prompt */}
                                    <div className="space-y-2 mb-6">
                                        <Label htmlFor="prompt">Prompt</Label>
                                        <Textarea
                                            id="prompt"
                                            placeholder="Enter agent prompt"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            rows={4}
                                            className="resize-none"
                                            disabled
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
                                                disabled={isEditMode}
                                            />
                                            {isEditMode && (
                                                <p className="text-xs text-muted-foreground">
                                                    Agent name cannot be changed
                                                </p>
                                            )}
                                        </div>

                                        {/* Select Voice */}
                                        <div className="space-y-2">
                                            <Label htmlFor="voiceSelect">Select Voice *</Label>
                                            {selectedVoiceId ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-11 px-3 py-2 rounded-md border border-input bg-background flex items-center">
                                                        <span className="font-medium">
                                                            {voices.find(v => v.voice_id === selectedVoiceId)?.voice_name || 'Selected Voice'}
                                                        </span>
                                                        <span className="text-xs text-slate-500 ml-2">
                                                            • {voices.find(v => v.voice_id === selectedVoiceId)?.accent}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsVoiceDialogOpen(true)}
                                                        disabled={isLoading}
                                                        className="h-11"
                                                    >
                                                        Change
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsVoiceDialogOpen(true)}
                                                    disabled={isLoading}
                                                    className="w-full h-11"
                                                >
                                                    <Volume2 className="w-5 h-5 mr-2" />
                                                    Add Voice
                                                </Button>
                                            )}
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

                                        {/* Action Buttons */}
                                        <div className="space-y-2">
                                            <Button
                                                className="w-full h-11"
                                                onClick={handleAddAgent}
                                                disabled={isCreating || isLoading || isFetchingAgent}
                                            >
                                                {isCreating ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        {isEditMode ? (
                                                            <>
                                                                <Pencil className="w-5 h-5 mr-2" />
                                                                Update Agent
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="w-5 h-5 mr-2" />
                                                                Add Agent
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </Button>

                                            {isEditMode && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-11"
                                                    onClick={handleCancelEdit}
                                                    disabled={isCreating}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Section - Only show in create mode */}
                    {!isEditMode && (
                        <div className="lg:col-span-2">
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
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
                                            <p className="text-slate-400 text-sm mt-2">Fill out the form to create your first agent.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

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

                {/* Voice Selection Dialog */}
                <Dialog open={isVoiceDialogOpen} onOpenChange={setIsVoiceDialogOpen}>
                    <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Select Voice</DialogTitle>
                            <DialogDescription>
                                Choose a voice for your agent. Click the play button to hear a demo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="overflow-y-auto flex-1 pr-2">
                            <div className="grid gap-3 py-4">
                                {voices.map((voice) => (
                                    <div
                                        key={voice.voice_id}
                                        className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:border-primary ${
                                            selectedVoiceId === voice.voice_id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-slate-200'
                                        }`}
                                        onClick={() => handleSelectVoice(voice.voice_id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-semibold text-lg">{voice.voice_name}</h4>
                                                {selectedVoiceId === voice.voice_id && (
                                                    <CheckCircle className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Accent:</span> {voice.accent}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Age:</span> {voice.age}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Gender:</span> {voice.gender}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="ml-4"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayAudio(voice.voice_id, voice.preview_audio_url);
                                            }}
                                        >
                                            {playingVoiceId === voice.voice_id ? (
                                                <Pause className="w-5 h-5" />
                                            ) : (
                                                <Play className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default VoiceManagementApp;
