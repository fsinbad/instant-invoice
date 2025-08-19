"use client";

import { useState, useEffect } from "react";
import { Bridge } from "thirdweb";
import { client } from "@/lib/constants";

type ChainData = {
  chainId: number;
  name: string;
  icon?: string;
};

export function useAllChainsData() {
  const [chains, setChains] = useState<ChainData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const chainData = await Bridge.chains({ client });
        setChains(chainData);
      } catch (error) {
        console.error("Error fetching chains:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChains();
  }, []);

  const idToChain = new Map<number, ChainData>();
  chains.forEach(chain => idToChain.set(chain.chainId, chain));

  return {
    data: {
      allChains: chains,
      idToChain,
    },
    isLoading,
  };
}
