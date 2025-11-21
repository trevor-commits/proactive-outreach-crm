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
                      <Link href={`/customers/${customerId}`}>
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
