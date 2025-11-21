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
