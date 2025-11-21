import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Edit, Trash2, Plus, Phone, Mail, MessageSquare, Calendar, FileText } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const customerId = parseInt(params.id || "0");
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isOutreachDialogOpen, setIsOutreachDialogOpen] = useState(false);

  const customerQuery = trpc.customers.getById.useQuery({ id: customerId });
  const interactionsQuery = trpc.interactions.getByCustomerId.useQuery({ customerId });
  const servicesQuery = trpc.services.getByCustomerId.useQuery({ customerId });
  const outreachQuery = trpc.outreach.getByCustomerId.useQuery({ customerId });
  
  const utils = trpc.useUtils();

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.getById.invalidate({ id: customerId });
      utils.customers.list.invalidate();
      setIsEditDialogOpen(false);
      toast.success("Customer updated successfully");
    },
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted");
      navigate("/customers");
    },
  });

  const createService = trpc.services.create.useMutation({
    onSuccess: () => {
      utils.services.getByCustomerId.invalidate({ customerId });
      setIsServiceDialogOpen(false);
      toast.success("Service added");
    },
  });

  const createOutreach = trpc.outreach.create.useMutation({
    onSuccess: () => {
      utils.outreach.getByCustomerId.invalidate({ customerId });
      setIsOutreachDialogOpen(false);
      toast.success("Outreach logged");
    },
  });

  if (customerQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded w-1/3"></div>
          <div className="h-64 bg-muted animate-pulse rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customerQuery.data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Customer not found</p>
          <Button onClick={() => navigate("/customers")} className="mt-4">
            Back to Customers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const customer = customerQuery.data;
  const interactions = interactionsQuery.data || [];
  const services = servicesQuery.data || [];
  const outreachLogs = outreachQuery.data || [];

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="h-4 w-4" />;
      case "sms": return <MessageSquare className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "calendar_event": return <Calendar className="h-4 w-4" />;
      case "manual_note": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{customer.name}</h1>
              <p className="text-muted-foreground mt-1">Customer Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updateCustomer.mutate({
                    id: customerId,
                    name: formData.get("name") as string,
                    email: formData.get("email") as string || undefined,
                    phone: formData.get("phone") as string || undefined,
                    address: formData.get("address") as string || undefined,
                    notes: formData.get("notes") as string || undefined,
                  });
                }}>
                  <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" defaultValue={customer.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" defaultValue={customer.email || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" defaultValue={customer.phone || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" defaultValue={customer.address || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" name="notes" rows={3} defaultValue={customer.notes || ""} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={updateCustomer.isPending}>
                      {updateCustomer.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" onClick={() => {
              if (confirm("Are you sure you want to delete this customer?")) {
                deleteCustomer.mutate({ id: customerId });
              }
            }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.notes && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <p>{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Interactions</span>
                <span className="font-medium">{interactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Services</span>
                <span className="font-medium">{services.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outreach Attempts</span>
                <span className="font-medium">{outreachLogs.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createService.mutate({
                      customerId,
                      serviceName: formData.get("serviceName") as string,
                      serviceDate: new Date(formData.get("serviceDate") as string),
                      notes: formData.get("notes") as string || undefined,
                    });
                  }}>
                    <DialogHeader>
                      <DialogTitle>Add Service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="serviceName">Service Name</Label>
                        <Input id="serviceName" name="serviceName" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceDate">Date</Label>
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

              <Dialog open={isOutreachDialogOpen} onOpenChange={setIsOutreachDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Log Outreach
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createOutreach.mutate({
                      customerId,
                      contactedDate: new Date(formData.get("contactedDate") as string),
                      responseReceived: formData.get("responseReceived") === "true",
                      responseType: formData.get("responseType") as any || undefined,
                      notes: formData.get("notes") as string || undefined,
                    });
                  }}>
                    <DialogHeader>
                      <DialogTitle>Log Outreach</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactedDate">Contact Date</Label>
                        <Input id="contactedDate" name="contactedDate" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responseReceived">Response Received?</Label>
                        <select id="responseReceived" name="responseReceived" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responseType">Response Type</Label>
                        <select id="responseType" name="responseType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">None</option>
                          <option value="positive">Positive</option>
                          <option value="negative">Negative</option>
                          <option value="neutral">Neutral</option>
                          <option value="no_response">No Response</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" rows={3} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createOutreach.isPending}>
                        {createOutreach.isPending ? "Logging..." : "Log Outreach"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="interactions" className="w-full">
          <TabsList>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="outreach">Outreach History</TabsTrigger>
          </TabsList>

          <TabsContent value="interactions" className="space-y-4">
            {interactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No interactions recorded yet
                </CardContent>
              </Card>
            ) : (
              interactions.map((interaction) => (
                <Card key={interaction.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getInteractionIcon(interaction.type)}
                        <div>
                          <CardTitle className="text-base capitalize">{interaction.type.replace('_', ' ')}</CardTitle>
                          <CardDescription>
                            {formatDistanceToNow(new Date(interaction.date), { addSuffix: true })} • {interaction.source}
                          </CardDescription>
                        </div>
                      </div>
                      {interaction.direction && (
                        <Badge variant={interaction.direction === 'incoming' ? 'secondary' : 'default'}>
                          {interaction.direction}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {(interaction.subject || interaction.content) && (
                    <CardContent>
                      {interaction.subject && <p className="font-medium mb-1">{interaction.subject}</p>}
                      {interaction.content && <p className="text-sm text-muted-foreground">{interaction.content}</p>}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No services recorded yet
                </CardContent>
              </Card>
            ) : (
              services.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{service.serviceName}</CardTitle>
                    <CardDescription>
                      {new Date(service.serviceDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  {service.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{service.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="outreach" className="space-y-4">
            {outreachLogs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No outreach attempts logged yet
                </CardContent>
              </Card>
            ) : (
              outreachLogs.map((log) => (
                <Card key={log.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          Contacted on {new Date(log.contactedDate).toLocaleDateString()}
                        </CardTitle>
                        <CardDescription>
                          {log.responseReceived ? "Response received" : "No response yet"}
                        </CardDescription>
                      </div>
                      {log.responseType && (
                        <Badge variant={log.responseType === 'positive' ? 'default' : 'secondary'}>
                          {log.responseType}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {log.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{log.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
