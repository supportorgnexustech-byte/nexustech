import React from "react";
import { useListUsers, User } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Mail, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Users() {
  const { data: users, isLoading } = useListUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleColors = {
    admin: "bg-primary/20 text-primary border-primary/30",
    dev: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    client: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage system access and roles.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users?.map((user: User) => (
          <Card key={user.id} className="bg-card/50 border-white/10">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground leading-tight">{user.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`capitalize ${roleColors[user.role as keyof typeof roleColors]}`}>
                  {user.role}
                </Badge>
              </div>

              <div className="space-y-2.5 mt-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-white/40" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Smartphone className="w-4 h-4 text-white/40" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-white/40" />
                  Access Level: {user.role === 'admin' ? 'Full' : user.role === 'dev' ? 'Projects & Resources' : 'Client Portal Only'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
