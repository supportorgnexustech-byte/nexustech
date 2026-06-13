import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { ShieldAlert, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("admin@nexustech.in");
  const [password, setPassword] = useState("admin123");
  const { login, isAuthenticated, currentUser, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === "client") {
        setLocation("/client-portal");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, currentUser, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-md p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 mb-4 shadow-lg shadow-primary/5">
            <ShieldAlert className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">NEXUS</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs mt-1 font-mono">Operations Portal</p>
        </div>

        <Card className="border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Authentication</CardTitle>
            <CardDescription>Enter your credentials to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@nexus.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/20 border-white/10 focus-visible:border-primary"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/20 border-white/10 focus-visible:border-primary"
                  data-testid="input-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t border-white/5 pt-4">
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Demo accounts:</p>
              <p className="font-mono text-white/60">admin@nexustech.in (admin123)</p>
              <p className="font-mono text-white/60">priya@nexustech.in (dev123) · rohan@acmecorp.com (client123)</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
