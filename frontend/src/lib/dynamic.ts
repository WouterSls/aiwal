import { createDynamicClient } from "@dynamic-labs-sdk/client";

export const dynamicClient = createDynamicClient({
  environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "",
  metadata: {
    name: "Aiwal",
  },
});
