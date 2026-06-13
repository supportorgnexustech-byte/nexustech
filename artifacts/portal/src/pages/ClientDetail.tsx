import React from "react";
import { useParams } from "wouter";
import { useGetClient, useListProjects, useListInvoices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Mail, Phone, MapPin, Briefcase, FileText, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id, 10);

  const { data: client, isLoading: clientLoading } = useGetClient(clientId, {
    query: { enabled: !!clientId, queryKey: ["client", clientId] }
  });

  const { data: projects, isLoading: projectsLoading } = useListProjects();
  const { data: invoices, isLoading: invoicesLoading } = useListInvoices();

  if (clientLoading || projectsLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return <div>Client not found.</div>;
  }

  const clientProjects = projects?.filter(p => p.clientId === clientId) || [];
  const clientInvoices = invoices?.filter(i => i.clientId === clientId) || [];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{client.companyName}</h1>
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>{client.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{client.businessType}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-white/10 lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              {client.contactName}
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" />
              {client.contactEmail}
            </div>
            {client.contactPhone && (
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {client.contactPhone}
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3 text-sm text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {client.address}
              </div>
            )}
            {client.gstin && (
              <div className="flex items-center gap-3 text-sm text-foreground">
                <span className="w-4 h-4 text-xs font-bold text-muted-foreground">GST</span>
                {client.gstin}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientProjects.map(project => (
                  <div key={project.id} className="flex justify-between items-center pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-medium text-foreground">{project.name}</h4>
                      <p className="text-xs text-muted-foreground">{new Date(project.startDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="bg-white/5">{project.status}</Badge>
                  </div>
                ))}
                {clientProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground">No projects found for this client.</p>
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
                      <p className="text-xs text-muted-foreground">${invoice.total.toLocaleString()}</p>
                    </div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                      {invoice.status}
                    </Badge>
                  </div>
                ))}
                {clientInvoices.length === 0 && (
                  <p className="text-sm text-muted-foreground">No invoices found for this client.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
