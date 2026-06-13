import { Router, type IRouter } from "express";
import { db, invoicesTable, clientsTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListInvoicesQueryParams,
  CreateInvoiceBody,
  GetInvoiceParams,
  UpdateInvoiceParams,
  UpdateInvoiceBody,
  DeleteInvoiceParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function generateInvoiceNumber(): string {
  const now = new Date();
  return `NTS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function calcTotals(items: Array<{ description: string; quantity: number; rate: number; amount: number }>, taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

async function enrichInvoice(invoice: typeof invoicesTable.$inferSelect) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, invoice.clientId));
  let projectName: string | null = null;
  if (invoice.projectId) {
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, invoice.projectId));
    projectName = project?.name ?? null;
  }
  return {
    ...invoice,
    clientName: client?.companyName ?? null,
    projectName,
    items: invoice.items as any[],
    dueDate: invoice.dueDate,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
  };
}

router.get("/invoices", requireAuth, async (req, res): Promise<void> => {
  const qp = ListInvoicesQueryParams.safeParse(req.query);
  const conditions = [];
  if (qp.success && qp.data.clientId) conditions.push(eq(invoicesTable.clientId, qp.data.clientId));
  if (qp.success && qp.data.status) conditions.push(eq(invoicesTable.status, qp.data.status));

  const invoices = await db.select().from(invoicesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(invoicesTable.createdAt);

  const enriched = await Promise.all(invoices.map(enrichInvoice));
  res.json(enriched);
});

router.post("/invoices", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const items = parsed.data.items as Array<{ description: string; quantity: number; rate: number; amount: number }>;
  const taxRate = parsed.data.tax ?? 18;
  const { subtotal, tax, total } = calcTotals(items, taxRate);
  const [invoice] = await db.insert(invoicesTable).values({
    ...parsed.data,
    invoiceNumber: generateInvoiceNumber(),
    items,
    subtotal,
    tax,
    total,
    status: parsed.data.status ?? "draft",
  }).returning();
  res.status(201).json(await enrichInvoice(invoice));
});

router.get("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, params.data.id));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(await enrichInvoice(invoice));
});

router.patch("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: any = { ...parsed.data };
  if (parsed.data.items) {
    const items = parsed.data.items as Array<{ description: string; quantity: number; rate: number; amount: number }>;
    const { subtotal, tax, total } = calcTotals(items, 18);
    updateData.subtotal = subtotal;
    updateData.tax = tax;
    updateData.total = total;
  }
  if (parsed.data.status === "paid" && !parsed.data.paidAt) {
    updateData.paidAt = new Date();
  }
  const [invoice] = await db.update(invoicesTable).set(updateData).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(await enrichInvoice(invoice));
});

router.delete("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [invoice] = await db.delete(invoicesTable).where(eq(invoicesTable.id, params.data.id)).returning();
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
