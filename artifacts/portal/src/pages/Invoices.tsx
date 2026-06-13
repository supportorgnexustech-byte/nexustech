import React from "react";
import { useListInvoices, Invoice } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Invoices() {
  const { data: invoices, isLoading } = useListInvoices();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    paid: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    overdue: "bg-destructive/20 text-destructive border-destructive/30",
    cancelled: "bg-muted text-muted-foreground line-through",
  };

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

      <div className="grid grid-cols-1 gap-4">
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
                    <p className="text-sm text-muted-foreground">{invoice.clientName} • Due {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-bold text-foreground">${invoice.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <Badge variant="outline" className={`capitalize ${statusColors[invoice.status]}`}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {invoices?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-lg border border-white/5 border-dashed">
            No invoices found.
          </div>
        )}
      </div>
    </div>
  );
}
