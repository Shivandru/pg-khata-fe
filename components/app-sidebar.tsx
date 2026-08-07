"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, DoorOpen, Users, CreditCard, Building2, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const userName = session?.user?.name ?? "User";

  const ownerItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Rooms & Beds", url: "/rooms", icon: DoorOpen },
    { title: "Guests", url: "/guest", icon: Users },
    { title: "Payments", url: "/payments", icon: CreditCard },
  ];

  const guestItems = [
    { title: "Tenancy Details", url: "/tenancy", icon: DoorOpen },
    { title: "Payment History", url: "/payment-history", icon: CreditCard },
    { title: "Profile Settings", url: "/profile", icon: User },
  ];

  const currentItems = role === "guest" ? guestItems : ownerItems;

  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">Nest PG</span>
            <span className="text-[11px] text-muted-foreground capitalize">
              {role ?? "Loading..."} - {userName}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
