import React, { useState, useRef } from "react";
import { useEstimatePrice, useGenerateAgreement, useSignAgreement, PricingEstimate, AgreementResponse } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calculator, Zap, CheckCircle2, FileText, User, Building2, Mail, MapPin, Crown, Star, Shield, Download, Eye, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Step = "estimate" | "client-details" | "plan-select" | "preview";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    icon: Shield,
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    multiplier: 1.0,
    features: [
      "Core feature development",
      "Responsive design",
      "2 revision rounds",
      "Basic documentation",
      "30-day bug support",
      "Email support"
    ],
    revisions: "2 rounds",
    support: "Email only"
  },
  {
    id: "pro",
    name: "Pro",
    icon: Star,
    color: "from-violet-500 to-purple-500",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-400",
    multiplier: 1.35,
    popular: true,
    features: [
      "Everything in Basic",
      "Advanced integrations",
      "5 revision rounds",
      "Complete documentation",
      "60-day priority support",
      "WhatsApp + Email support",
      "Performance optimization",
      "SEO setup"
    ],
    revisions: "5 rounds",
    support: "Priority (WhatsApp + Email)"
  },
  {
    id: "elite",
    name: "Elite",
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    multiplier: 1.75,
    features: [
      "Everything in Pro",
      "Premium UI/UX design",
      "Unlimited revisions",
      "Full technical documentation",
      "90-day dedicated support",
      "24/7 phone + WhatsApp support",
      "CI/CD pipeline setup",
      "Security audit",
      "Load testing",
      "Dedicated project manager"
    ],
    revisions: "Unlimited",
    support: "Dedicated 24/7"
  }
];

export default function Pricing() {
  const [step, setStep] = useState<Step>("estimate");
  const [description, setDescription] = useState("");
  const [estimate, setEstimate] = useState<PricingEstimate | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [agreementDocs, setAgreementDocs] = useState<AgreementResponse | null>(null);
  const [activeDocTab, setActiveDocTab] = useState("serviceAgreement");

  // Client details
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  
  // Discount
  const [discountAmount, setDiscountAmount] = useState("");

  const estimateMutation = useEstimatePrice();
  const agreementMutation = useGenerateAgreement();
  const signMutation = useSignAgreement();
  const [, setLocation] = useLocation();
  const printRef = useRef<HTMLDivElement>(null);

  const handleEstimate = async () => {
    if (!description.trim()) return;
    try {
      const result = await estimateMutation.mutateAsync({ data: { description } });
      setEstimate(result);
      setStep("client-details");
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAgreement = async () => {
    if (!estimate || !selectedPlan || !clientName || !clientEmail || !companyName) return;
    const plan = PLANS.find(p => p.id === selectedPlan);
    const basePrice = Math.round(estimate.totalEstimate * (plan?.multiplier || 1));
    const discount = parseFloat(discountAmount) || 0;
    const finalPrice = Math.max(0, basePrice - discount);

    try {
      const result = await agreementMutation.mutateAsync({
        data: {
          clientName,
          clientEmail,
          companyName,
          clientAddress: clientAddress || undefined,
          selectedPlan,
          finalPrice,
          estimate
        }
      });
      setAgreementDocs(result);
      setStep("preview");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignAndSave = async () => {
    if (!estimate || !selectedPlan || !clientName || !clientEmail || !companyName || !agreementDocs) return;
    const plan = PLANS.find(p => p.id === selectedPlan);
    const basePrice = Math.round(estimate.totalEstimate * (plan?.multiplier || 1));
    const discount = parseFloat(discountAmount) || 0;
    const finalPrice = Math.max(0, basePrice - discount);

    try {
      const result = await signMutation.mutateAsync({
        data: {
          clientName,
          clientEmail,
          companyName,
          finalPrice,
          selectedPlan,
          projectDescription: description,
          agreementHtml: agreementDocs.serviceAgreement,
          featuresList: estimate.features?.map((f, i) => ({
            id: `feat-${i}-${Date.now()}`,
            title: f.name,
            completed: false
          })) || [],
        }
      });
      
      if (result.success) {
        setLocation(`/invoices`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadDoc = (docType: string) => {
    if (!agreementDocs) return;
    const content = (agreementDocs as any)[docType] || "";
    if (!content) return;
    
    const titles: Record<string, string> = {
      serviceAgreement: "Service_Agreement",
      featureSpec: "Feature_Specification",
      userStories: "User_Stories",
      commercialProposal: "Commercial_Proposal"
    };
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titles[docType] || "Document"}_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDownloadAll = () => {
    if (!agreementDocs) return;
    ["serviceAgreement", "featureSpec", "userStories", "commercialProposal"].forEach((key, i) => {
      setTimeout(() => {
        handleDownloadDoc(key);
      }, i * 300); // Stagger downloads to prevent browser blocking
    });
  };

  const handlePrintPDF = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${companyName} - Contract Documents</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', -apple-system, sans-serif;
            line-height: 1.7;
            color: #1a1a2e;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
          }
          h1 { font-size: 22px; margin: 28px 0 12px; color: #16213e; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          h2 { font-size: 18px; margin: 22px 0 10px; color: #1a1a2e; }
          h3 { font-size: 15px; margin: 18px 0 8px; color: #334155; }
          p { margin: 8px 0; font-size: 13px; }
          ul, ol { margin: 8px 0 8px 20px; font-size: 13px; }
          li { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          tr:nth-child(even) { background: #f8fafc; }
          blockquote { border-left: 3px solid #6366f1; padding: 8px 16px; margin: 12px 0; background: #f8fafc; font-style: italic; font-size: 13px; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
          strong { color: #1e293b; }
          code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
          .page-break { page-break-before: always; }
          @media print {
            body { padding: 20px; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const currentPlan = PLANS.find(p => p.id === selectedPlan);
  const finalPrice = estimate ? Math.round(estimate.totalEstimate * (currentPlan?.multiplier || 1)) : 0;

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
           AI Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate estimates, select a plan, and create professional contracts.
          </p>
        </div>
        {step !== "estimate" && (
          <Button
            variant="outline"
            onClick={() => {
              if (step === "client-details") setStep("estimate");
              else if (step === "plan-select") setStep("client-details");
              else if (step === "preview") setStep("plan-select");
            }}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { key: "estimate", label: "Estimate", icon: Calculator },
          { key: "client-details", label: "Client Details", icon: User },
          { key: "plan-select", label: "Select Plan", icon: Crown },
          { key: "preview", label: "Contract", icon: FileText },
        ].map((s, i) => {
          const stepOrder = ["estimate", "client-details", "plan-select", "preview"];
          const currentIndex = stepOrder.indexOf(step);
          const thisIndex = stepOrder.indexOf(s.key);
          const isActive = step === s.key;
          const isDone = thisIndex < currentIndex;
          return (
            <React.Fragment key={s.key}>
              {i > 0 && (
                <div className={`flex-1 h-0.5 transition-colors duration-300 ${isDone ? "bg-primary" : "bg-white/10"}`} />
              )}
              <button
                onClick={() => {
                  if (isDone) setStep(s.key as Step);
                }}
                disabled={!isDone}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : isDone
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : "bg-white/5 text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <s.icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* ──────────────────── STEP 1: ESTIMATE ──────────────────── */}
      {step === "estimate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card/50 border-white/10 h-fit">
            <CardHeader>
              <CardTitle>Project Requirements</CardTitle>
              <CardDescription>Describe the project in as much detail as possible. The AI will extract features, complexity, and estimate costs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                id="project-description"
                placeholder="e.g. We need a SaaS platform for property management. It should have user authentication with 3 roles (admin, landlord, tenant). There needs to be a dashboard showing rent collection stats..."
                className="min-h-[250px] bg-black/20 border-white/10"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button
                id="generate-estimate-btn"
                className="w-full"
                onClick={handleEstimate}
                disabled={estimateMutation.isPending || !description.trim()}
              >
                {estimateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Generate Estimate
              </Button>
            </CardContent>
          </Card>

          <div className="h-full border border-white/5 border-dashed rounded-xl bg-card/20 flex flex-col items-center justify-center text-center p-8 text-muted-foreground min-h-[400px]">
            {estimateMutation.isPending ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Content is Loading...</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">Preparing scripts and analyzing your requirements to generate a comprehensive plan.</p>
              </div>
            ) : (
              <>
                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-foreground mb-1">Awaiting Description</h3>
                <p className="text-sm max-w-[250px] mb-8">Enter project details on the left to generate an AI-powered pricing estimate.</p>
                <img src="/assets/robo ai.svg" alt="Robo AI Mascot" className="w-32 h-32 object-contain opacity-75" />
              </>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────── STEP 2: CLIENT DETAILS ──────────────────── */}
      {step === "client-details" && estimate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Estimate Summary (compact) */}
          <Card className="bg-primary/5 border-primary/20 h-fit">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Estimate Summary</h2>
                  <p className="text-sm text-muted-foreground">{estimate.projectType}</p>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize px-3 py-1 text-sm">
                  {estimate.complexity} Complexity
                </Badge>
              </div>

              <p className="text-sm leading-relaxed text-foreground/80 mb-4">{estimate.summary}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Estimated Cost</p>
                  <p className="text-2xl font-bold text-foreground">
                    {estimate.currency} {estimate.totalEstimate.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                  <p className="text-2xl font-bold text-foreground">
                    {estimate.estimatedWeeks} <span className="text-base text-muted-foreground font-normal">weeks</span>
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              <h3 className="text-sm font-semibold mb-3">Features ({estimate.features.length})</h3>
              <div className="space-y-2">
                {estimate.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{feature.name}</span>
                      <span className="text-muted-foreground"> — {feature.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Client Details Form */}
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Client Details
              </CardTitle>
              <CardDescription>Enter the client information for the contract.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="client-name" className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Client Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="client-name"
                  placeholder="John Doe"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="bg-black/20 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email" className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Client Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="john@company.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="bg-black/20 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name" className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Company Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="company-name"
                  placeholder="ACME Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-black/20 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-address" className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  Address <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="client-address"
                  placeholder="123 Main St, City, State, PIN"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="bg-black/20 border-white/10 min-h-[80px]"
                />
              </div>

              <Button
                id="proceed-to-plan-btn"
                className="w-full mt-2"
                onClick={() => setStep("plan-select")}
                disabled={!clientName.trim() || !clientEmail.trim() || !companyName.trim()}
              >
                Continue to Plan Selection
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ──────────────────── STEP 3: PLAN SELECTION ──────────────────── */}
      {step === "plan-select" && estimate && (
        <div className="space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-foreground">Choose Your Plan</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a plan for <span className="text-primary font-medium">{companyName}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const planPrice = Math.round(estimate.totalEstimate * plan.multiplier);
              const isSelected = selectedPlan === plan.id;
              return (
                <Card
                  key={plan.id}
                  id={`plan-${plan.id}`}
                  className={`relative cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    isSelected
                      ? `${plan.borderColor} border-2 shadow-lg shadow-primary/10`
                      : "border-white/10 hover:border-white/20"
                  } ${plan.popular ? "md:-mt-2 md:mb-2" : ""}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 px-3 shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1" /> Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6 pt-8">
                    <div className="text-center mb-6">
                      <div className={`inline-flex p-3 rounded-xl ${plan.bgColor} mb-3`}>
                        <plan.icon className={`w-6 h-6 ${plan.textColor}`} />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <div className="mt-3">
                        <span className="text-3xl font-bold text-foreground">
                          ₹{planPrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground"> INR</span>
                      </div>
                      {plan.multiplier > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((plan.multiplier - 1) * 100)}% premium over base
                        </p>
                      )}
                    </div>

                    <Separator className="mb-4" />

                    <div className="space-y-2.5 mb-6">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.textColor}`} />
                          <span className="text-foreground/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground border-t border-white/5 pt-3">
                      <div className="flex justify-between">
                        <span>Revisions</span>
                        <span className="font-medium text-foreground">{plan.revisions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Support</span>
                        <span className="font-medium text-foreground">{plan.support}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance (50%)</span>
                        <span className="font-medium text-foreground">₹{Math.round(planPrice * 0.5).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="max-w-md mx-auto mt-8 p-4 bg-card/30 border border-white/10 rounded-xl space-y-3">
            <Label htmlFor="discount" className="text-muted-foreground flex items-center justify-between">
              <span>Additional Discount (₹)</span>
              {parseFloat(discountAmount) > 0 && selectedPlan && (
                <span className="text-emerald-400 text-xs font-medium">
                  Final Price: ₹{Math.max(0, Math.round(estimate.totalEstimate * (PLANS.find(p => p.id === selectedPlan)?.multiplier || 1)) - parseFloat(discountAmount)).toLocaleString()}
                </span>
              )}
            </Label>
            <Input
              id="discount"
              type="number"
              placeholder="e.g. 5000"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="bg-black/20 border-white/10"
            />
          </div>

          <div className="flex flex-col items-center justify-center pt-6 min-h-[120px]">
            {agreementMutation.isPending ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">Content is Loading...</h3>
                <p className="text-sm text-muted-foreground">Preparing scripts and drafting your service agreement.</p>
              </div>
            ) : (
              <Button
                id="generate-contract-btn"
                size="lg"
                className="px-8 gap-2"
                onClick={handleGenerateAgreement}
                disabled={!selectedPlan}
              >
                <FileText className="w-4 h-4" />
                Generate Contract Documents
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────── STEP 4: CONTRACT PREVIEW ──────────────────── */}
      {step === "preview" && agreementDocs && estimate && (
        <div className="space-y-4">
          {/* Top Bar */}
          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Contract for {companyName}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plan: <span className="text-primary font-medium capitalize">{selectedPlan}</span> • 
                  Total: <span className="text-primary font-medium">₹{finalPrice.toLocaleString()}</span> • 
                  Client: <span className="text-primary font-medium">{clientName}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  id="download-current-doc-btn"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleDownloadDoc(activeDocTab)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .md
                </Button>
                <Button
                  id="print-pdf-btn"
                  size="sm"
                  className="gap-1.5"
                  onClick={handlePrintPDF}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Print / PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Document Tabs */}
          <Tabs value={activeDocTab} onValueChange={setActiveDocTab}>
            <TabsList className="w-full grid grid-cols-4 h-auto">
              <TabsTrigger value="serviceAgreement" className="text-xs py-2 gap-1.5 data-[state=active]:bg-primary/20">
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agreement</span>
              </TabsTrigger>
              <TabsTrigger value="featureSpec" className="text-xs py-2 gap-1.5 data-[state=active]:bg-primary/20">
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Features</span>
              </TabsTrigger>
              <TabsTrigger value="userStories" className="text-xs py-2 gap-1.5 data-[state=active]:bg-primary/20">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Stories</span>
              </TabsTrigger>
              <TabsTrigger value="commercialProposal" className="text-xs py-2 gap-1.5 data-[state=active]:bg-primary/20">
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Proposal</span>
              </TabsTrigger>
            </TabsList>

            {(["serviceAgreement", "featureSpec", "userStories", "commercialProposal"] as const).map((docKey) => (
              <TabsContent key={docKey} value={docKey}>
                <Card className="bg-card/50 border-white/10">
                  <CardContent className="p-0">
                    <div
                      ref={activeDocTab === docKey ? printRef : undefined}
                      className="p-6 sm:p-8 lg:p-10 prose prose-invert prose-sm max-w-none
                        prose-headings:text-foreground prose-headings:font-bold
                        prose-h1:text-2xl prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-3 prose-h1:mb-6
                        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                        prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                        prose-p:text-foreground/80 prose-p:leading-relaxed
                        prose-li:text-foreground/80
                        prose-strong:text-foreground
                        prose-table:border-collapse prose-table:w-full
                        prose-th:bg-white/5 prose-th:border prose-th:border-white/10 prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:text-foreground prose-th:font-semibold prose-th:text-sm
                        prose-td:border prose-td:border-white/10 prose-td:px-4 prose-td:py-2.5 prose-td:text-sm prose-td:text-foreground/80
                        prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:text-foreground/70 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-4
                        prose-hr:border-white/10
                        prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary
                        [&_tr:nth-child(even)]:bg-white/[0.02]
                      "
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {(agreementDocs as any)[docKey] || ""}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Download All */}
          <Card 
            className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
            onClick={handleDownloadAll}
          >
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Download All Documents</p>
                  <p className="text-xs text-muted-foreground">Click here to download all 4 contract documents as Markdown files</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {[
                  { key: "serviceAgreement", label: "Agreement" },
                  { key: "featureSpec", label: "Features" },
                  { key: "userStories", label: "Stories" },
                  { key: "commercialProposal", label: "Proposal" },
                ].map((doc) => (
                  <Button
                    key={doc.key}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => handleDownloadDoc(doc.key)}
                  >
                    <Download className="w-3 h-3" />
                    {doc.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action to Sign & Save */}
          <div className="flex justify-end pt-4">
            <Button 
              size="lg" 
              className="px-8 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
              onClick={handleSignAndSave}
              disabled={signMutation.isPending}
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Contract...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Sign & Save Contract
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
