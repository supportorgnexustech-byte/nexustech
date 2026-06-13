import React from "react";
import { useGetDashboardAnalytics, useGetRevenueAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, IndianRupee, Users, Briefcase } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar, LabelList,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const fmt = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(0)}K`
    : `₹${n}`;

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

  const pieData = dashboard?.resourceBreakdown?.map(r => ({
    name: r.type.replace("_", " "),
    value: r.totalCost,
    pct: r.percentage,
  })) ?? [];

  const invoiceData = dashboard
    ? [
        { name: "Paid", value: dashboard.invoiceStats.paid, fill: "#10b981" },
        { name: "Pending", value: dashboard.invoiceStats.pending, fill: "#f59e0b" },
        { name: "Overdue", value: dashboard.invoiceStats.overdue, fill: "#ef4444" },
      ]
    : [];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Business performance and financial metrics.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: fmt(dashboard?.totalRevenue ?? 0), icon: IndianRupee, color: "text-emerald-400" },
          { label: "Active Projects", value: dashboard?.activeProjects ?? 0, icon: Briefcase, color: "text-blue-400" },
          { label: "Total Clients", value: dashboard?.totalClients ?? 0, icon: Users, color: "text-violet-400" },
          { label: "Outstanding", value: fmt(dashboard?.invoiceStats.totalOutstanding ?? 0), icon: TrendingUp, color: "text-amber-400" },
        ].map((k) => (
          <Card key={k.label} className="bg-card/50 border-white/10">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </div>
              <k.icon className={`w-8 h-8 ${k.color} opacity-70`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Line Chart */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Revenue vs Expenses (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenue ?? []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} width={60} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(v: number) => [fmt(v), ""]}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Expenses" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resource Cost Breakdown Pie */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Resource Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", borderRadius: 8 }}
                    formatter={(v: number) => [fmt(v), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm capitalize text-foreground">{d.name}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Bar Chart */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Invoice Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={invoiceData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} width={60} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", borderRadius: 8 }}
                  formatter={(v: number) => [fmt(v), "Amount"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {invoiceData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                  <LabelList dataKey="value" position="top" formatter={(v: number) => fmt(v)} style={{ fill: "#94a3b8", fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[220px] overflow-y-auto">
              {dashboard?.recentActivity.map((a) => (
                <div key={a.id} className="flex gap-3 items-start pb-3 border-b border-white/5 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{a.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {!dashboard?.recentActivity.length && (
                <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
