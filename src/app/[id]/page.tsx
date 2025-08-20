"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Mail, Phone, Check } from "lucide-react";
import { Bridge } from "thirdweb";
import { client } from "@/lib/constants";
import { Spinner } from "@/components/ui/spinner";

interface PaymentLinkDetails {
  id: string;
  title: string;
  description?: string;
  link: string;
  receiver: string;
  amount: string;
  destinationToken: {
    chainId: number;
    address: string;
    symbol: string;
    decimals: number;
    name: string;
    priceUsd?: number;
  };
  createdAt: string;
}

export default function InvoicePage() {
  const params = useParams();
  const id = params.id as string;
  
  const [paymentLink, setPaymentLink] = useState<PaymentLinkDetails | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchPaymentLink = async () => {
      try {
        const response = await fetch(`/api/payment-link/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Invoice not found");
          } else {
            setError("Failed to load invoice");
          }
          return;
        }
        
        const data = await response.json();
        setPaymentLink(data.data);
        
        // Fetch token price
        if (data.data?.destinationToken) {
          try {
            const tokens = await Bridge.tokens({
              client,
              chainId: data.data.destinationToken.chainId,
              tokenAddress: data.data.destinationToken.address,
              limit: 1,
            });
            if (tokens.length > 0 && tokens[0].prices.USD) {
              setTokenPrice(tokens[0].prices.USD);
            }
          } catch (error) {
            console.warn(`Failed to fetch price for token ${data.data.destinationToken.address}:`, error);
          }
        }
        
        // Generate QR code
        if (data.data?.link) {
          const qrDataUrl = await QRCode.toDataURL(data.data.link, {
            width: 180,
            margin: 0,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          setQrCodeDataUrl(qrDataUrl);
        }
      } catch (error) {
        console.error('Error fetching payment link:', error);
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPaymentLink();
    }
  }, [id]);

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

  const handleCopyLink = async () => {
    if (!paymentLink?.link) return;
    
    try {
      await navigator.clipboard.writeText(paymentLink.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleEmailForward = () => {
    if (!paymentLink) return;
    
    const subject = encodeURIComponent(`Invoice - ${paymentLink.title}`);
    const amount = formatUsdAmount(paymentLink.amount, paymentLink.destinationToken.decimals, tokenPrice) || 
                  `${formatAmount(paymentLink.amount, paymentLink.destinationToken.decimals)} ${paymentLink.destinationToken.symbol}`;
    
    const body = encodeURIComponent(
      `Please find the invoice details below:\n\n` +
        `Bill To: ${paymentLink.title}\n` +
        `Amount: ${amount}\n` +
        `Issue Date: ${formatDate(paymentLink.createdAt)}\n` +
        (paymentLink.description ? `Description: ${paymentLink.description}\n` : '') +
        `\nPay now: ${paymentLink.link}`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handlePhoneForward = () => {
    if (!paymentLink) return;
    
    const amount = formatUsdAmount(paymentLink.amount, paymentLink.destinationToken.decimals, tokenPrice) || 
                  `${formatAmount(paymentLink.amount, paymentLink.destinationToken.decimals)} ${paymentLink.destinationToken.symbol}`;
    
    const message = encodeURIComponent(
      `Invoice for ${amount} is ready. Pay now: ${paymentLink.link}`,
    );
    window.open(`sms:?body=${message}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Invoice</h1>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
          </div>

          <Card className="bg-card border-border shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-muted to-muted/80 p-8 rounded-2xl border-2 border-primary/30 shadow-2xl">
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Loading Invoice</h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center" style={{ width: 212, height: 212 }}>
                      <Spinner size="lg" />
                    </div>
                    <div className="text-center">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto"></div>
                    </div>
                  </div>
                </div>

                <div className="text-center py-4 bg-muted rounded-lg border border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Total Amount</h3>
                  <div className="h-8 w-32 bg-background animate-pulse rounded mx-auto mb-2"></div>
                  <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Loading Details
                  </h2>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-background animate-pulse rounded"></div>
                    <div className="h-4 w-3/4 bg-background animate-pulse rounded"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill To</h3>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue Date</h3>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                    <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">{error || "Invoice not found"}</h1>
            <p className="text-muted-foreground">Please check the invoice link and try again</p>
          </div>
        </div>
      </div>
    );
  }

  const displayAmount = formatUsdAmount(paymentLink.amount, paymentLink.destinationToken.decimals, tokenPrice) || 
                      `${formatAmount(paymentLink.amount, paymentLink.destinationToken.decimals)} ${paymentLink.destinationToken.symbol}`;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Invoice</h1>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        <Card className="bg-card border-border shadow-xl">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-muted to-muted/80 p-8 rounded-2xl border-2 border-primary/30 shadow-2xl">
                  <div className="text-center mb-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Scan to Pay</h3>
                  </div>
                  <div className="bg-white p-4 rounded-xl mb-4">
                    {qrCodeDataUrl && (
                      <img
                        src={qrCodeDataUrl}
                        alt="Invoice QR Code"
                        className="w-full h-auto"
                        style={{ width: 180, height: 180 }}
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <a
                      href={paymentLink.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm font-medium underline underline-offset-2"
                    >
                      Pay Now
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-center py-4 bg-muted rounded-lg border border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Total Amount</h3>
                <p className="text-3xl font-bold text-foreground mb-2">
                  {displayAmount}
                </p>
                <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
              </div>

              {paymentLink.description && (
                <div className="bg-muted p-4 rounded-lg">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Service Description
                  </h2>
                  <p className="text-foreground leading-relaxed text-sm">{paymentLink.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bill To</h3>
                  <p className="text-sm font-semibold text-foreground">{paymentLink.title}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Issue Date</h3>
                  <p className="text-sm font-semibold text-foreground">{formatDate(paymentLink.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleEmailForward}
                  className="font-medium py-2"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Invoice
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handlePhoneForward}
                    variant="outline"
                    className="font-medium py-2"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="font-medium py-2"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}