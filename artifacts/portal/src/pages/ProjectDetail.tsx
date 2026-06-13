import React from "react";
import { useParams } from "wouter";
import { useGetProject, useListTasks, useListProjectMilestones } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, AlertCircle, CheckCircle2, Circle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  const projectId = parseInt(id, 10);

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId },
  });
  const { data: allTasks, isLoading: tasksLoading } = useListTasks(
    { projectId },
    { query: { enabled: !!projectId } }
  );
  const { data: milestones, isLoading: milestonesLoading } = useListProjectMilestones(projectId, {
    query: { enabled: !!projectId },
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
      </div>

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

        {/* Task Stats */}
        <Card className="bg-card/50 border-white/10">
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
