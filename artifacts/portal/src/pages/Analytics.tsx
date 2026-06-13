import React from "react";
import { useGetDashboardAnalytics, useGetRevenueAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboardAnalytics();
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueAnalytics();

  if (dashboardLoading || revenueLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep dive into performance metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border border-white/5 border-dashed rounded-md bg-black/10">
              {/* Replace with Recharts LineChart */}
              <p className="text-muted-foreground text-sm">Revenue chart visualization</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Resource Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border border-white/5 border-dashed rounded-md bg-black/10">
              {/* Replace with Recharts PieChart */}
              <p className="text-muted-foreground text-sm">Resource pie chart visualization</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
