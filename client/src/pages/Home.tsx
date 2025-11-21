import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, TrendingUp, Database, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Proactive Outreach Brain</CardTitle>
            <CardDescription className="text-base mt-2">
              Smart CRM that consolidates customer communication and recommends who to contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Import data from iPhone backups, Gmail, and Google Calendar</span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Track all customer interactions in one place</span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Get smart recommendations on who to contact next</span>
              </div>
            </div>
            <Button asChild className="w-full" size="lg">
              <a href={getLoginUrl()}>Sign In to Get Started</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'there'}!</h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your customer outreach system
          </p>
        </div>

        <DashboardStats />

        <div className="grid gap-6 md:grid-cols-2">
          <QuickActionCard
            title="View Recommendations"
            description="See which customers you should reach out to next"
            icon={<TrendingUp className="h-8 w-8" />}
            href="/recommendations"
          />
          <QuickActionCard
            title="Manage Customers"
            description="View and edit your customer database"
            icon={<Users className="h-8 w-8" />}
            href="/customers"
          />
          <QuickActionCard
            title="Import Data"
            description="Import data from iPhone, Gmail, or Calendar"
            icon={<Database className="h-8 w-8" />}
            href="/import"
          />
          <QuickActionCard
            title="Track Services"
            description="Manage services provided to customers"
            icon={<Calendar className="h-8 w-8" />}
            href="/services"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function DashboardStats() {
  const customersQuery = trpc.customers.list.useQuery();
  const servicesQuery = trpc.services.list.useQuery();
  const dataSourcesQuery = trpc.dataSources.list.useQuery();

  const stats = [
    {
      label: "Total Customers",
      value: customersQuery.data?.length || 0,
      loading: customersQuery.isLoading,
    },
    {
      label: "Services Tracked",
      value: servicesQuery.data?.length || 0,
      loading: servicesQuery.isLoading,
    },
    {
      label: "Data Sources",
      value: dataSourcesQuery.data?.filter(d => d.status === 'completed').length || 0,
      loading: dataSourcesQuery.isLoading,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardDescription>{stat.label}</CardDescription>
          </CardHeader>
          <CardContent>
            {stat.loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              <div className="text-3xl font-bold">{stat.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
            <div className="text-primary">{icon}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm font-medium text-primary">
            Get started
            <ArrowRight className="ml-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
