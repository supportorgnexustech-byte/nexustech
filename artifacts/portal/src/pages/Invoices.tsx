import React, { useState } from "react";
import { useListInvoices, useCreateInvoice, useDeleteInvoice, useListClients, Invoice } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, FileText, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const queryClient = useQueryClient();
  const { data: invoices, isLoading, refetch } = useListInvoices();
  const { data: clients } = useListClients();
  const createInvoice = useCreateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    dueDate: new Date().toISOString().split("T")[0],
    tax: "18",
    status: "draft",
    itemDescription: "Consulting Services",
    itemQuantity: "1",
    itemRate: "0"
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    if (!formData.clientId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a client." });
      return;
    }
    try {
      setIsPending(true);
      await createInvoice.mutateAsync({
        data: {
          clientId: formData.clientId,
          dueDate: formData.dueDate,
          tax: parseFloat(formData.tax) || 0,
          status: formData.status as "draft" | "sent" | "paid" | "overdue" | "cancelled",
          items: [{
            description: formData.itemDescription,
            quantity: parseFloat(formData.itemQuantity) || 1,
            rate: parseFloat(formData.itemRate) || 0,
            amount: (parseFloat(formData.itemQuantity) || 1) * (parseFloat(formData.itemRate) || 0)
          }]
        }
      });
      toast({ title: "Invoice Created", description: "The new invoice has been successfully created." });
      setIsOpen(false);
      setFormData({
        clientId: "",
        dueDate: new Date().toISOString().split("T")[0],
        tax: "18",
        status: "draft",
        itemDescription: "Consulting Services",
        itemQuantity: "1",
        itemRate: "0"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices`] });
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create invoice." });
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, invoiceNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      try {
        await deleteInvoice.mutateAsync({ id });
        toast({ title: "Invoice Deleted", description: `Invoice ${invoiceNumber} removed.` });
        queryClient.invalidateQueries({ queryKey: [`/api/invoices`] });
        refetch();
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete invoice." });
      }
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1">Manage billing and payments.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <select id="client" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}>
                  <option value="" className="bg-card text-foreground">Select client...</option>
                  {clients?.map(c => <option key={c.id} value={c.id!} className="bg-card text-foreground">{c.companyName}</option>)}
                </select>
              </div>
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
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Item Description</Label>
                <Input required value={formData.itemDescription} onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" required value={formData.itemQuantity} onChange={(e) => setFormData({ ...formData, itemQuantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Rate (₹)</Label>
                  <Input type="number" required value={formData.itemRate} onChange={(e) => setFormData({ ...formData, itemRate: e.target.value })} />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Creating..." : "Create Invoice"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`capitalize min-w-[70px] justify-center ${STATUS_STYLES[invoice.status] ?? ""}`}>
                      {invoice.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                      onClick={(e) => handleDelete(e, invoice.id!, invoice.invoiceNumber)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
