import { createDynamicClient } from "@dynamic-labs-sdk/client";
import { addEvmExtension } from "@dynamic-labs-sdk/evm";
import { addWaasEvmExtension } from "@dynamic-labs-sdk/evm/waas";

export const dynamicClient = createDynamicClient({
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "",
  metadata: {
    name: "Aiwal",
  },
  transformers: {
    networkData: (network) => {
      if (network.networkId === "8453") {
        return {
          ...network,
          rpcUrls: {
            http: [process.env.BASE_RPC_URL!],
          },
        };
      }
      return network;
    },
  },
});

addWaasEvmExtension();
