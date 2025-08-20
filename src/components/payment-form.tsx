"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useActiveAccount } from "thirdweb/react";
import { useState } from "react";
import { toUnits } from "thirdweb";
import { TokenSelector } from "@/components/ui/token-selector";
import { SingleNetworkSelector } from "@/components/ui/network-selector";
import { client } from "@/lib/constants";

const formSchema = z.object({
  title: z.string().min(1, "Bill To is required").max(100, "Bill To must be less than 100 characters"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)), {
    message: "Amount must be a valid number",
  }),
});

type FormValues = z.infer<typeof formSchema>;

type TokenMetadata = {
  chainId: number;
  address: string;
  decimals: number;
  name: string;
  symbol: string;
  iconUri?: string;
  priceUsd?: number;
};

interface PaymentFormProps {
  onSuccess?: () => void;
}

export function PaymentForm({ onSuccess }: PaymentFormProps = {}) {
  const account = useActiveAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenMetadata | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<number | undefined>(undefined);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (!selectedChainId) {
      alert("Please select a chain");
      return;
    }

    if (!selectedToken) {
      alert("Please select a token");
      return;
    }

    setIsCreating(true);
    try {
      // Convert amount to smallest units using thirdweb's toUnits function
      const amountInWei = toUnits(values.amount, selectedToken.decimals).toString();

      const response = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description || undefined,
          intent: {
            destinationChainId: selectedChainId,
            destinationTokenAddress: selectedToken.address,
            receiver: account!.address,
            amount: amountInWei,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment link');
      }

      const data = await response.json();
      setPaymentLink(data.link);

      // Reset form
      form.reset();
      setSelectedToken(null);
      setSelectedChainId(undefined);

      // Open QR code page in new tab
      if (data.id) {
        const qrUrl = `/${data.id}`;
        window.open(qrUrl, '_blank');
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      alert('Failed to create payment link');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex justify-stretch w-full">
      <div className="w-full pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill To</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe, ACME Corp, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional details about this invoice..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Chain</FormLabel>
              <FormControl>
                <SingleNetworkSelector
                  chainId={selectedChainId}
                  onChange={setSelectedChainId}
                  placeholder="Select a chain"
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Token</FormLabel>
              <FormControl>
                <TokenSelector
                  selectedToken={selectedToken ? { chainId: selectedToken.chainId, address: selectedToken.address } : undefined}
                  onChange={setSelectedToken}
                  chainId={selectedChainId || 1}
                  client={client}
                  enabled={!!selectedChainId}
                  placeholder="Select a token"
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="0.1" type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Invoice"
              )}
            </Button>

            {paymentLink && (
              <div className="mt-4 p-4 bg-green-950/50 border border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-400">Invoice created!</p>
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {paymentLink}
                </a>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
