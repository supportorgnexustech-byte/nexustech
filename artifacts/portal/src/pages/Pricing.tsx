import React, { useState } from "react";
import { useEstimatePrice, PricingEstimate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calculator, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function Pricing() {
  const [description, setDescription] = useState("");
  const [estimate, setEstimate] = useState<PricingEstimate | null>(null);
  const estimateMutation = useEstimatePrice();

  const handleEstimate = async () => {
    if (!description.trim()) return;
    try {
      const result = await estimateMutation.mutateAsync({ data: { description } });
      setEstimate(result);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            Pricing AI
          </h1>
          <p className="text-muted-foreground mt-1">Generate accurate project estimates based on plain text descriptions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-white/10 h-fit">
          <CardHeader>
            <CardTitle>Project Requirements</CardTitle>
            <CardDescription>Describe the project in as much detail as possible. The AI will extract features, complexity, and estimate costs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="e.g. We need a SaaS platform for property management. It should have user authentication with 3 roles (admin, landlord, tenant). There needs to be a dashboard showing rent collection stats..." 
              className="min-h-[250px] bg-black/20 border-white/10"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button 
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

        {estimate ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Estimate Summary</h2>
                    <p className="text-sm text-muted-foreground">{estimate.projectType}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize px-3 py-1 text-sm">
                    {estimate.complexity} Complexity
                  </Badge>
                </div>
                
                <p className="text-sm leading-relaxed text-foreground/80 mb-8">{estimate.summary}</p>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Estimated Cost</p>
                    <p className="text-3xl font-bold text-foreground">
                      {estimate.currency} {estimate.totalEstimate.toLocaleString()}
                    </p>
                    {estimate.minEstimate && estimate.maxEstimate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: {estimate.minEstimate.toLocaleString()} - {estimate.maxEstimate.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Timeline</p>
                    <p className="text-3xl font-bold text-foreground">
                      {estimate.estimatedWeeks} <span className="text-lg text-muted-foreground font-normal">weeks</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h3 className="text-lg font-semibold px-1">Feature Breakdown</h3>
            <div className="space-y-3">
              {estimate.features.map((feature, i) => (
                <Card key={i} className="bg-card/30 border-white/5">
                  <CardContent className="p-4 flex gap-4">
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-foreground">{feature.name}</h4>
                        <span className="text-sm font-medium text-foreground bg-white/5 px-2 py-0.5 rounded">
                          {estimate.currency} {feature.maxPrice.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="bg-white/5 text-muted-foreground capitalize">
                          {feature.complexity} complexity
                        </Badge>
                        <span>~{feature.estimatedDays} days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full border border-white/5 border-dashed rounded-xl bg-card/20 flex flex-col items-center justify-center text-center p-8 text-muted-foreground min-h-[400px]">
            <Calculator className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">Awaiting Description</h3>
            <p className="text-sm max-w-[250px]">Enter project details on the left to generate an AI-powered pricing estimate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
