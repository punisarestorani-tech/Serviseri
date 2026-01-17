import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  Building2,
  UserCircle,
  LogOut,
  ChevronDown,
  Wrench,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface Organization {
  id: string;
  name: string;
}

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const t = useTranslation();

  // Fetch organizations for super_admin
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: user?.userRole === 'super_admin',
  });

  const mainNavItems = [
    { title: t.nav.dashboard, icon: LayoutDashboard, path: "/dashboard" },
    { title: t.nav.tasks, icon: ClipboardList, path: "/tasks" },
    { title: t.nav.clients, icon: Users, path: "/clients" },
    { title: t.storage.title, icon: Package, path: "/storage" },
  ];

  const adminNavItems = [
    { title: "Korisnici", icon: UserCircle, path: "/users", roles: ['super_admin', 'org_admin'] },
    { title: "Organizacije", icon: Building2, path: "/admin/organizations", roles: ['super_admin'] },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") return location === "/dashboard";
    return location.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      queryClient.clear();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      await apiRequest('POST', `/api/organizations/${orgId}/switch`);
      queryClient.invalidateQueries();
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    } catch (error) {
      console.error('Switch organization error:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleLabel = () => {
    switch (user?.userRole) {
      case 'super_admin': return 'Super Admin';
      case 'org_admin': return 'Admin';
      default: return 'Tehničar';
    }
  };

  const isSuperAdmin = user?.userRole === 'super_admin';

  return (
    <Sidebar className="border-r-0">
      {/* Logo/Brand Header with Gradient */}
      <SidebarHeader className="bg-gradient-primary p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-lg tracking-tight">
              {t.auth.appTitle}
            </span>
            {user?.organizationName && (
              <span className="text-white/80 text-xs font-medium">
                {user.organizationName}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        {/* Organization Switcher for Super Admin */}
        {isSuperAdmin && organizations.length > 0 && (
          <SidebarGroup className="py-2">
            <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-[10px] tracking-widest font-semibold px-4">
              Organizacija
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-sm">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-left truncate font-medium">
                      {user?.organizationName || 'Select Organization'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => handleSwitchOrganization(org.id)}
                      className={org.id === user?.organizationId ? 'bg-accent' : ''}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {org.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Main Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-[10px] tracking-widest font-semibold px-4">
            Glavni meni
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.title}
                    className="transition-all duration-200 group"
                  >
                    <Link href={item.path}>
                      <item.icon className={`h-5 w-5 transition-colors ${isActive(item.path) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {(user?.userRole === 'super_admin' || user?.userRole === 'org_admin') && (
          <>
            <SidebarSeparator className="mx-4" />
            <SidebarGroup className="py-2">
              <SidebarGroupLabel className="text-muted-foreground/70 uppercase text-[10px] tracking-widest font-semibold px-4">
                Administracija
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
                  {adminNavItems
                    .filter(item => item.roles.includes(user?.userRole || ''))
                    .map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.path)}
                          tooltip={item.title}
                          className="transition-all duration-200 group"
                        >
                          <Link href={item.path}>
                            <item.icon className={`h-5 w-5 transition-colors ${isActive(item.path) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* User Profile Footer */}
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-3 py-2">
              <Avatar className="h-9 w-9 rounded-lg bg-gradient-primary shadow-md">
                <AvatarFallback className="bg-transparent text-white font-semibold text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user?.fullName || user?.username}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">{t.auth.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
