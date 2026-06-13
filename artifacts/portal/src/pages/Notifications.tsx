import React from "react";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates and alerts.</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications?.map(notification => (
          <Card key={notification.id} className={`border-white/10 ${notification.read ? 'bg-card/30 opacity-70' : 'bg-card/80 border-primary/30'}`}>
            <CardContent className="p-4 flex gap-4">
              <div className="mt-1">
                <Bell className={`w-5 h-5 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-foreground">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              </div>
              {!notification.read && (
                <Button variant="ghost" size="icon" onClick={() => markRead.mutate({ id: notification.id })}>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {notifications?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card/20 rounded-lg border border-white/5 border-dashed">
            You have no notifications.
          </div>
        )}
      </div>
    </div>
  );
}
