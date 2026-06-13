import React from "react";
import { useGetDashboardAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, Briefcase, Users, Clock, ArrowUpRight } from "lucide-react";

export default function Dashboard() {
  const { data: analytics, isLoading } = useGetDashboardAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your operations and performance.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${analytics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <Briefcase className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium text-white">{analytics.completedProjects}</span> completed this year
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active accounts across all regions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10 hover:border-white/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dev Hours</CardTitle>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics.totalDevHours}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total logged time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {analytics.recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium text-foreground">${analytics.invoiceStats.paid.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(analytics.invoiceStats.paid / Math.max(1, analytics.invoiceStats.paid + analytics.invoiceStats.pending + analytics.invoiceStats.overdue)) * 100}%` }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-foreground">${analytics.invoiceStats.pending.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(analytics.invoiceStats.pending / Math.max(1, analytics.invoiceStats.paid + analytics.invoiceStats.pending + analytics.invoiceStats.overdue)) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overdue</span>
                  <span className="font-medium text-destructive">${analytics.invoiceStats.overdue.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-destructive" style={{ width: `${(analytics.invoiceStats.overdue / Math.max(1, analytics.invoiceStats.paid + analytics.invoiceStats.pending + analytics.invoiceStats.overdue)) * 100}%` }} />
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Outstanding</span>
                <span className="text-lg font-bold text-foreground">${analytics.invoiceStats.totalOutstanding.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
