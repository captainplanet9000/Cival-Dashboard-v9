import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AgentMemoryProvider } from "@/components/agents/AgentMemoryProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AgentMemoryProvider>
      <div className="dashboard-grid">
        <div className="sidebar-grid">
          <Sidebar />
        </div>
        <div className="main-content">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AgentMemoryProvider>
  );
} 