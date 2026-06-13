import React from "react";
import { useListInvoices, Invoice } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString()}`;

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export default function Invoices() {
  const { data: invoices, isLoading } = useListInvoices();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const paid = invoices?.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0) ?? 0;
  const pending = invoices?.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0) ?? 0;
  const overdue = invoices?.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0) ?? 0;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage billing and payments.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Paid", value: fmt(paid), color: "text-emerald-400" },
          { label: "Pending", value: fmt(pending), color: "text-amber-400" },
          { label: "Overdue", value: fmt(overdue), color: "text-destructive" },
        ].map(k => (
          <Card key={k.label} className="bg-card/50 border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <span className={`text-lg font-bold ${k.color}`}>{k.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {invoices?.map((invoice: Invoice) => (
          <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
            <Card className="bg-card/50 border-white/10 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      {invoice.clientName} {invoice.projectName ? `• ${invoice.projectName}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-foreground text-lg">{fmt(invoice.total)}</p>
                    <p className="text-xs text-muted-foreground">GST incl.</p>
                  </div>
                  <Badge variant="outline" className={`capitalize min-w-[70px] justify-center ${STATUS_STYLES[invoice.status] ?? ""}`}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!invoices?.length && (
          <div className="py-12 text-center text-muted-foreground bg-card/20 rounded-lg border border-white/5 border-dashed">
            No invoices found.
          </div>
        )}
      </div>
    </div>
  );
}
