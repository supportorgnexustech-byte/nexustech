import { Router, type IRouter } from "express";
import { InvoiceModel, ProjectModel, ClientModel, ResourceModel, TaskModel } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/analytics/dashboard", requireAuth, async (_req, res): Promise<void> => {
  const [projects, clients, invoices, resources] = await Promise.all([
    ProjectModel.find().lean(),
    ClientModel.find().lean(),
    InvoiceModel.find().lean(),
    ResourceModel.find().lean(),
  ]);

  const activeProjects = projects.filter(p => p.status === "active").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const totalClients = clients.length;
  const totalDevHours = resources.filter(r => r.type === "dev_hours").reduce((s, r) => s + r.quantity, 0);

  const paidInvoices = invoices.filter(i => i.status === "paid");
  const pendingInvoices = invoices.filter(i => i.status === "sent");
  const overdueInvoices = invoices.filter(i => i.status === "overdue");

  const paid = paidInvoices.reduce((s, i) => s + i.total, 0);
  const pending = pendingInvoices.reduce((s, i) => s + i.total, 0);
  const overdue = overdueInvoices.reduce((s, i) => s + i.total, 0);
  const totalRevenue = paid;
  const totalOutstanding = pending + overdue;

  // Resource breakdown
  const typeMap = new Map<string, number>();
  for (const r of resources) {
    typeMap.set(r.type as string, (typeMap.get(r.type as string) ?? 0) + r.totalCost);
  }
  const totalResourceCost = Array.from(typeMap.values()).reduce((s, v) => s + v, 0);
  const resourceBreakdown = Array.from(typeMap.entries()).map(([type, totalCost]) => ({
    type,
    totalCost,
    percentage: totalResourceCost > 0 ? Math.round((totalCost / totalResourceCost) * 100) : 0,
  }));

  // Recent activity
  const recentActivity: Array<{ id: string; type: string; message: string; timestamp: Date; entityId: string | null }> = [];
  const recentProjects = projects.slice(-3).reverse();
  for (const p of recentProjects) {
    recentActivity.push({ id: p._id.toString() + "p", type: "project", message: `Project "${p.name}" is ${p.status}`, timestamp: p.createdAt as Date, entityId: p._id.toString() });
  }
  const recentInvoices = invoices.slice(-3).reverse();
  for (const inv of recentInvoices) {
    recentActivity.push({ id: inv._id.toString() + "i", type: "invoice", message: `Invoice ${inv.invoiceNumber} marked as ${inv.status}`, timestamp: inv.createdAt as Date, entityId: inv._id.toString() });
  }
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    totalRevenue, activeProjects, completedProjects, totalClients, totalDevHours,
    invoiceStats: { paid, pending, overdue, totalOutstanding },
    recentActivity: recentActivity.slice(0, 10).map(a => ({ ...a, timestamp: a.timestamp.toISOString() })),
    resourceBreakdown,
  });
});

router.get("/analytics/revenue", requireAuth, async (_req, res): Promise<void> => {
  const invoices = await InvoiceModel.find().lean();
  const resources = await ResourceModel.find().lean();

  // Build last 6 months
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const data = months.map(month => {
    const revenue = invoices
      .filter(i => i.status === "paid" && (i.createdAt as Date).toISOString().startsWith(month))
      .reduce((s, i) => s + i.total, 0);
    const expenses = resources
      .filter(r => r.date.startsWith(month))
      .reduce((s, r) => s + r.totalCost, 0);
    return { month, revenue, expenses };
  });

  res.json(data);
});

export default router;
