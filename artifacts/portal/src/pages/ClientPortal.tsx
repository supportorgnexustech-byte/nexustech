import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetClient, useListProjects, useListInvoices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Briefcase, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ClientPortal() {
  const { currentUser } = useAuth();
  const clientId = currentUser?.clientId;

  const { data: client, isLoading: clientLoading } = useGetClient(clientId!, {
    query: { enabled: !!clientId, queryKey: ["client", clientId] }
  });

  const { data: projects, isLoading: projectsLoading } = useListProjects({ query: { enabled: !!clientId } });
  const { data: invoices, isLoading: invoicesLoading } = useListInvoices({ query: { enabled: !!clientId } });

  if (clientLoading || projectsLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const clientProjects = projects?.filter(p => p.clientId === clientId) || [];
  const clientInvoices = invoices?.filter(i => i.clientId === clientId) || [];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {client?.companyName}</h1>
          <p className="text-muted-foreground mt-1">Your client portal overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Projects</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientProjects.map(project => (
                <div key={project.id} className="flex justify-between items-center pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <div>
                    <h4 className="font-medium text-foreground">{project.name}</h4>
                    <p className="text-xs text-muted-foreground">Progress: {project.progress || 0}%</p>
                  </div>
                  <Badge variant="outline" className="bg-white/5 capitalize">{project.status.replace('_', ' ')}</Badge>
                </div>
              ))}
              {clientProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No active projects.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientInvoices.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <div>
                    <h4 className="font-medium text-foreground">{invoice.invoiceNumber}</h4>
                    <p className="text-xs text-muted-foreground">${invoice.total.toLocaleString()} • Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                    {invoice.status}
                  </Badge>
                </div>
              ))}
              {clientInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent invoices.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
