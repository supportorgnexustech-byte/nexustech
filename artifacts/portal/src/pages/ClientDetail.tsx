import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetClient, useListProjects, useListInvoices, useUpdateClient, useDeleteClient } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Mail, Phone, MapPin, Briefcase, FileText, ArrowUpRight, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: client, isLoading: clientLoading, refetch } = useGetClient(clientId, {
    query: { enabled: !!clientId, queryKey: ["client", clientId] }
  });
  
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    gstin: "",
    services: "",
    status: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName || "",
        businessType: client.businessType || "",
        contactName: client.contactName || "",
        contactEmail: client.contactEmail || "",
        contactPhone: client.contactPhone || "",
        address: client.address || "",
        gstin: client.gstin || "",
        services: client.services?.join(", ") || "",
        status: client.status || "active",
      });
    }
  }, [client]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    try {
      setIsPending(true);
      const servicesArray = formData.services.split(",").map(s => s.trim()).filter(s => s !== "");
      await updateClient.mutateAsync({
        id: clientId,
        data: {
          companyName: formData.companyName,
          businessType: formData.businessType,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone || undefined,
          address: formData.address || undefined,
          gstin: formData.gstin || undefined,
          services: servicesArray,
          status: formData.status as "active" | "inactive",
        }
      });
      toast({ title: "Client Updated", description: "The client details have been updated." });
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients`] });
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update client." });
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${client?.companyName}?`)) {
      try {
        await deleteClient.mutateAsync({ id: clientId });
        toast({ title: "Client Deleted", description: "The client has been removed." });
        queryClient.invalidateQueries({ queryKey: [`/api/clients`] });
        setLocation("/clients");
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete client." });
      }
    }
  };

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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" required value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Input id="businessType" required value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input id="contactName" required value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input id="contactEmail" type="email" required value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="services">Services Offered</Label>
              <Input id="services" value={formData.services} onChange={(e) => setFormData({ ...formData, services: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active" className="bg-card text-foreground">Active</option>
                  <option value="inactive" className="bg-card text-foreground">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
