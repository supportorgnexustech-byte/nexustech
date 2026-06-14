import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListTasks, useListProjects, useUpdateTask, Task } from "@workspace/api-client-react";
import { Loader2, Plus, Tag, Columns } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: "backlog", label: "Backlog", color: "text-muted-foreground" },
  { key: "todo", label: "To Do", color: "text-blue-400" },
  { key: "in_progress", label: "In Progress", color: "text-amber-400" },
  { key: "review", label: "Review", color: "text-violet-400" },
  { key: "done", label: "Done", color: "text-emerald-400" },
];

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-white/10 text-muted-foreground border-white/10",
};

export default function Kanban() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading, refetch } = useListTasks(undefined, { query: { queryKey: ["tasks"] } });
  const { data: projects } = useListProjects();
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const [dragging, setDragging] = useState<Task | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = filterProject
    ? tasks?.filter(t => t.projectId === filterProject)
    : tasks;

  const handleDragStart = (task: Task) => setDragging(task);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!dragging || dragging.status === status) { setDragging(null); return; }
    
    // Optimistic Update
    queryClient.setQueryData(["tasks"], (oldTasks: any) => {
      if (!oldTasks) return oldTasks;
      return oldTasks.map((t: any) => t.id === dragging.id ? { ...t, status } : t);
    });

    try {
      updateTask.mutateAsync({ id: dragging.id, data: { status: status as any } }).then(() => {
        toast({ title: "Task moved", description: `"${dragging.title}" → ${status.replace("_", " ")}` });
        refetch();
      }).catch(() => {
        toast({ title: "Failed to move task", variant: "destructive" });
        refetch();
      });
    } catch (err) {
      toast({ title: "Failed to move task", variant: "destructive" });
      refetch();
    }
    setDragging(null);
  };

  return (
    <div className="space-y-4 fade-in h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Columns className="w-8 h-8 text-primary" />
            Kanban Board
          </h1>
          <p className="text-muted-foreground mt-1">Drag tasks between columns to update their status.</p>
        </div>
        <select
          className="bg-card border border-white/10 rounded-md text-sm text-foreground px-3 py-2 outline-none"
          value={filterProject ?? ""}
          onChange={e => setFilterProject(e.target.value ? e.target.value : null)}
        >
          <option value="">All Projects</option>
          {projects?.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Column counts */}
      <div className="flex gap-3 shrink-0">
        {COLUMNS.map(col => {
          const count = filtered?.filter(t => t.status === col.key).length ?? 0;
          return (
            <div key={col.key} className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
              <span className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 min-h-0">
        {COLUMNS.map(col => (
          <div
            key={col.key}
            className="w-72 flex-shrink-0 bg-card/30 border border-white/5 rounded-lg flex flex-col"
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.key)}
          >
            <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <h3 className={`font-semibold text-sm ${col.color}`}>{col.label}</h3>
              <span className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-muted-foreground">
                {filtered?.filter(t => t.status === col.key).length ?? 0}
              </span>
            </div>
            <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto">
              {filtered?.filter(t => t.status === col.key).map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className={`bg-card/80 border border-white/10 p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors ${dragging?.id === task.id ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
                    <Badge variant="outline" className={`text-[10px] shrink-0 capitalize ${PRIORITY_BADGE[task.priority] ?? ""}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-primary/80 font-medium mb-2">{task.projectName}</p>
                  {task.assigneeName && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                        {task.assigneeName.charAt(0)}
                      </div>
                      <span className="text-xs text-muted-foreground">{task.assigneeName}</span>
                    </div>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {task.dueDate && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              {(filtered?.filter(t => t.status === col.key).length ?? 0) === 0 && (
                <div className="h-20 border border-dashed border-white/5 rounded-lg flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Drop here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
