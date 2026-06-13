import React from "react";
import { useListClients, Client } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, Building2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Clients() {
  const { data: clients, isLoading } = useListClients();
  const [search, setSearch] = React.useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredClients = clients?.filter(c => 
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage client relationships and accounts.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients..." 
            className="pl-9 bg-card/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client: Client) => (
          <Link key={client.id} href={`/clients/${client.id}`}>
            <Card className="bg-card/50 border-white/10 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{client.companyName}</CardTitle>
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                </div>
                <p className="text-sm text-primary font-medium">{client.businessType}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  {client.contactName}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {client.contactEmail}
                </div>
                {client.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {client.contactPhone}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {client.services.map((service, i) => (
                    <Badge key={i} variant="outline" className="bg-white/5">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card/20 rounded-lg border border-white/5 border-dashed">
            No clients found.
          </div>
        )}
      </div>
    </div>
  );
}
