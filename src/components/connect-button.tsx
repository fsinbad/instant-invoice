"use client";

import { Button } from "@/components/ui/button";
import { useConnect, useActiveWallet } from "thirdweb/react";
import { createWallet, injectedProvider, WalletId } from "thirdweb/wallets";
import { cn } from "@/lib/utils";
import { client } from "@/lib/constants";

interface ConnectButtonProps {
  id: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  title?: string;
}

export function ConnectButton({
  id,
  children,
  className,
  variant = "default",
  size = "default",
  title,
  ...props
}: ConnectButtonProps) {
  const { connect, isConnecting } = useConnect();
  const activeWallet = useActiveWallet();

  const handleConnect = () => {
    connect(async () => {
      const wallet = createWallet(id as WalletId);

      // if user has wallet installed, connect to it
      if (injectedProvider(id as WalletId)) {
        await wallet.connect({ client });
      }
      // open WalletConnect modal so user can scan the QR code and connect
      else {
        await wallet.connect({
          client,
          walletConnect: { showQrModal: true },
        });
      }

      // return the wallet to set it as active wallet
      return wallet;
    });
  };

  const isConnected = activeWallet?.id === id;

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnected || isConnecting}
      variant={variant}
      size={size}
      className={cn(className)}
      title={title}
      {...props}
    >
      {isConnecting ? "Connecting..." : children || (isConnected ? "Connected" : "Connect Wallet")}
    </Button>
  );
}
