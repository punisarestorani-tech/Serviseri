import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LanguageSelector } from "./LanguageSelector";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation } from "wouter";
import { useTranslation } from "@/i18n";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AppLayout({ children, title, breadcrumbs }: AppLayoutProps) {
  const [location] = useLocation();
  const t = useTranslation();

  // Generate default breadcrumb based on current path if not provided
  const getDefaultTitle = () => {
    if (title) return title;

    const pathMap: Record<string, string> = {
      '/dashboard': t.nav.dashboard,
      '/tasks': t.nav.tasks,
      '/clients': t.nav.clients,
      '/storage': t.storage.title,
      '/users': 'Korisnici',
      '/admin/organizations': 'Organizacije',
    };

    // Check for exact match first
    if (pathMap[location]) return pathMap[location];

    // Check for partial matches
    for (const [path, name] of Object.entries(pathMap)) {
      if (location.startsWith(path)) return name;
    }

    return '';
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground transition-colors" />
          <Separator orientation="vertical" className="h-4" />

          {/* Breadcrumb */}
          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              {breadcrumbs ? (
                breadcrumbs.map((crumb, index) => (
                  <BreadcrumbItem key={index}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbPage className={index === breadcrumbs.length - 1 ? "font-medium" : ""}>
                      {crumb.label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                ))
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-foreground">
                    {getDefaultTitle()}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Right side - Language selector */}
          <LanguageSelector />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
