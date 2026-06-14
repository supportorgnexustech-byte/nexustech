import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";
import { ClientModel, ProjectModel, InvoiceModel } from "@workspace/db";

const router: IRouter = Router();

router.post("/pricing/estimate", requireAuth, async (req, res): Promise<void> => {
  try {
    const aiServerUrl = process.env.AI_SERVER_URL || "http://localhost:5050";
    const response = await fetch(`${aiServerUrl}/api/pricing/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    logger.error({ err }, "Failed to proxy pricing request to ai-server");
    res.status(502).json({ error: "AI service temporarily unavailable." });
  }
});

router.post("/pricing/agreement", requireAuth, async (req, res): Promise<void> => {
  try {
    const aiServerUrl = process.env.AI_SERVER_URL || "http://localhost:5050";
    const response = await fetch(`${aiServerUrl}/api/pricing/agreement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    logger.error({ err }, "Failed to proxy agreement request to ai-server");
    res.status(502).json({ error: "AI service temporarily unavailable." });
  }
});

router.post("/pricing/sign", requireAuth, async (req, res): Promise<void> => {
  try {
    const { clientName, clientEmail, companyName, finalPrice, agreementHtml, selectedPlan, projectDescription, featuresList } = req.body;

    if (!clientName || !clientEmail || !companyName || !finalPrice) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // 1. Create or Find Client
    let client = await ClientModel.findOne({ contactEmail: clientEmail });
    if (!client) {
      client = await ClientModel.create({
        companyName,
        businessType: "Software Development",
        contactName: clientName,
        contactEmail: clientEmail,
        status: "active",
      });
    }

    // 2. Create Project
    const project = await ProjectModel.create({
      name: `${companyName} - ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`,
      description: projectDescription || `Software development project based on ${selectedPlan} plan.`,
      clientId: client._id.toString(),
      status: "planning",
      priority: "high",
      startDate: new Date().toISOString(),
      budget: finalPrice,
      featuresList: featuresList || [],
    });

    // 3. Create Invoice for the 50% Advance
    const advanceAmount = Math.round(finalPrice * 0.5);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    const remainingAmount = finalPrice - advanceAmount;

    const invoice = await InvoiceModel.create({
      invoiceNumber,
      clientId: client._id.toString(),
      projectId: project._id.toString(),
      status: "draft",
      subtotal: finalPrice,
      tax: 0,
      total: finalPrice,
      dueDate: dueDate.toISOString(),
      notes: "Software Development Agreement. 50% Advance, 50% on Completion.",
      items: [
        {
          id: Math.random().toString(36).substring(7),
          description: `Advance Payment (50%) - ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`,
          quantity: 1,
          rate: advanceAmount,
          amount: advanceAmount,
        },
        {
          id: Math.random().toString(36).substring(7),
          description: `Completion Payment (50%) - Due upon delivery`,
          quantity: 1,
          rate: remainingAmount,
          amount: remainingAmount,
        }
      ]
    });

    res.json({
      success: true,
      clientId: client._id.toString(),
      projectId: project._id.toString(),
      invoiceId: invoice._id.toString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to sign agreement and create records");
    res.status(500).json({ error: "Failed to process signed agreement." });
  }
});

export default router;
