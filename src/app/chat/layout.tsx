
"use client";
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Users, Shuffle, Search, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';
import { APP_NAME } from '@/lib/constants';

const navItems = [
  { href: '/chat/random', label: 'Random Chat', icon: Shuffle },
  { href: '/chat/global', label: 'Global Messages', icon: Users },
  { href: '/chat/find', label: 'Find Friends', icon: Search },
];

export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { userProfile, logout, isLoggedIn } = useAuth();
  const router = useRouter();

  if (!isLoggedIn) {
     // While the session is loading, we can show a minimal loading state 
     // or nothing to avoid layout shifts and messages. Returning null is clean.
     return null;
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" side="left" className="border-r">
        <SidebarHeader className="p-4 items-center">
          <div className="flex items-center justify-between w-full">
            <AppLogo showText={false} />
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {APP_NAME}
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent asChild>
          <ScrollArea className="flex-1">
            <SidebarMenu className="p-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    tooltip={{ children: item.label }}
                    className="justify-start"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="p-2">
          {userProfile && (
            <div className="p-2 rounded-md bg-sidebar-accent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <UserAvatar user={userProfile} className="h-8 w-8"/>
                <div className="group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium text-sidebar-accent-foreground">{userProfile.name}</p>
                  <Badge variant="outline" className="text-xs truncate max-w-[120px]">{userProfile.id}</Badge>
                </div>
              </div>
            </div>
          )}
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={logout} 
                  tooltip={{ children: "Logout" }}
                  className="justify-start w-full"
                >
                  <LogOut className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {navItems.find(item => pathname.startsWith(item.href))?.label || APP_NAME}
            </h2>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
