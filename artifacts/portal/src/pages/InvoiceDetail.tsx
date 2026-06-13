import React from "react";
import { useParams } from "wouter";
import { useGetInvoice } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id, 10);

  const { data: invoice, isLoading } = useGetInvoice(invoiceId, {
    query: { enabled: !!invoiceId, queryKey: ["invoice", invoiceId] }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return <div>Invoice not found.</div>;
  }

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground text-sm">{invoice.clientName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-white/10 hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-card/50 border-white/10 p-8">
        <div className="flex justify-between items-start mb-12 border-b border-white/10 pb-8">
          <div>
            <h2 className="text-xl font-bold text-primary mb-1">NEXUS</h2>
            <p className="text-sm text-muted-foreground">Operations Portal</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-foreground mb-1">INVOICE</h3>
            <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
            <Badge className="mt-2" variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
              {invoice.status.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="flex justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Billed To:</p>
            <p className="font-medium text-foreground">{invoice.clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Date Details:</p>
            <p className="text-sm text-foreground">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p className="text-sm text-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-8">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/20 border-b border-white/10">
              <tr>
                <th className="p-4 font-semibold text-muted-foreground rounded-tl-lg">Description</th>
                <th className="p-4 font-semibold text-muted-foreground text-center">Qty</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Rate</th>
                <th className="p-4 font-semibold text-muted-foreground text-right rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5 last:border-0">
                  <td className="p-4 text-foreground">{item.description}</td>
                  <td className="p-4 text-foreground text-center">{item.quantity}</td>
                  <td className="p-4 text-foreground text-right">${item.rate.toLocaleString()}</td>
                  <td className="p-4 text-foreground text-right font-medium">${item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">${invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pb-3 border-b border-white/10">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-foreground">${invoice.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span className="text-foreground">Total</span>
              <span className="text-primary">${invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Notes</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
