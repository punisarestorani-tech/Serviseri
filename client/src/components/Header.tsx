import { Button } from "@/components/ui/button";
import { LogOut, Users, Building2, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface Organization {
  id: string;
  name: string;
}

export default function Header() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const t = useTranslation();

  // Fetch organizations for super_admin
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: user?.userRole === 'super_admin',
  });

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
      // Invalidate all queries to refetch with new org context
      queryClient.invalidateQueries();
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    } catch (error) {
      console.error('Switch organization error:', error);
    }
  };

  const isSuperAdmin = user?.userRole === 'super_admin';
  const isOrgAdmin = user?.userRole === 'org_admin';
  const canManageUsers = isSuperAdmin || isOrgAdmin;

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">{t.auth.appTitle}</h1>

        {/* Organization Display/Switcher */}
        {user?.organizationName && (
          isSuperAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.organizationName}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSwitchOrganization(org.id)}
                    className={org.id === user.organizationId ? 'bg-accent' : ''}
                  >
                    {org.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/admin/organizations')}>
                  Manage Organizations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Badge variant="secondary" className="gap-2">
              <Building2 className="h-3 w-3" />
              <span className="hidden sm:inline">{user.organizationName}</span>
            </Badge>
          )
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Admin Links */}
        {isSuperAdmin && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
          >
            <Link href="/admin/organizations">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organizacije</span>
            </Link>
          </Button>
        )}

        {canManageUsers && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
          >
            <Link href="/users">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Korisnici</span>
            </Link>
          </Button>
        )}

        {/* User info */}
        <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-username">
          {user?.fullName || user?.username || 'User'}
          {user?.userRole && (
            <span className="ml-1 text-xs opacity-70">
              ({user.userRole === 'super_admin' ? 'Super Admin' :
                user.userRole === 'org_admin' ? 'Admin' : 'Tehničar'})
            </span>
          )}
        </span>

        <LanguageSelector />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          data-testid="button-logout"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t.auth.logout}</span>
        </Button>
      </div>
    </header>
  );
}
