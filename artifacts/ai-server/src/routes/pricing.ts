import { Router, type IRouter } from "express";
import { EstimatePriceBody } from "@workspace/api-zod";
import { fallbackLLM } from "../lib/llm-fallback.js";

const router: IRouter = Router();

router.post("/pricing/estimate", async (req, res): Promise<void> => {
  const parsed = EstimatePriceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { description, clientType, timeline } = parsed.data;

  const prompt = `You are a senior software consultant at Nexus Tech Solutions, a tech company based in India. 
A client has described their project. Break it down into features and provide an itemized price estimate in INR (Indian Rupees).

The target client is a small business or startup based in a Tier 3 city in India. You must charge realistic, highly budget-friendly rates.
The entire project's total estimate (minEstimate to maxEstimate) MUST strictly be within the range of ₹5,000 to ₹50,000 INR.

Project Description: "${description}"
${clientType ? `Client Type: ${clientType}` : ""}
${timeline ? `Expected Timeline: ${timeline}` : ""}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "summary": "Brief 1-2 sentence summary of the project",
  "projectType": "Web App / Mobile App / API / SaaS / E-commerce / etc.",
  "complexity": "low | medium | high | enterprise",
  "features": [
    {
      "name": "Feature name",
      "description": "What this feature entails",
      "complexity": "low | medium | high",
      "minPrice": 3000,
      "maxPrice": 6000,
      "estimatedDays": 2
    }
  ],
  "totalEstimate": 25000,
  "minEstimate": 20000,
  "maxEstimate": 35000,
  "estimatedWeeks": 3,
  "currency": "INR"
}

Pricing guidelines (INR) for Tier 3 city startups & local businesses:
Determine the pricing tier dynamically based on the client description:
1. Low-Budget Clients (e.g. coaching centers, tuition classes, individual portfolio websites, hobbyists, small local grocery/laundry shops):
   - Total project cost must strictly be within ₹5,000 - ₹15,000.
   - Simple features (form, basic static pages, hero banner): ₹1,000 - ₹3,000
   - Medium features (simple contact/query panel, schedules, listing): ₹3,000 - ₹6,000
   - Complex features (basic email notifications, database listings): ₹6,000 - ₹10,000
2. Medium-Budget Clients (e.g. single-location restaurants, local retail shops, clinics, small service agencies):
   - Total project cost must strictly be within ₹15,000 - ₹30,000.
   - Simple features: ₹2,000 - ₹5,000
   - Medium features: ₹5,000 - ₹10,000
   - Complex features: ₹10,000 - ₹18,000
3. High-Budget Clients (e.g. hotels, schools, colleges, hospitals, multiple-location enterprises, local franchises, resorts):
   - Total project cost must strictly be within ₹30,000 - ₹50,000.
   - Simple features: ₹4,000 - ₹8,000
   - Medium features: ₹8,000 - ₹15,000
   - Complex features (payment integration, reservation portals, booking panels): ₹15,000 - ₹30,000

Be realistic and helpful. Break the project into sub-functionalities (tasks). For a low-budget/short project, provide AT LEAST 8 distinct tasks. For a high-budget/large project, provide between 12 and 20 distinct tasks. Do not just output 2-5 features. Expand them into specific sub-functionalities. The sum of features must align with the chosen budget category (which must be strictly between ₹5,000 and ₹50,000 INR).`;

  try {
    const text = await fallbackLLM(prompt, { maxTokens: 2048, temperature: 0.3 });
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const estimate = JSON.parse(cleaned);

    res.json({ ...estimate, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    if (err.message === "ALL_LLMS_FAILED" || err instanceof SyntaxError) {
      const descLower = description.toLowerCase();
      
      let totalEstimate = 22500;
      let minEstimate = 15000;
      let maxEstimate = 30000;
      let complexity = "medium" as "low" | "medium" | "high";
      let features = [
        { name: "Requirements Analysis", description: "Gathering and analyzing project requirements.", complexity: "low" as "low" | "medium" | "high", minPrice: 1000, maxPrice: 2000, estimatedDays: 1 },
        { name: "UI/UX Design Mockups", description: "Creating basic design layouts and wireframes.", complexity: "medium" as "low" | "medium" | "high", minPrice: 2000, maxPrice: 4000, estimatedDays: 2 },
        { name: "Frontend Development", description: "Developing the user interface with responsive design.", complexity: "medium" as "low" | "medium" | "high", minPrice: 3000, maxPrice: 6000, estimatedDays: 3 },
        { name: "Backend Architecture", description: "Setting up server and database architecture.", complexity: "high" as "low" | "medium" | "high", minPrice: 4000, maxPrice: 8000, estimatedDays: 3 },
        { name: "Core Features Implementation", description: "Implementing main functionalities.", complexity: "high" as "low" | "medium" | "high", minPrice: 3000, maxPrice: 6000, estimatedDays: 4 },
        { name: "API Integrations", description: "Integrating necessary third-party services.", complexity: "medium" as "low" | "medium" | "high", minPrice: 1000, maxPrice: 2000, estimatedDays: 2 },
        { name: "Testing & QA", description: "Quality assurance and bug fixing.", complexity: "low" as "low" | "medium" | "high", minPrice: 1000, maxPrice: 2000, estimatedDays: 2 },
        { name: "Deployment & Handover", description: "Final deployment to production.", complexity: "low" as "low" | "medium" | "high", minPrice: 0, maxPrice: 0, estimatedDays: 1 }
      ];

      // Low-tier adjustment
      if (descLower.includes("coach") || descLower.includes("tution") || descLower.includes("tuition") || descLower.includes("portfolio") || descLower.includes("laundry") || descLower.includes("grocery")) {
        totalEstimate = 10000;
        minEstimate = 6000;
        maxEstimate = 14000;
        complexity = "low";
        features = [
          { name: "Domain & Hosting Setup", description: "Configuring server environment.", complexity: "low" as const, minPrice: 500, maxPrice: 1000, estimatedDays: 1 },
          { name: "Landing Page Design", description: "Single page responsive design.", complexity: "low" as const, minPrice: 1000, maxPrice: 2000, estimatedDays: 1 },
          { name: "About & Services Section", description: "Business info sections.", complexity: "low" as const, minPrice: 1000, maxPrice: 2000, estimatedDays: 1 },
          { name: "Contact Form", description: "Query form with email notifications.", complexity: "low" as const, minPrice: 1000, maxPrice: 2000, estimatedDays: 1 },
          { name: "Mobile Optimization", description: "Ensuring mobile responsiveness.", complexity: "low" as const, minPrice: 1000, maxPrice: 2000, estimatedDays: 1 },
          { name: "Basic SEO Setup", description: "Meta tags and basic SEO structure.", complexity: "low" as const, minPrice: 500, maxPrice: 1000, estimatedDays: 1 },
          { name: "Content Upload", description: "Adding provided text and images.", complexity: "low" as const, minPrice: 500, maxPrice: 2000, estimatedDays: 1 },
          { name: "Go Live & Support", description: "Launch and 1-month basic support.", complexity: "low" as const, minPrice: 500, maxPrice: 2000, estimatedDays: 1 }
        ];
      } 
      // High-tier adjustment
      else if (descLower.includes("hotel") || descLower.includes("school") || descLower.includes("college") || descLower.includes("hospital") || descLower.includes("resort") || descLower.includes("enterprise")) {
        totalEstimate = 40000;
        minEstimate = 30000;
        maxEstimate = 48000;
        complexity = "high";
        features = [
          { name: "Project Discovery & Planning", description: "Detailed scoping.", complexity: "medium" as const, minPrice: 2000, maxPrice: 4000, estimatedDays: 2 },
          { name: "Custom UI/UX Design", description: "Premium customized design screens.", complexity: "high" as const, minPrice: 5000, maxPrice: 8000, estimatedDays: 4 },
          { name: "Database Design & Setup", description: "Complex relational database setup.", complexity: "high" as const, minPrice: 4000, maxPrice: 6000, estimatedDays: 3 },
          { name: "Core Booking/Management Engine", description: "Main application logic.", complexity: "high" as const, minPrice: 8000, maxPrice: 12000, estimatedDays: 6 },
          { name: "Client/User Portal", description: "Secure login and user dashboard.", complexity: "medium" as const, minPrice: 4000, maxPrice: 6000, estimatedDays: 4 },
          { name: "Admin Dashboard", description: "Analytics and control panel.", complexity: "medium" as const, minPrice: 3000, maxPrice: 5000, estimatedDays: 3 },
          { name: "Payment/Notification Integrations", description: "SMS/Email/Payment gateway.", complexity: "high" as const, minPrice: 3000, maxPrice: 5000, estimatedDays: 3 },
          { name: "Security & Final Launch", description: "Penetration testing and deployment.", complexity: "medium" as const, minPrice: 1000, maxPrice: 2000, estimatedDays: 2 }
        ];
      }

      res.json({
        summary: "Basic Project Estimate (Offline Fallback due to high demand)",
        projectType: "Custom Software",
        complexity,
        features,
        totalEstimate,
        minEstimate,
        maxEstimate,
        estimatedWeeks: Math.ceil((features.reduce((acc, f) => acc + f.estimatedDays, 0)) / 5),
        currency: "INR",
        generatedAt: new Date().toISOString()
      });
      return;
    }
    res.status(500).json({ error: "Failed to generate estimate. Please try again." });
  }
});

// ── AGREEMENT GENERATION ─────────────────────────────────────────────────
router.post("/pricing/agreement", async (req, res): Promise<void> => {
  const { clientName, clientEmail, companyName, clientAddress, selectedPlan, finalPrice, estimate } = req.body;

  if (!clientName || !clientEmail || !companyName || !selectedPlan || !finalPrice || !estimate) {
    res.status(400).json({ error: "Missing required fields: clientName, clientEmail, companyName, selectedPlan, finalPrice, estimate" });
    return;
  }

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const featureList = estimate.features?.map((f: any) => `- ${f.name}: ${f.description} (${f.complexity} complexity, ~${f.estimatedDays} days, ₹${f.minPrice?.toLocaleString()}-₹${f.maxPrice?.toLocaleString()})`).join("\n") || "- Custom project features as discussed";
  const totalWeeks = estimate.estimatedWeeks || 4;
  const advanceAmount = Math.round(finalPrice * 0.5);

  const prompt = `You are a professional tech agency contract writer for Nexus Tech Solutions, India.
Generate 4 separate professional documents in Markdown format for a software development project contract.

Client Details:
- Name: ${clientName}
- Email: ${clientEmail}
- Company: ${companyName}
- Address: ${clientAddress || "Not provided"}

Project Details:
- Selected Plan: ${selectedPlan}
- Final Price: ₹${finalPrice.toLocaleString()} INR
- Advance (50%): ₹${advanceAmount.toLocaleString()} INR
- Project Type: ${estimate.projectType || "Custom Software"}
- Complexity: ${estimate.complexity || "medium"}
- Timeline: ${totalWeeks} weeks (±7 days)
- Summary: ${estimate.summary}
- Features:
${featureList}

Generate the following 4 documents in this EXACT JSON format (no markdown wrapper, just raw JSON):
{
  "serviceAgreement": "Full markdown service agreement with sections: Header, Parties, Project Scope, Payment Terms (50% advance, milestone payments), Delivery Timeline (+-7 days), Responsibilities (both parties), Revisions Policy (2 free revisions for basic, 5 for pro, unlimited for elite), Refund Policy, Intellectual Property, Confidentiality, Termination, Force Majeure, Dispute Resolution, Signatures section",
  "featureSpec": "Full markdown feature specification with: Project Overview, Technical Architecture, Module-wise Feature List with descriptions, User Roles & Permissions, Integration Requirements, Database Schema (high level), API Endpoints (high level), UI/UX Requirements, Testing Requirements",
  "userStories": "Full markdown user stories document with: Personas, Epic-level stories, Detailed user stories in 'As a [role], I want to [action], so that [benefit]' format grouped by module, Acceptance Criteria for each story, Priority levels",
  "commercialProposal": "Full markdown commercial proposal with: Executive Summary, Company Introduction (Nexus Tech Solutions), Proposed Solution, Detailed Pricing Breakdown by feature, Payment Milestones (4 milestones: 50% advance, 20% at mid-delivery, 20% at testing, 10% at final delivery), Timeline with Gantt-style text table, Post-Delivery Support (30 days free), Maintenance Plans, Terms & Conditions"
}

IMPORTANT: Each value must be a complete, professional markdown document formatted as formal paragraphs and letters. Do NOT use any emojis. Avoid excessive tables and use formal letter structures instead.
The service agreement must look like a real, serious legal contract.
The date is ${formattedDate}.
RESPOND ONLY WITH VALID JSON.`;

  try {
    const text = await fallbackLLM(prompt, { maxTokens: 8192, temperature: 0.4 });
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Forcefully strip emojis from the string before parsing
    const noEmojis = cleaned.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    
    const docs = JSON.parse(noEmojis);

    res.json({
      serviceAgreement: docs.serviceAgreement || "",
      featureSpec: docs.featureSpec || "",
      userStories: docs.userStories || "",
      commercialProposal: docs.commercialProposal || "",
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    // Comprehensive fallback documents
    const serviceAgreement = `# Service Agreement

## Nexus Tech Solutions — Software Development Contract

**Agreement Date:** ${formattedDate}
**Agreement Reference:** NTS-${Date.now().toString(36).toUpperCase()}

---

## 1. Parties

**Service Provider (Developer):**
Company: Nexus Tech Solutions
Registered Address: India

**Client:**
Name: ${clientName}
Email: ${clientEmail}
Company: ${companyName}
${clientAddress ? `Address: ${clientAddress}` : ""}

---

## 2. Project Scope

This agreement covers the development of a ${estimate.projectType || "Custom Software Application"} as described below:

${estimate.summary}

### Selected Plan: ${selectedPlan.toUpperCase()}

### Features Included:

${estimate.features?.map((f: any, i: number) => `${i + 1}. ${f.name} — ${f.description} (${f.complexity} complexity, ~${f.estimatedDays} days)`).join("\n") || "As discussed and agreed upon"}

---

## 3. Payment Terms

Total Project Cost: INR ${finalPrice.toLocaleString()}
Advance Payment (50%): INR ${advanceAmount.toLocaleString()}
Mid-Delivery (20%): INR ${Math.round(finalPrice * 0.2).toLocaleString()}
Testing Phase (20%): INR ${Math.round(finalPrice * 0.2).toLocaleString()}
Final Delivery (10%): INR ${Math.round(finalPrice * 0.1).toLocaleString()}

Important Note: Work begins only after the advance payment of INR ${advanceAmount.toLocaleString()} is received.

Payment Mode: UPI / Bank Transfer / Online Payment

---

## 4. Delivery Timeline

Estimated Duration: ${totalWeeks} weeks (+-7 days)
Start Date: Upon receipt of advance payment
Delivery Buffer: +-7 calendar days from estimated completion

### Milestone Schedule:

Kick-off (Week 1): Requirements finalization, wireframes
Mid-Delivery (Week ${Math.ceil(totalWeeks / 2)}): Core features demo
Testing (Week ${totalWeeks - 1}): Full testing and bug fixes
Final Delivery (Week ${totalWeeks}): Production deployment

---

## 5. Responsibilities

### Developer Responsibilities:
The developer agrees to deliver the project as per the agreed scope and timeline, provide regular progress updates, fix bugs identified during the testing phase, provide ${selectedPlan === "basic" ? "2" : selectedPlan === "pro" ? "5" : "unlimited"} rounds of revisions, and deliver documentation for the final product.

### Client Responsibilities:
The client agrees to provide clear and complete requirements, respond to queries within 48 hours, provide timely feedback on deliverables, make payments as per the agreed schedule, and provide necessary content (text, images, logos).

---

## 6. Revisions Policy

Current Plan (${selectedPlan}): ${selectedPlan === "basic" ? "2 free revisions" : selectedPlan === "pro" ? "5 free revisions" : "Unlimited revisions"}
Any additional revisions beyond the included quota will incur extra charges as per standard company policy.

---

## 7. Refund Policy

Before development starts: 100% refund (minus processing fees).
After wireframe approval: 50% refund.
After mid-delivery: No refund (work delivered is non-refundable).
Advance payment is non-refundable once development has commenced beyond the initial wireframe stage.

---

## 8. Intellectual Property

All source code, designs, and deliverables become the exclusive property of the Client upon full payment. Nexus Tech Solutions retains the right to showcase the project in its portfolio (without sharing source code). Third-party libraries/frameworks remain under their respective licenses.

---

## 9. Confidentiality

Both parties agree to keep all project-related information confidential. Neither party shall disclose any proprietary information to third parties without written consent.

---

## 10. Termination

Either party may terminate this agreement with 15 days written notice. The client will be liable to pay for work completed up to the termination date. All deliverables completed up to that point will be handed over to the client.

---

## 11. Force Majeure

Neither party shall be liable for delays caused by circumstances beyond their reasonable control, including natural disasters, pandemics, government actions, and similar events.

---

## 12. Dispute Resolution

Any disputes shall be resolved through mutual discussion first. If unresolved, disputes shall be subject to arbitration in India under the Arbitration and Conciliation Act, 1996.

---

## 13. Acceptance

By proceeding with this agreement, both parties acknowledge and accept all terms and conditions stated above.

Service Provider: Nexus Tech Solutions
Client: ${clientName} (${companyName})
Date: ${formattedDate}
Signature: _________________

---

*This is a computer-generated document. Digital acceptance is considered valid.*
*Generated by Nexus Tech Solutions on ${formattedDate}*`;

    const featureSpec = `# Project Requirement and Feature Specification

## ${estimate.projectType || "Custom Software Application"} — ${companyName}

**Prepared for:** ${clientName} (${companyName})
**Date:** ${formattedDate}
**Plan:** ${selectedPlan.toUpperCase()}

---

## 1. Project Overview

${estimate.summary}

Project Type: ${estimate.projectType || "Custom Software"}
Complexity: ${(estimate.complexity || "medium").toUpperCase()}
Estimated Duration: ${totalWeeks} weeks

---

## 2. Feature Breakdown

${estimate.features?.map((f: any, i: number) => `### ${i + 1}. ${f.name}

${f.description}

Complexity: ${f.complexity}
Estimated Days: ~${f.estimatedDays} days
Price Range: INR ${f.minPrice?.toLocaleString()} - INR ${f.maxPrice?.toLocaleString()}

`).join("\n---\n\n") || "Features as discussed."}

---

## 3. Technical Requirements

Frontend: Modern responsive web application
Backend: RESTful API architecture
Database: As per project requirements
Hosting: Cloud-ready deployment
Security: SSL, data encryption, secure authentication

---

## 4. User Roles

Admin: Full Access - Manage all aspects of the application
User: Standard Access - Core features access
Guest: Limited Access - View-only public content

---

## 5. Deliverables

- Complete source code
- Database schema and migrations
- API documentation
- User manual and operational guide
- Deployment to the production server

---

*Generated by Nexus Tech Solutions on ${formattedDate}*`;

    const userStories = `# User Stories and Workflow Document

## ${estimate.projectType || "Custom Software"} — ${companyName}

**Prepared for:** ${clientName}
**Date:** ${formattedDate}

---

## Personas

Admin: System administrator with full control.
End User: Primary user of the application.
Guest: Unauthenticated visitor.

---

## User Stories by Feature

${estimate.features?.map((f: any, i: number) => `### Epic ${i + 1}: ${f.name}

Story ${i + 1}.1: As an admin, I want to manage ${f.name.toLowerCase()}, so that I can control the application effectively.
Acceptance Criteria: Admin can create, read, update, and delete related items.
Priority: High

Story ${i + 1}.2: As a user, I want to access ${f.name.toLowerCase()}, so that I can use the core functionality.
Acceptance Criteria: User can interact with the feature as designed without encountering errors.
Priority: High

Story ${i + 1}.3: As a user, I want to receive feedback on my actions in ${f.name.toLowerCase()}, so that I know the system is responding.
Acceptance Criteria: Clear success or error messages are displayed following user actions.
Priority: Medium

`).join("\n---\n\n") || "User stories to be defined based on detailed requirements."}

---

## Workflow Summary

1. Onboarding: User registration and login procedures.
2. Core Usage: Access and interaction with the main features of the application.
3. Management: Admin controls, settings, and application governance.
4. Reporting: Viewing analytics, summaries, and exporting data.

---

*Generated by Nexus Tech Solutions on ${formattedDate}*`;

    const commercialProposal = `# Commercial Proposal and Payment Terms

## Nexus Tech Solutions — Project Proposal

**Prepared for:** ${clientName} (${companyName})
**Date:** ${formattedDate}
**Validity:** 30 days from date of issue

---

## 1. Executive Summary

Nexus Tech Solutions proposes to develop a ${estimate.projectType || "Custom Software Application"} for ${companyName}. This proposal outlines the comprehensive project scope, financial pricing, execution timeline, and formal terms of engagement.

${estimate.summary}

---

## 2. About Nexus Tech Solutions

Nexus Tech Solutions is a technology firm specializing in custom software development, web applications, and comprehensive digital solutions. We serve startups, small businesses, and enterprises with cost-effective, high-quality, and scalable technical solutions.

---

## 3. Proposed Solution

Selected Plan: ${selectedPlan.toUpperCase()}

Project Type: ${estimate.projectType || "Custom Software"}
Complexity: ${(estimate.complexity || "medium").toUpperCase()}
Timeline: ${totalWeeks} weeks (+-7 days)
Total Cost: INR ${finalPrice.toLocaleString()}

---

## 4. Payment Milestones

Advance Payment (50%): INR ${advanceAmount.toLocaleString()} (Trigger: Project kick-off)
Mid-Delivery (20%): INR ${Math.round(finalPrice * 0.2).toLocaleString()} (Trigger: Core features demonstration)
Testing Phase (20%): INR ${Math.round(finalPrice * 0.2).toLocaleString()} (Trigger: User Acceptance Testing sign-off)
Final Delivery (10%): INR ${Math.round(finalPrice * 0.1).toLocaleString()} (Trigger: Final production deployment)

Total Project Value: INR ${finalPrice.toLocaleString()}

---

## 5. Project Timeline

Phase 1 (Planning): Requirements gathering, wireframes, and architecture mapping.
Phase 2 (Development 1): Implementation of core features.
Phase 3 (Development 2): Integration of advanced features and external systems.
Phase 4 (Testing): Quality assurance, bug fixing, and performance optimization.
Phase 5 (Deployment): Production launch and final client handover.

---

## 6. Post-Delivery Support

Bug fixes and minor updates will be provided free of charge for the first 30 days post-launch. Following this period, optional maintenance plans are available to ensure the continuous operational health of the application. Any feature modifications outside the initial scope will be evaluated and charged accordingly.

---

## 7. Terms and Conditions

1. This proposal remains valid for 30 days from ${formattedDate}.
2. All financial figures are in Indian Rupees (INR) and are exclusive of applicable taxes.
3. Project execution commences strictly upon receipt of the advance payment.
4. Any alterations to the project scope will necessitate formal discussion and may incur additional charges.
5. Intellectual property rights for the developed code transfer entirely to the client upon full and final payment.

---

## 8. Next Steps

1. Review and approve this proposal.
2. Sign the formal Service Agreement.
3. Process the advance payment of INR ${advanceAmount.toLocaleString()}.
4. Project kick-off and initial requirements finalization.

---

**Contact Information:**
Nexus Tech Solutions
Email: hello@nexustech.in

---

*Generated by Nexus Tech Solutions on ${formattedDate}*`;

    res.json({
      serviceAgreement,
      featureSpec,
      userStories,
      commercialProposal,
      generatedAt: new Date().toISOString()
    });
  }
});

export default router;
