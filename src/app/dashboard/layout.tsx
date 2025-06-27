// ULTRA-NUCLEAR: Remove AgentMemoryProvider to eliminate all service dependencies
// import { AgentMemoryProvider } from "@/components/agents/AgentMemoryProvider";

// Force dynamic rendering for all dashboard routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ULTRA-NUCLEAR: Direct layout without any providers
    <div className="min-h-screen">
      {children}
    </div>
  );
} 