import { getWalletAccounts } from "@dynamic-labs-sdk/client";
import {
  hasDelegatedAccess,
  delegateWaasKeyShares,
} from "@dynamic-labs-sdk/client/waas";
import { dynamicClient } from "@/lib/dynamic";

export function isDelegated(): boolean {
  const accounts = getWalletAccounts(dynamicClient);
  if (!accounts.length) return false;
  return hasDelegatedAccess({ walletAccount: accounts[0] });
}

export async function delegate(): Promise<void> {
  console.log("delegating");
  const accounts = getWalletAccounts(dynamicClient);
  console.log("delegate 1");
  if (!accounts.length) return;
  console.log("delegate 2");
  if (hasDelegatedAccess({ walletAccount: accounts[0] })) return;
  console.log("delegate 3");
  await delegateWaasKeyShares({ walletAccount: accounts[0] });
  console.log("delegate 4");
}
