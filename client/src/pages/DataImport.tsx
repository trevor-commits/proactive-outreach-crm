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
        toast.success(`iPhone data imported: ${result.matched} matched, ${result.unmatched} unmatched`);
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
        toast.success(`Google data synced: ${result.totalEmails} emails, ${result.totalEvents} events`);
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
