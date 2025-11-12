import MangeVoice from "@/components/voice/voice-manage";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

interface PageProps {
    searchParams: Promise<{
        agent_id?: string;
        agent_name?: string;
        voice_id?: string;
        phone_number?: string;
        mode?: 'edit' | 'create';
    }>;
}

export default async function Page({ searchParams }: PageProps) {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
        redirect('/');
    }

    const params = await searchParams;
    // Pass the edit data to MangeVoice component if in edit mode
    const editData = params.mode === 'edit' ? {
        agent_id: params.agent_id || '',
        agent_name: params.agent_name || '',
        voice_id: params.voice_id || '',
        phone_number: params.phone_number || '',
    } : null;

    return <MangeVoice editData={editData} />;
}
