import React from "react";
import { useListResources, useGetResourceSummary, Resource } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Cpu, IndianRupee, Server, Wrench, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function Resources() {
  const { data: resources, isLoading: resourcesLoading } = useListResources();
  const { data: summary, isLoading: summaryLoading } = useGetResourceSummary();

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

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground mt-1">Track and manage resource consumption across projects.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Log Resource
        </Button>
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
                <div key={resource.id} className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
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
                  <div className="text-right">
                    <p className="font-bold text-foreground">{fmt(resource.totalCost)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {resource.quantity} {resource.unit} @ {fmt(resource.costPerUnit)}/{resource.unit}
                    </p>
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
