#!/bin/bash

# Recommendations Page
cat > client/src/pages/Recommendations.tsx << 'EOFPAGE'
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Calendar, Mail, Phone, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Recommendations() {
  const [serviceKeyword, setServiceKeyword] = useState("");
  const [limit, setLimit] = useState(20);

  const recommendationsQuery = trpc.recommendations.get.useQuery({
    serviceKeyword: serviceKeyword || undefined,
    limit,
  });

  const recommendations = recommendationsQuery.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Outreach Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Smart recommendations based on service history and interaction patterns
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Customize your recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceKeyword">Service Keyword (optional)</Label>
                <Input
                  id="serviceKeyword"
                  placeholder="e.g., lawn care, plumbing..."
                  value={serviceKeyword}
                  onChange={(e) => setServiceKeyword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Max Results</Label>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  max="100"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {recommendationsQuery.isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded w-1/3"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No recommendations available. Try adjusting your filters or add more customer data.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{rec.customer.name}</CardTitle>
                        <Badge variant="default">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Score: {rec.score}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        {rec.customer.notes}
                      </CardDescription>
                    </div>
                    <Link href={`/customers/${rec.customer.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      <h4 className="font-medium">Contact Information</h4>
                      {rec.customer.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{rec.customer.email}</span>
                        </div>
                      )}
                      {rec.customer.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{rec.customer.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <h4 className="font-medium">Activity</h4>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Last interaction: {rec.lastInteractionDate 
                            ? formatDistanceToNow(new Date(rec.lastInteractionDate), { addSuffix: true })
                            : "Never"}
                        </span>
                      </div>
                      {rec.lastOutreach && (
                        <div className="text-muted-foreground">
                          Last outreach: {formatDistanceToNow(new Date(rec.lastOutreach.contactedDate), { addSuffix: true })}
                          {rec.lastOutreach.responseReceived ? " (responded)" : " (no response)"}
                        </div>
                      )}
                    </div>
                  </div>

                  {rec.services.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2">Relevant Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.services.map((service) => (
                          <Badge key={service.id} variant="secondary">
                            {service.serviceName} - {new Date(service.serviceDate).toLocaleDateString()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
EOFPAGE

# Data Import Page
cat > client/src/pages/DataImport.tsx << 'EOFPAGE'
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Upload, Database, Mail, Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DataImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const dataSourcesQuery = trpc.dataSources.list.useQuery();
  const googleCredsQuery = trpc.google.getCredentials.useQuery();
  const utils = trpc.useUtils();

  const handleIPhoneUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setIsUploading(true);
    try {
      const response = await fetch('/api/iphone/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(\`iPhone data imported: \${result.matched} matched, \${result.unmatched} unmatched\`);
        utils.dataSources.list.invalidate();
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const response = await fetch('/api/google/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast.error('Failed to initiate Google connection');
    }
  };

  const handleGoogleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookbackDays: 365 }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(\`Google data synced: \${result.totalEmails} emails, \${result.totalEvents} events\`);
        utils.dataSources.list.invalidate();
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (error) {
      toast.error('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const dataSources = dataSourcesQuery.data || [];
  const isGoogleConnected = googleCredsQuery.data?.connected;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Import</h1>
          <p className="text-muted-foreground mt-1">
            Import customer data from various sources
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>iPhone Backup</CardTitle>
              </div>
              <CardDescription>
                Upload SMS and call history from iPhone backup databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIPhoneUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smsDb">SMS Database (sms.db) *</Label>
                  <Input
                    id="smsDb"
                    name="smsDb"
                    type="file"
                    accept=".db"
                    required
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Located in iPhone backup folder
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callHistoryDb">Call History Database (optional)</Label>
                  <Input
                    id="callHistoryDb"
                    name="callHistoryDb"
                    type="file"
                    accept=".db,.storedata"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    CallHistory.storedata from iPhone backup
                  </p>
                </div>
                <Button type="submit" disabled={isUploading} className="w-full">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload iPhone Data
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Google Services</CardTitle>
              </div>
              <CardDescription>
                Import emails from Gmail and events from Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isGoogleConnected ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Google account connected</span>
                  </div>
                  <Button onClick={handleGoogleSync} disabled={isSyncing} className="w-full">
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Sync Google Data
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Connect your Google account to import Gmail and Calendar data
                  </p>
                  <Button onClick={handleGoogleConnect} className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Connect Google Account
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
            <CardDescription>Recent data import operations</CardDescription>
          </CardHeader>
          <CardContent>
            {dataSourcesQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : dataSources.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No import history yet
              </p>
            ) : (
              <div className="space-y-2">
                {dataSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {source.sourceType === 'iphone_backup' && <Database className="h-4 w-4" />}
                      {source.sourceType === 'gmail' && <Mail className="h-4 w-4" />}
                      {source.sourceType === 'google_calendar' && <Calendar className="h-4 w-4" />}
                      <div>
                        <p className="font-medium capitalize">
                          {source.sourceType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {source.lastSyncDate 
                            ? new Date(source.lastSyncDate).toLocaleString()
                            : 'Never synced'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        source.status === 'completed' ? 'default' :
                        source.status === 'failed' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {source.status === 'completed' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {source.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                      {source.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
EOFPAGE

# Services Page
cat > client/src/pages/Services.tsx << 'EOFPAGE'
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Calendar, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Services() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const servicesQuery = trpc.services.list.useQuery();
  const customersQuery = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();

  const createService = trpc.services.create.useMutation({
    onSuccess: () => {
      utils.services.list.invalidate();
      setIsAddDialogOpen(false);
      setSelectedCustomerId(null);
      toast.success("Service added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add service: " + error.message);
    },
  });

  const services = servicesQuery.data || [];
  const customers = customersQuery.data || [];

  // Group services by customer
  const servicesByCustomer = services.reduce((acc, service) => {
    if (!acc[service.customerId]) {
      acc[service.customerId] = [];
    }
    acc[service.customerId].push(service);
    return acc;
  }, {} as Record<number, typeof services>);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createService.mutate({
      customerId: parseInt(formData.get("customerId") as string),
      serviceName: formData.get("serviceName") as string,
      serviceDate: new Date(formData.get("serviceDate") as string),
      notes: formData.get("notes") as string || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Services</h1>
            <p className="text-muted-foreground mt-1">
              Track services provided to customers
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                  <DialogDescription>
                    Record a service provided to a customer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer *</Label>
                    <select
                      id="customerId"
                      name="customerId"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceName">Service Name *</Label>
                    <Input id="serviceName" name="serviceName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceDate">Service Date *</Label>
                    <Input id="serviceDate" name="serviceDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createService.isPending}>
                    {createService.isPending ? "Adding..." : "Add Service"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {servicesQuery.isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded w-1/3"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No services recorded yet. Add your first service to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(servicesByCustomer).map(([customerIdStr, customerServices]) => {
              const customerId = parseInt(customerIdStr);
              const customer = customers.find(c => c.id === customerId);
              
              if (!customer) return null;

              return (
                <Card key={customerId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {customer.name}
                        </CardTitle>
                        <CardDescription>
                          {customerServices.length} service{customerServices.length !== 1 ? 's' : ''} recorded
                        </CardDescription>
                      </div>
                      <Link href={\`/customers/\${customerId}\`}>
                        <Button variant="outline" size="sm">
                          View Customer
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customerServices
                        .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
                        .map((service) => (
                          <div
                            key={service.id}
                            className="flex items-start justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{service.serviceName}</p>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(service.serviceDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              {service.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {service.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
EOFPAGE

echo "All pages created successfully!"
