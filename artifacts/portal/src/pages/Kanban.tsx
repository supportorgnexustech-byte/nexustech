import React from "react";
import { useListTasks } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export default function Kanban() {
  const { data: tasks, isLoading } = useListTasks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground mt-1">Manage tasks across all projects.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {/* Simplified Kanban columns for now */}
        {['backlog', 'todo', 'in_progress', 'review', 'done'].map(status => (
          <div key={status} className="w-80 flex-shrink-0 bg-card/30 border border-white/5 rounded-lg flex flex-col">
            <div className="p-3 border-b border-white/5 bg-black/20">
              <h3 className="font-semibold text-sm capitalize">{status.replace('_', ' ')}</h3>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {tasks?.filter(t => t.status === status).map(task => (
                <div key={task.id} className="bg-card/80 border border-white/10 p-3 rounded shadow-sm">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{task.projectName}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
