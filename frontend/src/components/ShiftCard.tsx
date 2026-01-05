import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ShiftStatus = "open" | "claimed" | "completed" | "cancelled";

export interface ShiftCardProps {
  time: string; // e.g., "2024-06-16 09:00 - 17:00"
  role: string;
  status: ShiftStatus;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
}

function statusColor(status: ShiftStatus): "default" | "success" | "destructive" | "secondary" {
  switch (status) {
    case "open":
      return "default";
    case "claimed":
      return "secondary";
    case "completed":
      return "success";
    case "cancelled":
      return "destructive";
    default:
      return "default";
  }
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  time,
  role,
  status,
  onAction,
  actionLabel = "Claim Shift",
  actionDisabled = false,
}) => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{role}</span>
          <Badge variant={statusColor(status) as "default" | "destructive" | "secondary" | "outline"} className="uppercase tracking-wide">
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">{time}</div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onAction}
          disabled={actionDisabled}
          className="w-full"
          variant={actionLabel.includes("Oddaj") ? "outline" : "default"}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
};

