import React from "react";
import { useParams } from "wouter";
import { useGetProject, useListTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id, 10);

  const { data: project, isLoading: projectLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: ["project", projectId] }
  });

  const { data: tasks, isLoading: tasksLoading } = useListTasks();

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return <div>Project not found.</div>;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="capitalize">{project.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{project.clientName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-white/10 lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-foreground">{project.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{project.progress || 0}%</span>
              </div>
              <Progress value={project.progress || 0} className="h-2" />
            </div>
            
            <div className="flex gap-6 pt-4 border-t border-white/5">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {new Date(project.startDate).toLocaleDateString()}
                </p>
              </div>
              {project.endDate && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">End Date</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Task Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for task stats */}
            <p className="text-sm text-muted-foreground">Kanban integration pending...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
