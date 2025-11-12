import DashBoardPage from "@/components/dashboard/DashboardPage";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Page() {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
        redirect('/');
    }

    return <DashBoardPage />;
}