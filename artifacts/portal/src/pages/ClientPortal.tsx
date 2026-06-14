import React from "react";
// Auth removed
import { useGetClient, useListProjects, useListInvoices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Briefcase, FileText, IndianRupee, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString()}`;

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function ClientPortal() {
  const currentUser = { name: "Admin", clientId: "1" };
  const clientId = currentUser.clientId;

  const { data: client, isLoading: clientLoading } = useGetClient(clientId!, {
    query: { enabled: !!clientId, queryKey: ["client", clientId] },
  });
  const { data: allProjects, isLoading: projectsLoading } = useListProjects(undefined, {
    query: { enabled: !!clientId, queryKey: ["projects", clientId] },
  });
  const { data: allInvoices, isLoading: invoicesLoading } = useListInvoices(undefined, {
    query: { enabled: !!clientId, queryKey: ["invoices", clientId] },
  });

  if (clientLoading || projectsLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No client account linked to your profile.
      </div>
    );
  }

  const clientProjects = allProjects?.filter(p => p.clientId === clientId) ?? [];
  const clientInvoices = allInvoices?.filter(i => i.clientId === clientId) ?? [];

  const totalBilled = clientInvoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = clientInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = clientInvoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {client?.companyName ?? currentUser?.name}
        </h1>
        <p className="text-muted-foreground mt-1">Your project and billing overview.</p>
      </div>

      {/* Finance summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: fmt(totalBilled), icon: IndianRupee, color: "text-foreground" },
          { label: "Paid", value: fmt(totalPaid), icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Outstanding", value: fmt(outstanding), icon: FileText, color: "text-amber-400" },
        ].map(k => (
          <Card key={k.label} className="bg-card/50 border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </div>
              <k.icon className="w-7 h-7 text-white/20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Projects</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientProjects.map(project => (
                <div key={project.id} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{project.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Started {new Date(project.startDate).toLocaleDateString()}
                        {project.endDate ? ` • Due ${new Date(project.endDate).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white/5 capitalize shrink-0">
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{project.progress ?? 0}%</span>
                    </div>
                    <Progress value={project.progress ?? 0} className="h-1.5" />
                  </div>
                </div>
              ))}
              {clientProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No active projects.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientInvoices.map(invoice => (
                <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                  <div className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-black/10 hover:bg-black/20 cursor-pointer transition-colors">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">{invoice.invoiceNumber}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmt(invoice.total)} • Due {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={`capitalize text-xs ${STATUS_BADGE[invoice.status] ?? ""}`}>
                      {invoice.status}
                    </Badge>
                  </div>
                </Link>
              ))}
              {clientInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
