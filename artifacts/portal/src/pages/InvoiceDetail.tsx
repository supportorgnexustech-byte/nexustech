import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetInvoice, useUpdateInvoice, useDeleteInvoice, useRecordInvoicePayment } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send, CheckCircle, Edit, Trash2, IndianRupee, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const invoiceId = id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoice, isLoading, refetch } = useGetInvoice(invoiceId, {
    query: { enabled: !!invoiceId, queryKey: ["invoice", invoiceId] },
  });
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const recordPayment = useRecordInvoicePayment();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    dueDate: "",
    status: "draft",
    notes: "",
  });
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "upi",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
        status: invoice.status || "draft",
        notes: invoice.notes || "",
      });
    }
  }, [invoice]);

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
    queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    refetch();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    try {
      setIsPending(true);
      await updateInvoice.mutateAsync({
        id: invoiceId,
        data: {
          dueDate: formData.dueDate,
          status: formData.status as any,
          notes: formData.notes || undefined,
        }
      });
      toast({ title: "Invoice Updated", description: "The invoice details have been updated." });
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices`] });
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update invoice." });
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete invoice ${invoice?.invoiceNumber}?`)) {
      try {
        await deleteInvoice.mutateAsync({ id: invoiceId });
        toast({ title: "Invoice Deleted", description: "The invoice has been removed." });
        queryClient.invalidateQueries({ queryKey: [`/api/invoices`] });
        setLocation("/invoices");
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete invoice." });
      }
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    try {
      setIsPending(true);
      await recordPayment.mutateAsync({
        id: invoiceId,
        data: {
          amount: parseFloat(paymentData.amount) || 0,
          method: paymentData.method as "cash" | "upi",
          date: paymentData.date,
        }
      });
      toast({ title: "Payment Recorded", description: "Advance payment has been saved." });
      setIsPaymentOpen(false);
      setPaymentData({ amount: "", method: "upi", date: new Date().toISOString().split("T")[0] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices`] });
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to record payment." });
    } finally {
      setIsPending(false);
    }
  };

  const downloadSlip = (payment: any) => {
    import("jspdf").then((jsPDFModule) => {
      import("jspdf-autotable").then((autoTableModule) => {
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Advance Payment Receipt", 14, 22);

        doc.setFontSize(11);
        doc.text(`Company: Nexus Tech Solutions`, 14, 32);
        doc.text(`Client: ${invoice.clientName}`, 14, 38);
        doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, 44);
        doc.text(`Receipt No: ${payment.receiptNumber}`, 14, 50);
        doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, 14, 56);

        autoTable(doc, {
          startY: 65,
          head: [["Description", "Amount"]],
          body: [
            [`Advance Payment via ${payment.method.toUpperCase()}`, fmt(payment.amount)],
          ],
        });

        const finalY = (doc as any).lastAutoTable.finalY || 65;
        doc.text(`Total Invoice Amount: ${fmt(invoice.total || 0)}`, 14, finalY + 15);
        doc.text(`Total Amount Paid: ${fmt(invoice.amountPaid || 0)}`, 14, finalY + 22);
        doc.text(`Remaining Balance: ${fmt(invoice.amountPending || 0)}`, 14, finalY + 29);

        doc.save(`${payment.receiptNumber}.pdf`);
      });
    });
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
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={() => setIsPaymentOpen(true)}>
              <IndianRupee className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input id="dueDate" type="date" required value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="draft" className="bg-card text-foreground">Draft</option>
                  <option value="sent" className="bg-card text-foreground">Sent</option>
                  <option value="paid" className="bg-card text-foreground">Paid</option>
                  <option value="overdue" className="bg-card text-foreground">Overdue</option>
                  <option value="cancelled" className="bg-card text-foreground">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Record Advance Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" step="0.01" required value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <select id="method" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}>
                  <option value="upi" className="bg-card text-foreground">UPI</option>
                  <option value="cash" className="bg-card text-foreground">Cash</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payDate">Date *</Label>
                <Input id="payDate" type="date" required value={paymentData.date} onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Record Payment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <span className="text-primary">{fmt(invoice.total || 0)}</span>
              </div>
              {((invoice.amountPaid || 0) > 0) && (
                <>
                  <div className="flex justify-between text-sm pt-3 border-t border-white/10 text-emerald-400">
                    <span>Paid</span>
                    <span>{fmt(invoice.amountPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="text-destructive font-medium">{fmt(invoice.amountPending || 0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment History */}
          {invoice.advancePayments && invoice.advancePayments.length > 0 && (
            <div className="mt-10 pt-8 border-t border-white/10">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Payment History</p>
              <div className="rounded-lg overflow-hidden border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="p-3 text-left font-semibold text-muted-foreground">Receipt No</th>
                      <th className="p-3 text-left font-semibold text-muted-foreground">Date</th>
                      <th className="p-3 text-left font-semibold text-muted-foreground">Method</th>
                      <th className="p-3 text-right font-semibold text-muted-foreground">Amount</th>
                      <th className="p-3 text-center font-semibold text-muted-foreground">Slip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.advancePayments.map((p: any, idx: number) => (
                      <tr key={idx} className="border-t border-white/5">
                        <td className="p-3 text-foreground font-mono text-xs">{p.receiptNumber}</td>
                        <td className="p-3 text-foreground">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="p-3 text-foreground uppercase">{p.method}</td>
                        <td className="p-3 text-foreground text-right font-medium text-emerald-400">{fmt(p.amount)}</td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => downloadSlip(p)} className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300">
                            <Download className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

