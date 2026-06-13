import React from "react";
import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Bell, BellOff, CheckCircle, Milestone, FileText, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_ICON: Record<string, React.ElementType> = {
  milestone: Milestone,
  invoice: FileText,
  project_update: Briefcase,
};

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const qc = useQueryClient();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unread = notifications?.filter(n => !n.read).length ?? 0;

  const handleMarkRead = async (id: number) => {
    await markRead.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: ["listNotifications"] });
  };

  return (
    <div className="space-y-6 fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {notifications?.map(notification => {
          const Icon = TYPE_ICON[notification.type] ?? Bell;
          return (
            <Card
              key={notification.id}
              className={`border-white/10 transition-all ${
                notification.read ? "bg-card/20 opacity-60" : "bg-card/80 border-primary/20 shadow-sm shadow-primary/5"
              }`}
            >
              <CardContent className="p-4 flex gap-4">
                <div className={`mt-1 p-2 rounded-md shrink-0 ${notification.read ? "bg-white/5" : "bg-primary/10"}`}>
                  <Icon className={`w-4 h-4 ${notification.read ? "text-muted-foreground" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-semibold text-foreground text-sm">{notification.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-white/5 rounded px-1.5 py-0.5 capitalize text-muted-foreground">
                      {notification.type?.replace("_", " ")}
                    </span>
                    <span className="text-xs bg-white/5 rounded px-1.5 py-0.5 capitalize text-muted-foreground">
                      {notification.channel}
                    </span>
                  </div>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 hover:text-emerald-400"
                    onClick={() => handleMarkRead(notification.id)}
                    disabled={markRead.isPending}
                    title="Mark as read"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!notifications?.length && (
          <div className="text-center py-16 text-muted-foreground bg-card/20 rounded-lg border border-white/5 border-dashed flex flex-col items-center gap-3">
            <BellOff className="w-10 h-10 opacity-30" />
            <p>No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
