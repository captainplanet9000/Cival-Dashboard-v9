'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {  BarChart3,  TrendingUp,  ShoppingCart,  Shield,  Vault,  Zap,  PieChart,  Home,  Settings,  User,  Bot,  Brain,  Target,  Calendar,} from "lucide-react";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard/overview",
    icon: Home,
  },
  {
    name: "Agents",
    href: "/dashboard/agents",
    icon: Bot,
  },
  {
    name: "Farms",
    href: "/dashboard/farms",
    icon: () => (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="h-4 w-4"
      >
        <path d="M3 12h18m-9-9v18"/>
        <path d="M8 8l8 8M16 8l-8 8"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    name: "Goals",
    href: "/dashboard/goals",
    icon: Target,
  },
  {
    name: "DeFi Lending",
    href: "/dashboard/defi-lending",
    icon: () => (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="h-4 w-4"
      >
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
  },
  {
    name: "Python Analysis",
    href: "/dashboard/python-analysis",
    icon: () => (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="h-4 w-4"
      >
        <path d="M9 3v18l3-3 3 3V3"/>
        <path d="M12 9l-4 4 4 4"/>
      </svg>
    ),
  },
  {
    name: "Eliza AI",
    href: "/dashboard/eliza",
    icon: Brain,
  },
  {
    name: "Trading",
    href: "/dashboard/trading",
    icon: ShoppingCart,
  },
  {
    name: "Leverage Engine",
    href: "/leverage",
    icon: Zap,
  },
  {
    name: "Portfolio",
    href: "/portfolio",
    icon: PieChart,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Risk Management",
    href: "/risk",
    icon: Shield,
  },
  {
    name: "Wallet",
    href: "/dashboard/vault",
    icon: Vault,
  },
];

const secondaryNavigation = [
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold text-gradient">
            Cival Dashboard
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {/* Primary Navigation */}
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "nav-link",
                        isActive ? "nav-link-active" : "nav-link-inactive"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Market Status */}
          <li className="mt-6">
            <div className="px-3 py-2">
              <div className="flex items-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Market Status
              </div>
              <div className="mt-2 flex items-center">
                <div className="status-indicator status-online"></div>
                <span className="text-sm text-status-online">Open</span>
              </div>
            </div>
          </li>

          {/* Portfolio Summary */}
          <li className="mt-4">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-sm font-medium text-foreground">
                Total Portfolio
              </div>
              <div className="mt-1 text-2xl font-bold text-trading-profit">
                $125,847.32
              </div>
              <div className="text-xs text-trading-profit">
                +2.34% (+$2,847.32)
              </div>
            </div>
          </li>

          {/* Spacer */}
          <li className="mt-auto">
            <ul role="list" className="-mx-2 space-y-1">
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "nav-link",
                        isActive ? "nav-link-active" : "nav-link-inactive"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
} 