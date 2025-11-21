import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Phone, Filter, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function OutreachLog() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterResponseType, setFilterResponseType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "customer">("date");

  const outreachQuery = trpc.outreach.listAll.useQuery();
  const customersQuery = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();

  const createOutreach = trpc.outreach.create.useMutation({
    onSuccess: () => {
      utils.outreach.listAll.invalidate();
      setIsAddDialogOpen(false);
      toast.success("Outreach logged successfully");
    },
    onError: (error) => {
      toast.error("Failed to log outreach: " + error.message);
    },
  });

  const customers = customersQuery.data || [];
  const allOutreach = outreachQuery.data || [];

  // Create a map of customer IDs to customer objects for quick lookup
  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach(customer => {
      map.set(customer.id, customer);
    });
    return map;
  }, [customers]);

  // Filter and sort outreach logs
  const filteredOutreach = useMemo(() => {
    let filtered = allOutreach.filter(log => {
      const customer = customerMap.get(log.customerId);
      if (!customer) return false;

      // Filter by customer name
      if (filterCustomer && !customer.name.toLowerCase().includes(filterCustomer.toLowerCase())) {
        return false;
      }

      // Filter by response type
      if (filterResponseType !== "all") {
        if (filterResponseType === "no_response" && log.responseReceived) {
          return false;
        }
        if (filterResponseType !== "no_response" && log.responseType !== filterResponseType) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.contactedDate).getTime() - new Date(a.contactedDate).getTime();
      } else {
        const customerA = customerMap.get(a.customerId);
        const customerB = customerMap.get(b.customerId);
        return (customerA?.name || "").localeCompare(customerB?.name || "");
      }
    });

    return filtered;
  }, [allOutreach, customerMap, filterCustomer, filterResponseType, sortBy]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createOutreach.mutate({
      customerId: parseInt(formData.get("customerId") as string),
      contactedDate: new Date(formData.get("contactedDate") as string),
      responseReceived: formData.get("responseReceived") === "true",
      responseType: formData.get("responseType") as any || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const getResponseBadgeVariant = (responseType: string | null, responseReceived: boolean) => {
    if (!responseReceived) return "secondary";
    if (responseType === "positive") return "default";
    if (responseType === "negative") return "destructive";
    return "secondary";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Outreach Log</h1>
            <p className="text-muted-foreground mt-1">
              Track all your customer outreach activities
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Log Outreach
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Log New Outreach</DialogTitle>
                  <DialogDescription>
                    Record a customer contact attempt
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
                    <Label htmlFor="contactedDate">Contact Date *</Label>
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
                    <Textarea id="notes" name="notes" rows={3} placeholder="What was discussed, next steps, etc." />
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
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters & Sorting</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="filterCustomer">Customer Name</Label>
                <Input
                  id="filterCustomer"
                  placeholder="Search by name..."
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filterResponseType">Response Type</Label>
                <select
                  id="filterResponseType"
                  value={filterResponseType}
                  onChange={(e) => setFilterResponseType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                  <option value="no_response">No Response</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "customer")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="customer">Customer Name</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {outreachQuery.isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded w-1/3"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredOutreach.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {allOutreach.length === 0 
                  ? "No outreach logged yet. Click 'Log Outreach' to get started!"
                  : "No outreach matches your filters. Try adjusting your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredOutreach.length} of {allOutreach.length} outreach logs
            </div>
            {filteredOutreach.map((log) => {
              const customer = customerMap.get(log.customerId);
              if (!customer) return null;

              return (
                <Card key={log.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-lg">{customer.name}</CardTitle>
                          <Badge variant={getResponseBadgeVariant(log.responseType, log.responseReceived)}>
                            {log.responseReceived 
                              ? (log.responseType || "responded").replace("_", " ")
                              : "no response"}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          Contacted {formatDistanceToNow(new Date(log.contactedDate), { addSuffix: true })} 
                          {" • "}
                          {new Date(log.contactedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                      <Link href={`/customers/${customer.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Customer
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  {log.notes && (
                    <CardContent>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Notes:</p>
                        <p className="text-muted-foreground">{log.notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
