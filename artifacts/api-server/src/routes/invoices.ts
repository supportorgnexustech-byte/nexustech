import { Router, type IRouter } from "express";
import { InvoiceModel, ClientModel, ProjectModel } from "@workspace/db";
import {
  ListInvoicesQueryParams,
  CreateInvoiceBody,
  GetInvoiceParams,
  UpdateInvoiceParams,
  UpdateInvoiceBody,
  DeleteInvoiceParams,
  RecordInvoicePaymentParams,
  RecordInvoicePaymentBody,
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

async function enrichInvoice(invoice: any) {
  const client = await ClientModel.findById(invoice.clientId).lean();
  let projectName: string | null = null;
  if (invoice.projectId) {
    const project = await ProjectModel.findById(invoice.projectId).lean();
    projectName = project?.name ?? null;
  }
  return {
    ...invoice,
    id: invoice._id.toString(),
    clientName: client?.companyName ?? null,
    projectName,
    items: invoice.items as any[],
    paidAt: invoice.paidAt ?? null,
  };
}

router.get("/invoices", requireAuth, async (req, res): Promise<void> => {
  const qp = ListInvoicesQueryParams.safeParse(req.query);
  const conditions: any = {};
  if (qp.success && qp.data.clientId) conditions.clientId = qp.data.clientId.toString();
  if (qp.success && qp.data.status) conditions.status = qp.data.status;

  const invoices = await InvoiceModel.find(conditions).sort({ createdAt: 1 }).lean();
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
  
  const invoice = await InvoiceModel.create({
    ...parsed.data,
    invoiceNumber: generateInvoiceNumber(),
    items,
    subtotal, tax, total,
    amountPaid: 0,
    amountPending: total,
    status: parsed.data.status ?? "draft",
  });
  res.status(201).json(await enrichInvoice(invoice.toObject()));
});

router.get("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const invoice = await InvoiceModel.findById(params.data.id).lean();
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json(await enrichInvoice(invoice));
  } catch (err) {
    res.status(404).json({ error: "Invoice not found" });
  }
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
    // Calculate pending based on previous payments
    const existingInvoice = await InvoiceModel.findById(params.data.id).lean();
    if (existingInvoice) {
      updateData.amountPaid = existingInvoice.amountPaid || 0;
      updateData.amountPending = total - updateData.amountPaid;
    }
  }
  if (parsed.data.status === "paid" && !parsed.data.paidAt) {
    updateData.paidAt = new Date().toISOString();
  }
  try {
    const invoice = await InvoiceModel.findByIdAndUpdate(params.data.id, updateData, { new: true }).lean();
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.json(await enrichInvoice(invoice));
  } catch (err) {
    res.status(404).json({ error: "Invoice not found" });
  }
});

router.delete("/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const invoice = await InvoiceModel.findByIdAndDelete(params.data.id).lean();
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    res.status(404).json({ error: "Invoice not found" });
  }
});

router.post("/invoices/:id/payment", requireAuth, async (req, res): Promise<void> => {
  const params = RecordInvoicePaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RecordInvoicePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    const invoice = await InvoiceModel.findById(params.data.id);
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const receiptNumber = `RCPT-${Date.now()}`;
    const newPayment = {
      amount: parsed.data.amount,
      method: parsed.data.method,
      date: parsed.data.date,
      receiptNumber
    };

    invoice.advancePayments = invoice.advancePayments || [];
    invoice.advancePayments.push(newPayment);

    // Calculate totals
    const totalPaid = invoice.advancePayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    invoice.amountPaid = totalPaid;
    invoice.amountPending = invoice.total - totalPaid;

    if (invoice.amountPending <= 0 && invoice.status !== "paid") {
      invoice.status = "paid";
      invoice.paidAt = new Date().toISOString();
      invoice.amountPending = 0; // ensure it doesn't go negative
    }

    await invoice.save();
    res.json(await enrichInvoice(invoice.toObject()));
  } catch (err) {
    console.error("Error recording payment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
