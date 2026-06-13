import React from "react";
import { useListProjects, Project } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();

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

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Track ongoing projects and their progress.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
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
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {project.status.replace('_', ' ')}
                  </Badge>
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
