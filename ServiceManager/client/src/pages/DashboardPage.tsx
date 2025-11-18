import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { ClipboardList, Users, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "@/i18n";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const t = useTranslation();

  const navigationCards = [
    {
      id: "tasks",
      title: t.nav.tasks,
      description: t.nav.tasksDescription,
      icon: ClipboardList,
      path: "/tasks",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "clients",
      title: t.nav.clients,
      description: t.nav.clientsDescription,
      icon: Users,
      path: "/clients",
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "storage",
      title: t.storage.title,
      description: t.nav.storageDescription,
      icon: Package,
      path: "/storage",
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold mb-8">{t.nav.dashboard}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.id}
                className="p-6 cursor-pointer hover-elevate active-elevate-2 overflow-visible h-48 flex flex-col items-center justify-center text-center"
                onClick={() => setLocation(card.path)}
                data-testid={`card-nav-${card.id}`}
              >
                <Icon className={`h-16 w-16 mb-4 ${card.color}`} />
                <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
