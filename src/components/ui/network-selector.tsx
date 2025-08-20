"use client";

import { useMemo, useCallback } from "react";
import { CoinsIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SelectWithSearch } from "@/components/ui/select-with-search";
import { useAllChainsData } from "@/hooks/useAllChainsData";
import { cn } from "@/lib/utils";
import { resolveScheme } from "thirdweb/storage";
import { client } from "@/lib/constants";

type Option = {
  label: string;
  value: string;
};

function cleanChainName(name: string): string {
  return name.replace(/\s+(Mainnet|Network|Chain)$/i, '').trim();
}

export function SingleNetworkSelector(props: {
  chainId: number | undefined;
  onChange: (chainId: number) => void;
  className?: string;
  popoverContentClassName?: string;
  // if specified - only these chains will be shown
  chainIds?: number[];
  side?: "left" | "right" | "top" | "bottom";
  disableChainId?: boolean;
  align?: "center" | "start" | "end";
  placeholder?: string;
}) {
  const { data, isLoading } = useAllChainsData();
  const { allChains, idToChain } = data;

  const chainsToShow = useMemo(() => {
    let chains = allChains;

    if (props.chainIds) {
      const chainIdSet = new Set(props.chainIds);
      chains = chains.filter((chain) => chainIdSet.has(chain.chainId));
    }

    return chains;
  }, [allChains, props.chainIds]);

  const options = useMemo(() => {
    return chainsToShow.map((chain) => {
      return {
        label: cleanChainName(chain.name),
        value: String(chain.chainId),
      };
    });
  }, [chainsToShow]);

  const searchFn = useCallback(
    (option: Option, searchValue: string) => {
      const chain = idToChain.get(Number(option.value));
      if (!chain) {
        return false;
      }

      if (Number.isInteger(Number.parseInt(searchValue))) {
        return String(chain.chainId).startsWith(searchValue);
      }
      return chain.name.toLowerCase().includes(searchValue.toLowerCase());
    },
    [idToChain],
  );

  const renderOption = useCallback(
    (option: Option) => {
      const chain = idToChain.get(Number(option.value));
      if (!chain) {
        return option.label;
      }

      const image = (() => {
        try {
          if (!chain.icon) return undefined;
          return resolveScheme({ client, uri: chain.icon });
        } catch (error) {
          return undefined;
        }
      })();

      return (
        <div className="flex justify-between gap-4">
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
            {cleanChainName(chain.name)}
          </span>

          {!props.disableChainId && (
            <Badge className="gap-2 max-sm:hidden" variant="outline">
              <span className="text-muted-foreground">Chain ID</span>
              {chain.chainId}
            </Badge>
          )}
        </div>
      );
    },
    [idToChain, props.disableChainId],
  );

  const isLoadingChains = isLoading || allChains.length === 0;

  return (
    <SelectWithSearch
      align={props.align}
      className={props.className}
      closeOnSelect={true}
      disabled={isLoadingChains}
      onValueChange={(chainId) => {
        props.onChange(Number(chainId));
      }}
      options={options}
      overrideSearchFn={searchFn}
      placeholder={
        isLoadingChains
          ? "Loading Chains..."
          : props.placeholder || "Select Chain"
      }
      popoverContentClassName={props.popoverContentClassName}
      renderOption={renderOption}
      searchPlaceholder="Search by Name or Chain ID"
      showCheck={false}
      side={props.side}
      value={props.chainId?.toString()}
    />
  );
}
