import React from "react";
import { useListProjects, useCreateProject, useDeleteProject, useListClients, Project } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Calendar, AlertCircle, Trash2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
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

export default function Projects() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading, refetch } = useListProjects();
  const { data: clients } = useListClients();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    clientId: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    priority: "medium",
    budget: "",
    status: "planning",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const priorityColors = {
    low: "text-muted-foreground",
    medium: "text-blue-400",
    high: "text-amber-500",
    critical: "text-destructive",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    if (!formData.clientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a client.",
      });
      return;
    }

    try {
      setIsPending(true);
      await createProject.mutateAsync({
        data: {
          name: formData.name,
          clientId: formData.clientId,
          description: formData.description || undefined,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          priority: formData.priority as "low" | "medium" | "high" | "critical",
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          status: formData.status as "planning" | "active" | "completed" | "on_hold",
          assignedDevIds: [],
        }
      });

      toast({
        title: "Project Created",
        description: `${formData.name} project has been created.`,
      });

      setIsOpen(false);
      setFormData({
        name: "",
        clientId: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        priority: "medium",
        budget: "",
        status: "planning",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects`] });
      refetch();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create project.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the project "${name}"? This action cannot be undone.`)) {
      try {
        await deleteProject.mutateAsync({ id });
        toast({ title: "Project Deleted", description: `${name} has been removed.` });
        queryClient.invalidateQueries({ queryKey: [`/api/projects`] });
        refetch();
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete project." });
      }
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Projects
          </h1>
          <p className="text-muted-foreground mt-1">Track ongoing projects and their progress.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <select
                  id="client"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                >
                  <option value="" className="bg-card text-foreground">Select a client...</option>
                  {clients?.map(c => (
                    <option key={c.id} value={c.id} className="bg-card text-foreground">
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date / Deadline</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low" className="bg-card text-foreground">Low</option>
                    <option value="medium" className="bg-card text-foreground">Medium</option>
                    <option value="high" className="bg-card text-foreground">High</option>
                    <option value="critical" className="bg-card text-foreground">Critical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g. 50000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="planning" className="bg-card text-foreground">Planning</option>
                  <option value="active" className="bg-card text-foreground">Active</option>
                  <option value="completed" className="bg-card text-foreground">Completed</option>
                  <option value="on_hold" className="bg-card text-foreground">On Hold</option>
                </select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects?.map((project: Project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="bg-card/50 border-white/10 hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{project.clientName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                      onClick={(e) => handleDelete(e, project.id!, project.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground line-clamp-2">
                  {project.description || "No description provided."}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.startDate).toLocaleDateString()}
                  </div>
                  <div className={`flex items-center gap-1 font-medium capitalize ${priorityColors[project.priority]}`}>
                    <AlertCircle className="w-4 h-4" />
                    {project.priority} Priority
                  </div>
                </div>

                <div className="space-y-1.5 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
