import React from "react";
import { useListResources, useGetResourceSummary, Resource } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Cpu, DollarSign, Server, Wrench, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Resources() {
  const { data: resources, isLoading: resourcesLoading } = useListResources();
  const { data: summary, isLoading: summaryLoading } = useGetResourceSummary();

  if (resourcesLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dev_hours': return <Cpu className="w-4 h-4 text-primary" />;
      case 'hosting': return <Server className="w-4 h-4 text-blue-400" />;
      case 'tools': return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'licenses': return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default: return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground mt-1">Track and manage resource consumption.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Log Resource
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalCost.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dev Hours</CardTitle>
              <Cpu className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDevHours}h</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hosting</CardTitle>
              <Server className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalHostingCost.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tools</CardTitle>
              <Wrench className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalToolsCost.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-card/50 border-white/10">
        <CardHeader>
          <CardTitle>Resource Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources?.map((resource: Resource) => (
              <div key={resource.id} className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/5 rounded-md">
                    {getTypeIcon(resource.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{resource.projectName || 'General'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{resource.type.replace('_', ' ')} • {new Date(resource.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">${resource.totalCost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{resource.quantity} {resource.unit} @ ${resource.costPerUnit}/{resource.unit}</p>
                </div>
              </div>
            ))}
            {resources?.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No resources logged yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
