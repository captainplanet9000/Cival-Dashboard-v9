// ULTRA-NUCLEAR: Remove AgentMemoryProvider to eliminate all service dependencies
// import { AgentMemoryProvider } from "@/components/agents/AgentMemoryProvider";
import { NotificationProvider } from "@/components/premium-ui/notifications/notification-system";

// Force dynamic rendering for all dashboard routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Add NotificationProvider to enable notifications throughout the dashboard
    <NotificationProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </NotificationProvider>
  );
} 