import React from "react";
import { useListResources, useGetResourceSummary, useCreateResource, useUpdateResource, useDeleteResource, useListProjects, Resource } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Cpu, IndianRupee, Server, Wrench, ShieldCheck, HelpCircle, Edit, Trash2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function Resources() {
  const queryClient = useQueryClient();
  const { data: resources, isLoading: resourcesLoading, refetch: refetchResources } = useListResources();
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetResourceSummary();
  const { data: projects } = useListProjects();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [formData, setFormData] = React.useState({
    projectId: "",
    type: "dev_hours",
    description: "",
    quantity: "",
    unit: "hours",
    costPerUnit: "",
    date: new Date().toISOString().split("T")[0],
  });

  React.useEffect(() => {
    let defaultUnit = "hours";
    if (formData.type === "hosting") defaultUnit = "months";
    else if (formData.type === "tools") defaultUnit = "months";
    else if (formData.type === "licenses") defaultUnit = "licenses";
    setFormData(prev => ({ ...prev, unit: defaultUnit }));
  }, [formData.type]);

  if (resourcesLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dev_hours": return <Cpu className="w-4 h-4 text-primary" />;
      case "hosting": return <Server className="w-4 h-4 text-blue-400" />;
      case "tools": return <Wrench className="w-4 h-4 text-amber-500" />;
      case "licenses": return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default: return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const byProjectData = summary?.byProject.map(p => ({
    name: p.projectName.length > 16 ? p.projectName.slice(0, 16) + "…" : p.projectName,
    value: p.totalCost,
  })) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    if (!formData.projectId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a project.",
      });
      return;
    }

    try {
      setIsPending(true);
      const qty = parseFloat(formData.quantity);
      const cpu = parseFloat(formData.costPerUnit);
      
      if (editingId) {
        await updateResource.mutateAsync({
          id: editingId,
          data: {
            projectId: formData.projectId,
            type: formData.type as any,
            description: formData.description || undefined,
            quantity: qty,
            unit: formData.unit,
            costPerUnit: cpu,
            date: formData.date,
          }
        });
        toast({ title: "Resource Updated", description: "Resource updated successfully." });
      } else {
        await createResource.mutateAsync({
          data: {
            projectId: formData.projectId,
            type: formData.type as any,
            description: formData.description || undefined,
            quantity: qty,
            unit: formData.unit,
            costPerUnit: cpu,
            date: formData.date,
          }
        });
        toast({ title: "Resource Logged", description: "Resource logged successfully." });
      }

      setIsOpen(false);
      setEditingId(null);
      setFormData({
        projectId: "",
        type: "dev_hours",
        description: "",
        quantity: "",
        unit: "hours",
        costPerUnit: "",
        date: new Date().toISOString().split("T")[0],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/resources`] });
      refetchResources();
      refetchSummary();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to save resource.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleEditClick = (resource: Resource) => {
    setEditingId(resource.id);
    setFormData({
      projectId: resource.projectId,
      type: resource.type,
      description: resource.description || "",
      quantity: resource.quantity.toString(),
      unit: resource.unit,
      costPerUnit: resource.costPerUnit.toString(),
      date: resource.date,
    });
    setIsOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteResource.mutateAsync({ id });
      toast({ title: "Resource Deleted", description: "The resource has been deleted." });
      queryClient.invalidateQueries({ queryKey: [`/api/resources`] });
      refetchResources();
      refetchSummary();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete resource." });
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Resources
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage resource consumption across projects.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Resource" : "Log Resource Consumption"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <select
                  id="project"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                >
                  <option value="" className="bg-card text-foreground">Select a project...</option>
                  {projects?.map(p => (
                    <option key={p.id} value={p.id} className="bg-card text-foreground">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Resource Type</Label>
                  <select
                    id="type"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="dev_hours" className="bg-card text-foreground">Dev Hours</option>
                    <option value="hosting" className="bg-card text-foreground">Hosting</option>
                    <option value="tools" className="bg-card text-foreground">Tools</option>
                    <option value="licenses" className="bg-card text-foreground">Licenses</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. AWS monthly billing, dev contractor"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="any"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Input
                    id="unit"
                    required
                    placeholder="e.g. hours"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPerUnit">Rate / Unit (₹) *</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    required
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                  />
                </div>
              </div>

              {formData.quantity && formData.costPerUnit && (
                <div className="bg-muted/40 p-3 rounded-lg flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Calculated Total Cost:</span>
                  <span className="font-bold text-foreground text-base">
                    ₹{(parseFloat(formData.quantity) * parseFloat(formData.costPerUnit)).toLocaleString()}
                  </span>
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setEditingId(null); setFormData({ projectId: "", type: "dev_hours", description: "", quantity: "", unit: "hours", costPerUnit: "", date: new Date().toISOString().split("T")[0] }); }} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editingId ? "Update Resource" : "Log Resource"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Cost", value: fmt(summary.totalCost), icon: IndianRupee },
            { label: "Dev Hours", value: `${summary.totalDevHours}h`, icon: Cpu },
            { label: "Hosting", value: fmt(summary.totalHostingCost), icon: Server },
            { label: "Tools & Licenses", value: fmt(summary.totalToolsCost), icon: Wrench },
          ].map(k => (
            <Card key={k.label} className="bg-card/50 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
                <k.icon className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost by Project Pie */}
        {byProjectData.length > 0 && (
          <Card className="bg-card/50 border-white/10">
            <CardHeader><CardTitle>Cost by Project</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byProjectData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {byProjectData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", borderRadius: 8 }}
                    itemStyle={{ color: "#e2e8f0" }}
                    formatter={(v: number) => [fmt(v), "Cost"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {byProjectData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resource Logs */}
        <Card className={`bg-card/50 border-white/10 ${byProjectData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <CardHeader>
            <CardTitle>Resource Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {resources?.map((resource: Resource) => (
                <div key={resource.id} className="group flex items-center justify-between p-4 border border-white/5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-md">
                      {getTypeIcon(resource.type)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{resource.projectName ?? "General"}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {resource.type.replace("_", " ")} • {resource.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(resource.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <div className="flex items-center gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditClick(resource)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(resource.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{fmt(resource.totalCost)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {resource.quantity} {resource.unit} @ {fmt(resource.costPerUnit)}/{resource.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {!resources?.length && (
                <p className="text-center py-8 text-muted-foreground">No resources logged yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
