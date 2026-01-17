import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { ClipboardList, Users, Package, ArrowRight } from "lucide-react";
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
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50",
    },
    {
      id: "clients",
      title: t.nav.clients,
      description: t.nav.clientsDescription,
      icon: Users,
      path: "/clients",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50",
    },
    {
      id: "storage",
      title: t.storage.title,
      description: t.nav.storageDescription,
      icon: Package,
      path: "/storage",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50",
    },
  ];

  return (
    <AppLayout title={t.nav.dashboard}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">{t.nav.dashboard}</h2>
        <p className="text-muted-foreground mb-8">Dobrodošli nazad. Odaberite sekciju za nastavak.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.id}
                className={`p-6 cursor-pointer overflow-hidden h-52 flex flex-col relative group transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 bg-gradient-to-br ${card.bgGradient}`}
                onClick={() => setLocation(card.path)}
                data-testid={`card-nav-${card.id}`}
              >
                {/* Icon with gradient background */}
                <div className={`p-4 rounded-xl bg-gradient-to-br ${card.gradient} w-fit mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{card.description}</p>

                {/* Arrow indicator */}
                <div className="flex items-center gap-1 text-sm font-medium text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Otvori</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Decorative gradient blob */}
                <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
