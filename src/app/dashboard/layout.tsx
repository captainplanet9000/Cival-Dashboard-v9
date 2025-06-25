import { AgentMemoryProvider } from "@/components/agents/AgentMemoryProvider";

// Force dynamic rendering for all dashboard routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AgentMemoryProvider>
      {/* Simplified layout for ModernDashboardV4 - handles its own navigation */}
      <div className="min-h-screen">
        {children}
      </div>
    </AgentMemoryProvider>
  );
} 