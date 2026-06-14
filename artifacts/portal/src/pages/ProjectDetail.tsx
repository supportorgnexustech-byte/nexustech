import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProject, useListTasks, useListProjectMilestones, useUpdateProject, useDeleteProject, useGenerateTasks, useUpdateTask } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, AlertCircle, CheckCircle2, Circle, Clock, Edit, Trash2, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Github, Link as LinkIcon, CheckSquare } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-blue-400",
  high: "text-amber-500",
  critical: "text-destructive",
};

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  review: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  backlog: "bg-white/5 text-muted-foreground border-white/10",
};

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString()}`;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const generateTasks = useGenerateTasks();
  const updateTask = useUpdateTask();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [generatingFeatureId, setGeneratingFeatureId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: "medium",
    budget: "",
    status: "planning",
  });

  const { data: project, isLoading: projectLoading, refetch } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: ["project", projectId] },
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
        priority: project.priority || "medium",
        budget: project.budget ? project.budget.toString() : "",
        status: project.status || "planning",
      });
      if (project.githubRepoUrl) {
        setRepoInput(project.githubRepoUrl);
      }
    }
  }, [project]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    try {
      setIsPending(true);
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          name: formData.name,
          description: formData.description || undefined,
          endDate: formData.endDate || undefined,
          priority: formData.priority as "low" | "medium" | "high" | "critical",
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          status: formData.status as "planning" | "active" | "completed" | "on_hold",
        }
      });
      toast({ title: "Project Updated", description: "The project details have been updated." });
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects`] });
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update project." });
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the project "${project?.name}"?`)) {
      try {
        await deleteProject.mutateAsync({ id: projectId });
        toast({ title: "Project Deleted", description: "The project has been removed." });
        queryClient.invalidateQueries({ queryKey: [`/api/projects`] });
        setLocation("/projects");
      } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete project." });
      }
    }
  };

  const handleSaveRepo = async () => {
    if (!repoInput.trim()) return;
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { githubRepoUrl: repoInput }
      });
      toast({ title: "Repository Linked", description: "GitHub repository URL has been saved." });
      setIsEditingRepo(false);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save repository URL." });
    }
  };

  const handleToggleFeature = async (featureId: string, currentCompleted: boolean) => {
    if (!project || !project.featuresList) return;
    
    const updatedFeatures = project.featuresList.map((f: any) => 
      f.id === featureId ? { ...f, completed: !currentCompleted } : f
    );

    // Optimistic Update
    queryClient.setQueryData(["project", projectId], (old: any) => {
      if (!old) return old;
      return { ...old, featuresList: updatedFeatures };
    });

    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: { featuresList: updatedFeatures }
      });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast({ variant: "destructive", title: "Error", description: "Failed to update feature status." });
    }
  };

  const handleGenerateTasksForFeature = async (featureId: string, featureTitle: string) => {
    if (!project || generatingFeatureId) return;
    
    setGeneratingFeatureId(featureId);
    try {
      await generateTasks.mutateAsync({
        data: {
          projectId,
          featureId,
          featureTitle,
          projectDescription: project.description || "Project features",
        }
      });
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast({ title: "Tasks Generated", description: "AI successfully generated tasks for this feature." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate tasks." });
    } finally {
      setGeneratingFeatureId(null);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string, featureId?: string | null) => {
    try {
      const newStatus = currentStatus === "done" ? "todo" : "done";
      
      // Optimistic Update
      queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
        if (!oldTasks) return oldTasks;
        return oldTasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t);
      });

      await updateTask.mutateAsync({
        id: taskId,
        data: { status: newStatus as any }
      });
      
      // Auto-check feature if all tasks for it are done
      if (featureId && project?.featuresList) {
        const featureTasks = queryClient.getQueryData(["tasks", projectId]) as any[] || allTasks || [];
        const featureTasksOnly = featureTasks.filter(t => t.featureId === featureId);
        
        const allDone = featureTasksOnly.length > 0 && featureTasksOnly.every(t => t.status === "done");
        const feature = project.featuresList.find((f: any) => f.id === featureId);
        
        if (feature) {
          if (allDone && !feature.completed) {
            handleToggleFeature(featureId, false);
            toast({ title: "Feature Completed", description: "All tasks for this feature are complete." });
          } else if (!allDone && feature.completed) {
            handleToggleFeature(featureId, true);
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    } catch (err) {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast({ variant: "destructive", title: "Error", description: "Failed to update task status." });
    }
  };

  const { data: allTasks, isLoading: tasksLoading } = useListTasks(
    { projectId },
    { query: { enabled: !!projectId, queryKey: ["tasks", projectId] } }
  );
  const { data: milestones, isLoading: milestonesLoading } = useListProjectMilestones(projectId, {
    query: { enabled: !!projectId, queryKey: ["milestones", projectId] },
  });

  if (projectLoading || tasksLoading || milestonesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return <div className="text-muted-foreground p-8">Project not found.</div>;

  const tasks = allTasks ?? [];
  const statusCounts = {
    backlog: tasks.filter(t => t.status === "backlog").length,
    todo: tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    review: tasks.filter(t => t.status === "review").length,
    done: tasks.filter(t => t.status === "done").length,
  };
  const totalHours = tasks.reduce((s, t) => s + (t.loggedHours ?? 0), 0);
  const estimatedHours = tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === "active" ? "default" : "secondary"} className="capitalize">
              {project.status.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className={`capitalize ${PRIORITY_COLORS[project.priority]}`}>
              {project.priority} priority
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{project.clientName}</p>
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
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date / Deadline</Label>
                <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select id="priority" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="low" className="bg-card text-foreground">Low</option>
                  <option value="medium" className="bg-card text-foreground">Medium</option>
                  <option value="high" className="bg-card text-foreground">High</option>
                  <option value="critical" className="bg-card text-foreground">Critical</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input id="budget" type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="planning" className="bg-card text-foreground">Planning</option>
                <option value="active" className="bg-card text-foreground">Active</option>
                <option value="completed" className="bg-card text-foreground">Completed</option>
                <option value="on_hold" className="bg-card text-foreground">On Hold</option>
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview */}
        <Card className="bg-card/50 border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-foreground/80">{project.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{project.progress ?? 0}%</span>
              </div>
              <Progress value={project.progress ?? 0} className="h-2.5" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
              {project.budget && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Budget</p>
                  <p className="text-sm font-bold text-foreground">{fmt(project.budget)}</p>
                </div>
              )}
              {project.spent !== undefined && project.spent !== null && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Spent</p>
                  <p className="text-sm font-bold text-foreground">{fmt(project.spent)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {new Date(project.startDate).toLocaleDateString()}
                </p>
              </div>
              {project.endDate && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GitHub Repo */}
        <Card className="bg-card/50 border-white/10 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.githubRepoUrl && !isEditingRepo ? (
              <div className="space-y-4">
                <a 
                  href={project.githubRepoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors break-all bg-blue-500/10 p-3 rounded-lg border border-blue-500/20"
                >
                  <LinkIcon className="w-4 h-4 shrink-0" />
                  {project.githubRepoUrl}
                </a>
                <Button variant="outline" size="sm" onClick={() => setIsEditingRepo(true)} className="w-full">
                  Edit Link
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">GitHub URL</Label>
                  <Input 
                    placeholder="https://github.com/..." 
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveRepo} className="flex-1" size="sm" disabled={updateProject.isPending}>
                    {updateProject.isPending ? "Saving..." : "Save Link"}
                  </Button>
                  {isEditingRepo && (
                    <Button variant="outline" size="sm" onClick={() => {
                      setIsEditingRepo(false);
                      setRepoInput(project.githubRepoUrl || "");
                    }}>Cancel</Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Stats */}
        <Card className="bg-card/50 border-white/10 lg:col-span-3">
          <CardHeader>
            <CardTitle>Task Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">{status.replace("_", " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${tasks.length > 0 ? (count / tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Hours Logged</span>
                <span className="font-medium text-foreground">{totalHours}h / {estimatedHours}h</span>
              </div>
              <Progress value={estimatedHours > 0 ? (totalHours / estimatedHours) * 100 : 0} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Checklist */}
      {project.featuresList && project.featuresList.length > 0 && (
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Project Features Checklist
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Update these items as they are completed to automatically adjust the project progress percentage.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.featuresList.map((feature: any) => {
                const featureTasks = tasks.filter(t => t.featureId === feature.id);
                
                return (
                  <div key={feature.id} className="space-y-2">
                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        feature.completed 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-black/10 border-white/5 hover:bg-black/20'
                      }`}
                    >
                      <Checkbox 
                        id={feature.id}
                        checked={feature.completed}
                        onCheckedChange={() => handleToggleFeature(feature.id, feature.completed)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={feature.id} 
                          className={`text-sm font-medium cursor-pointer ${
                            feature.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {feature.title}
                        </label>
                      </div>
                      {featureTasks.length === 0 && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-7 text-xs" 
                          onClick={() => handleGenerateTasksForFeature(feature.id, feature.title)}
                          disabled={generatingFeatureId === feature.id}
                        >
                          {generatingFeatureId === feature.id ? (
                            <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
                          ) : (
                            <><Bot className="w-3 h-3 mr-1.5 text-primary" /> Generate Tasks</>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {featureTasks.length > 0 && (
                      <div className="pl-9 space-y-2">
                        {featureTasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-2.5 rounded border border-white/5 bg-black/5 hover:bg-black/10 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Checkbox 
                                id={`task-${task.id}`}
                                checked={task.status === "done"}
                                onCheckedChange={() => handleToggleTask(task.id, task.status, feature.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <label htmlFor={`task-${task.id}`} className={`text-sm cursor-pointer block truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground/90'}`}>
                                  {task.title}
                                </label>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-primary" onClick={() => setLocation(`/chat?task=${encodeURIComponent(task.title)}&projectId=${projectId}`)}>
                                <Bot className="w-3 h-3 mr-1" />
                                Ask AI
                              </Button>
                              <Badge variant="outline" className={`text-[10px] capitalize ${PRIORITY_COLORS[task.priority]}`}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map(m => (
                <div key={m.id} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                  {m.completed
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  }
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${m.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {m.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {m.completed && m.completedAt
                        ? `Completed ${new Date(m.completedAt).toLocaleDateString()}`
                        : `Due ${new Date(m.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <Card className="bg-card/50 border-white/10">
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/10 hover:bg-black/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.assigneeName ?? "Unassigned"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Badge variant="outline" className={`text-xs capitalize ${STATUS_BADGE[task.status] ?? ""}`}>
                    {task.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className={`text-xs capitalize ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No tasks for this project yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
