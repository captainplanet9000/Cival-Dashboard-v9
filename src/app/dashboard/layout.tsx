import { AgentMemoryProvider } from "@/components/agents/AgentMemoryProvider";

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