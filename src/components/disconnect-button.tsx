"use client";

import { Button } from "@/components/ui/button";
import { useDisconnect, useActiveWallet } from "thirdweb/react";
import { cn } from "@/lib/utils";

interface DisconnectButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export function DisconnectButton({ 
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props 
}: DisconnectButtonProps) {
  const { disconnect } = useDisconnect();
  const activeWallet = useActiveWallet();

  const handleDisconnect = () => {
    if (activeWallet) {
      disconnect(activeWallet);
    }
  };

  return (
    <Button
      onClick={handleDisconnect}
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    >
      {children || "Disconnect"}
    </Button>
  );
}