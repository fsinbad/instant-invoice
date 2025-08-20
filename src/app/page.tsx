"use client";

import { ConnectButton } from "@/components/connect-button";
import { DisconnectButton } from "@/components/disconnect-button";
import { PaymentForm } from "@/components/payment-form";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { Bridge } from "thirdweb";
import { client } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Wallet, Plus, User, Check, Clock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface PaymentLink {
  id: string;
  title: string;
  description?: string;
  link: string;
  receiver: string;
  amount: string;
  destinationToken: {
    chainId: number;
    address: string;
    decimals: number;
    symbol: string;
    name: string;
  };
  createdAt: string;
  priceUsd?: number;
}

interface Payment {
  id: string;
  paymentLinkId: string;
  status: string;
  amount: string;
  createdAt: string;
}

export default function Home() {
  const account = useActiveAccount();
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (account?.address) {
      fetchData();
    }
  }, [account?.address]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch payment links for this address
      const linksResponse = await fetch(`/api/payment-links?receiver=${account!.address}`);
      const linksData = await linksResponse.json();

      // Fetch all payments
      const paymentsResponse = await fetch('/api/payments');
      const paymentsData = await paymentsResponse.json();

      // Get unique tokens to fetch prices for
      const links = linksData.data || [];
      const uniqueTokens = links.reduce((acc: Array<{chainId: number, address: string}>, link: PaymentLink) => {
        const token = link.destinationToken;
        const exists = acc.find(t => t.chainId === token.chainId && t.address === token.address);
        if (!exists) {
          acc.push({ chainId: token.chainId, address: token.address });
        }
        return acc;
      }, []);

      // Fetch token prices
      const tokenPrices: { [key: string]: number } = {};
      for (const token of uniqueTokens) {
        try {
          const tokens = await Bridge.tokens({
            client,
            chainId: token.chainId,
            tokenAddress: token.address,
            limit: 1,
          });
          if (tokens.length > 0 && tokens[0].prices.USD) {
            const key = `${token.chainId}-${token.address}`;
            tokenPrices[key] = tokens[0].prices.USD;
          }
        } catch (error) {
          console.warn(`Failed to fetch price for token ${token.address} on chain ${token.chainId}:`, error);
        }
      }

      // Merge price data into payment links
      const linksWithPrices = links.map((link: PaymentLink) => ({
        ...link,
        priceUsd: tokenPrices[`${link.destinationToken.chainId}-${link.destinationToken.address}`] || undefined,
      }));

      setPaymentLinks(linksWithPrices);
      setPayments(paymentsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (linkId: string) => {
    const payment = payments.find(p => p.paymentLinkId === linkId);
    return payment ? 'Paid' : 'Unpaid';
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    const num = Number(amount) / Math.pow(10, decimals);
    return parseFloat(num.toFixed(6)).toString();
  };

  const formatUsdAmount = (amount: string, decimals: number = 18, priceUsd?: number) => {
    if (!priceUsd) return null;
    const tokenAmount = Number(amount) / Math.pow(10, decimals);
    const usdAmount = tokenAmount * priceUsd;
    return usdAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleRowClick = (link: PaymentLink) => {
    const invoiceUrl = `/${link.id}`;
    window.open(invoiceUrl, '_blank');
  };

  const handleInvoiceCreated = () => {
    setIsModalOpen(false);
    fetchData(); // Refresh the data
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="size-6" />
              <h1 className="text-xl font-bold">InstantInvoice</h1>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Create Invoices.
                <br />
                Get Paid Instantly.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The simplest way to create professional invoices and accept payments through crypto wallets.
                Generate QR codes, track payments, and get paid faster.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
              {/* Left: Features */}
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Simple Invoice Creation</h3>
                    <p className="text-muted-foreground">Create professional invoices in seconds with our intuitive interface.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary rounded-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">QR Code Generation</h3>
                    <p className="text-muted-foreground">Automatically generate QR codes for easy mobile payments.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Real-time Tracking</h3>
                    <p className="text-muted-foreground">Monitor payment status and manage all your invoices in one dashboard.</p>
                  </div>
                </div>
              </div>

              {/* Right: Connection */}
              <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-3">Get Started</h2>
                  <p className="text-muted-foreground">Connect your wallet to start creating invoices</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ConnectButton id="io.metamask" variant="outline" className="flex items-center justify-center gap-2 h-10 px-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
                    MetaMask
                  </ConnectButton>
                  <ConnectButton id="com.coinbase.wallet" variant="outline" className="flex items-center justify-center gap-2 h-10 px-3">
                    <img src="https://avatars.githubusercontent.com/u/18060234?s=280&v=4" alt="Coinbase" className="w-5 h-5 rounded" />
                    Coinbase
                  </ConnectButton>
                  <ConnectButton id="io.rabby" variant="outline" className="flex items-center justify-center gap-2 h-10 px-3">
                    <img src="https://rabby.io/assets/images/logo-128.png" alt="Rabby" className="w-5 h-5 rounded" />
                    Rabby
                  </ConnectButton>
                  <ConnectButton id="me.rainbow" variant="outline" className="flex items-center justify-center gap-2 h-10 px-3">
                    <img src="https://rainbow.me/favicon.ico" alt="Rainbow" className="w-5 h-5 rounded" />
                    Rainbow
                  </ConnectButton>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Secure connection through your wallet
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Trusted by crypto users worldwide
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="size-6" />
              <h1 className="text-xl font-bold">InstantInvoice</h1>
            </div>
          </div>
        </header>
        <main className="p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold tracking-tight mb-3">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Manage your invoices and track payments</p>
          </div>

          <div className="space-y-6">
            {/* Loading Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="px-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                        <div className="h-8 w-12 bg-muted animate-pulse rounded"></div>
                      </div>
                      <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Loading Table */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Recent Invoices</CardTitle>
                  <Spinner size="sm" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-border/50">
                        <TableHead className="font-semibold">Bill To</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Chain</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          <TableCell className="py-4">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="h-5 w-12 bg-muted animate-pulse rounded-full"></div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="size-6" />
            <h1 className="text-xl font-bold">InstantInvoice</h1>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Invoice</DialogTitle>
                </DialogHeader>
                <PaymentForm onSuccess={handleInvoiceCreated} />
              </DialogContent>
            </Dialog>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
              </span>
              <DisconnectButton variant="outline" size="sm">
                Disconnect
              </DisconnectButton>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage your invoices and track payments</p>
        </div>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                    <p className="text-3xl font-bold">{paymentLinks.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Paid</p>
                    <p className="text-3xl font-bold text-green-600">
                      {paymentLinks.filter(link => getPaymentStatus(link.id) === 'Paid').length}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold">
                      {paymentLinks.filter(link => getPaymentStatus(link.id) === 'Unpaid').length}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Table */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Recent Invoices</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {paymentLinks.length} {paymentLinks.length === 1 ? 'invoice' : 'invoices'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-border/50">
                      <TableHead className="font-semibold">Bill To</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Chain</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentLinks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                            <div>
                              <p className="font-medium text-muted-foreground">No invoices yet</p>
                              <p className="text-sm text-muted-foreground/70">Create your first invoice to get started</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paymentLinks.map((link) => (
                        <TableRow
                          key={link.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-border/50"
                          onClick={() => handleRowClick(link)}
                        >
                          <TableCell className="font-medium py-4">{link.title}</TableCell>
                          <TableCell className="py-4">
                            <span className="font-mono font-medium">
                              {formatUsdAmount(link.amount, link.destinationToken?.decimals, link.priceUsd) ||
                                `${formatAmount(link.amount, link.destinationToken?.decimals)} ${link.destinationToken?.symbol}`}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm bg-muted px-2 py-1 rounded-md">
                              {link.destinationToken?.chainId}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              variant={getPaymentStatus(link.id) === 'Paid' ? 'default' : 'secondary'}
                              className={getPaymentStatus(link.id) === 'Paid' ? 'bg-green-600/20 hover:bg-green-600/20 border border-green-600 text-green-600' : ''}
                            >
                              {getPaymentStatus(link.id)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-muted-foreground">{formatDate(link.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
