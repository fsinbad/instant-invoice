"use client";

import { CoinsIcon } from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
import {
  getAddress,
  NATIVE_TOKEN_ADDRESS,
  type ThirdwebClient,
  Bridge,
} from "thirdweb";
import { shortenAddress } from "thirdweb/utils";
import { Badge } from "@/components/ui/badge";
import { SelectWithSearch } from "@/components/ui/select-with-search";
import { cn } from "@/lib/utils";
import { resolveScheme } from "thirdweb/storage";
import { client } from "@/lib/constants";

type TokenMetadata = {
  chainId: number;
  address: string;
  decimals: number;
  name: string;
  symbol: string;
  iconUri?: string;
  priceUsd?: number;
};

export function TokenSelector(props: {
  selectedToken: { chainId: number; address: string } | undefined;
  onChange: (token: TokenMetadata) => void;
  className?: string;
  chainId: number;
  disableAddress?: boolean;
  placeholder?: string;
  client: ThirdwebClient;
  disabled?: boolean;
  enabled?: boolean;
}) {
  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tokens using Bridge.tokens with pagination
  useEffect(() => {
    if (!props.enabled) return;

    const fetchAllTokens = async () => {
      setIsLoading(true);
      try {
        const allTokens: TokenMetadata[] = [];
        const limit = 250;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const tokenInfo = await Bridge.tokens({
            chainId: props.chainId,
            client: props.client,
            limit,
            offset,
          });

          allTokens.push(...tokenInfo);

          // If we got fewer tokens than the limit, we've reached the end
          if (tokenInfo.length === 0) {
            hasMore = false;
          } else {
            offset += limit;
          }
        }

        setTokens(allTokens);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTokens();
  }, [props.chainId, props.enabled, props.client]);

  const addressChainToToken = useMemo(() => {
    const value = new Map<string, TokenMetadata>();
    for (const token of tokens) {
      value.set(`${token.chainId}:${token.address}`, token);
    }
    return value;
  }, [tokens]);

  const options = useMemo(() => {
    return tokens.map((token) => ({
      label: token.symbol,
      value: `${token.chainId}:${token.address}`,
    }));
  }, [tokens]);

  const selectedValue = props.selectedToken
    ? `${props.selectedToken.chainId}:${props.selectedToken.address}`
    : undefined;

  const searchFn = useCallback(
    (option: { label: string; value: string }, searchValue: string) => {
      const token = addressChainToToken.get(option.value);
      if (!token) {
        return false;
      }

      const searchLower = searchValue.toLowerCase();
      return (
        token.symbol.toLowerCase().includes(searchLower) ||
        token.name.toLowerCase().includes(searchLower) ||
        token.address.toLowerCase().includes(searchLower)
      );
    },
    [addressChainToToken],
  );

  const renderTokenOption = useCallback(
    (option: { label: string; value: string }) => {
      const token = addressChainToToken.get(option.value);
      if (!token) {
        return option.label;
      }

      const image = (() => {
        try {
          if (!token.iconUri) return undefined;
          return resolveScheme({ client, uri: token.iconUri });
        } catch (error) {
          return undefined;
        }
      })();

      return (
        <div className="flex items-center justify-between gap-4">
          <span className="flex grow gap-2 truncate text-left">
            {image ? (
              <img
                alt=""
                className={cn("size-5 rounded-full object-contain")}
                src={image}
              />
            ) : (
              <CoinsIcon className="size-5" />
            )}
            {token.symbol}
          </span>

          {!props.disableAddress && (
            <Badge className="gap-2 py-1 max-sm:hidden" variant="outline">
              <span className="text-muted-foreground">Address</span>
              {shortenAddress(token.address, 4)}
            </Badge>
          )}
        </div>
      );
    },
    [props.disableAddress, addressChainToToken],
  );

  return (
    <SelectWithSearch
      className={cn("w-full", props.className)}
      closeOnSelect={true}
      disabled={isLoading || props.disabled}
      onValueChange={(tokenAddress) => {
        const token = addressChainToToken.get(tokenAddress);
        if (!token) {
          return;
        }
        props.onChange(token);
      }}
      options={options}
      overrideSearchFn={searchFn}
      placeholder={
        isLoading
          ? "Loading Tokens..."
          : props.placeholder || "Select Token"
      }
      renderOption={renderTokenOption}
      searchPlaceholder="Search by Symbol, Name or Address"
      showCheck={false}
      value={selectedValue}
    />
  );
}
