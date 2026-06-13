import React from "react";
import { useParams } from "wouter";
import { useGetInvoice, useUpdateInvoice } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const fmt = (n: number) => `₹${n.toLocaleString()}`;

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-emerald-500/20 text-emerald-400",
  overdue: "bg-destructive/20 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id, 10);
  const { toast } = useToast();

  const { data: invoice, isLoading, refetch } = useGetInvoice(invoiceId, {
    query: { enabled: !!invoiceId },
  });
  const updateInvoice = useUpdateInvoice();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) return <div className="text-muted-foreground p-8">Invoice not found.</div>;

  const handleSend = async () => {
    await updateInvoice.mutateAsync({ id: invoiceId, data: { status: "sent" } });
    toast({ title: "Invoice sent", description: `${invoice.invoiceNumber} marked as sent.` });
    refetch();
  };

  const handleMarkPaid = async () => {
    await updateInvoice.mutateAsync({ id: invoiceId, data: { status: "paid" } });
    toast({ title: "Invoice paid", description: `${invoice.invoiceNumber} marked as paid.` });
    refetch();
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground text-sm">{invoice.clientName}</p>
          </div>
          <div className="flex items-center gap-2">
            {invoice.status === "draft" && (
              <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={handleSend} disabled={updateInvoice.isPending}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            )}
            {(invoice.status === "sent" || invoice.status === "overdue") && (
              <Button onClick={handleMarkPaid} disabled={updateInvoice.isPending}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Paid
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="bg-card/50 border-white/10">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-10 pb-8 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-0.5">Nexus Tech Solutions</h2>
              <p className="text-sm text-muted-foreground">nexustech.in • info@nexustech.in</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-1">Invoice</div>
              <p className="text-lg font-bold text-foreground">{invoice.invoiceNumber}</p>
              <Badge className={`mt-2 ${STATUS_BADGE[invoice.status] ?? ""}`}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Bill to / Dates */}
          <div className="flex justify-between mb-10">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Billed To</p>
              <p className="font-semibold text-foreground">{invoice.clientName}</p>
              {invoice.projectName && <p className="text-sm text-muted-foreground">{invoice.projectName}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Details</p>
              <p className="text-sm text-foreground">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
              {invoice.paidAt && (
                <p className="text-sm text-emerald-400">Paid: {new Date(invoice.paidAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="mb-8 rounded-lg overflow-hidden border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/30">
                <tr>
                  <th className="p-4 text-left font-semibold text-muted-foreground">Description</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground">Qty</th>
                  <th className="p-4 text-right font-semibold text-muted-foreground">Rate</th>
                  <th className="p-4 text-right font-semibold text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-t border-white/5">
                    <td className="p-4 text-foreground">{item.description}</td>
                    <td className="p-4 text-foreground text-center">{item.quantity}</td>
                    <td className="p-4 text-foreground text-right">{fmt(item.rate)}</td>
                    <td className="p-4 text-foreground text-right font-medium">{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{fmt(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm pb-3 border-b border-white/10">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="text-foreground">{fmt(invoice.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{fmt(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-10 pt-8 border-t border-white/10">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
