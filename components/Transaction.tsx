"use client";

import {
  createPublicClient,
  http,
  parseUnits,
  type Hex,
  type Chain,
} from "viem";
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi";
// Import all chains from viem/chains - BEWARE of bundle size impact!
import * as allViemChains from "viem/chains";

// === global tuning parameters ===
const GAS_LIMIT_BUFFER_PCT = 120n; // 120% → +20%
const LEGACY_GAS_PRICE_BUFFER_PCT = 120n; // 120% → +20%
const DEFAULT_PRIORITY_FEE_GWEI = "1.5"; // 1.5 gwei

// --- Helper to get viem chain object from ID ---
// Note: This imports all chains from viem, potentially increasing bundle size.
// Consider manually importing only supported chains if bundle size is critical.
function getChainById(chainId: number): Chain | undefined {
  // Convert the imported chains object into an array of Chain objects
  const chainsArray = Object.values(allViemChains);
  // Find the chain where the id matches the requested chainId
  return chainsArray.find((chain) => chain.id === chainId);
}

/**
 * Given a bare tx and chainId, returns gas overrides with safe defaults
 */
async function withSafeDefaults(
  chainId: number,
  tx: { to: Hex; data: Hex; value?: bigint }
) {
  const chain = getChainById(chainId);
  if (!chain) {
    // Add specific error handling if a chain isn't found in the imported list
    console.error(`Chain with ID ${chainId} not found in viem/chains import.`);
    throw new Error(`Unsupported or unknown chainId: ${chainId}`);
  }
  const client = createPublicClient({
    chain: chain,
    transport: http(),
  });

  const estimated = await client.estimateGas(tx);
  const gasLimit = (estimated * GAS_LIMIT_BUFFER_PCT) / 100n;
  const block = await client.getBlock({ blockTag: "latest" });

  // Check for EIP-1559 support correctly based on block base fee
  if (block.baseFeePerGas !== null && block.baseFeePerGas !== undefined) {
    // EIP-1559 chain
    const baseFee = block.baseFeePerGas;
    const priority = parseUnits(DEFAULT_PRIORITY_FEE_GWEI, 9);
    // Ensure baseFee isn't extremely low, add buffer logic if necessary
    const maxFee = baseFee * 2n + priority;
    return {
      gas: gasLimit,
      maxPriorityFeePerGas: priority,
      maxFeePerGas: maxFee,
    };
  } else {
    // Legacy chain (or chain where baseFeePerGas is null)
    const gasPrice = await client.getGasPrice();
    return {
      gas: gasLimit,
      gasPrice: (gasPrice * LEGACY_GAS_PRICE_BUFFER_PCT) / 100n,
    };
  }
}

export function Transaction({
  txPreview,
  txPlan,
}: {
  txPreview: any;
  txPlan: any;
}) {
  const { data, error, isPending, isSuccess, sendTransactionAsync } =
    useSendTransaction();
  // Get current chainId from useAccount
  const { address, isConnected, chainId: currentChainId } = useAccount();
  // Get switchChain function
  const { switchChainAsync } = useSwitchChain();

  async function signTx(transaction: any) {
    if (
      !transaction.to ||
      !isConnected ||
      !currentChainId ||
      !switchChainAsync
    ) {
      console.error(
        "Prerequisites not met for signing: Check connection, chainId, or switchChain availability."
      );
      return;
    }

    const requiredChainId = parseInt(transaction.chainId);
    if (isNaN(requiredChainId)) {
      console.error("Invalid required chainId:", transaction.chainId);
      return;
    }

    try {
      // --- Network Switching Logic ---
      if (currentChainId !== requiredChainId) {
        console.log(
          `Switching network from ${currentChainId} to ${requiredChainId}`
        );
        await switchChainAsync({ chainId: requiredChainId });
        // After switchChainAsync resolves, wagmi's internal state
        // and the value from useAccount() should update automatically,
        // so sendTransactionAsync below will use the new chain.
        // Add a small delay or check if necessary, though often not needed.
        console.log(`Network switch to ${requiredChainId} requested.`);
      }
      // --- End Network Switching Logic ---

      // Prepare base tx
      const txBase = {
        to: transaction.to as Hex,
        data: transaction.data as Hex,
        value: toBigInt(transaction.value),
      };

      // Compute gas overrides (uses the REQUIRED chainId for calculation)
      const overrides = await withSafeDefaults(requiredChainId, txBase);
      console.log("Transaction Details:", {
        ...txBase,
        ...overrides,
        chainId: requiredChainId,
      });

      // Send transaction - wagmi uses the currently connected chain
      // (which should now be requiredChainId after potential switch)
      await sendTransactionAsync({
        ...txBase,
        // No explicit chainId needed here
        ...overrides,
      });
      console.log("Transaction sent via sendTransactionAsync");
    } catch (err: any) {
      // Catch potential errors from switchChainAsync or sendTransactionAsync
      console.error("Error during network switch or transaction sending:", err);
      // Handle specific errors if needed (e.g., user rejected switch)
      if (err.code === 4001) {
        // Standard EIP-1193 user rejected request error
        console.log("User rejected the network switch or transaction.");
      }
      // Update UI state to show the error
    }
  }

  const signMainTransaction = () => {
    if (!txPlan) return;
    const transaction = txPlan[txPlan.length - 1];
    signTx(transaction);
  };

  const approveTransaction = () => {
    if (!txPlan || txPlan.length <= 1) {
      console.log("No approval step needed or txPlan invalid.");
      return;
    }
    const approvalTransaction = txPlan[0];
    signTx(approvalTransaction);
  };

  return (
    // If txPreview or TxPlan is not defined, return null
    <>
      {txPlan && txPreview && (
        <div className="flex flex-col gap-2 p-4 bg-slate-700 shadow-md rounded-lg text-white border-slate-500 border-2">
          <h2 className="text-lg font-semibold">Transaction Preview</h2>

          <div className="flex gap-2">
            <p className="font-semibold">
              From:{" "}
              <span className="font-normal">
                {txPreview?.fromTokenSymbol &&
                  txPreview?.fromTokenSymbol.toUpperCase()}
              </span>
            </p>
            <p className="font-semibold">
              To:{" "}
              <span className="font-normal">
                {txPreview?.toTokenSymbol &&
                  txPreview?.toTokenSymbol.toUpperCase()}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <p className="font-semibold">
              From Chain:{" "}
              <span className="font-normal">{txPreview?.fromChain}</span>
            </p>
            <p className="font-semibold">
              To Chain:{" "}
              <span className="font-normal">{txPreview?.toChain}</span>
            </p>
          </div>

          <p className="font-semibold">
            Amount:{" "}
            <span className="font-normal">
              {txPreview?.fromTokenAmount}{" "}
              {txPreview?.fromTokenAmount &&
                txPreview?.fromTokenSymbol.toUpperCase() + " to "}
            </span>
            <span className="font-normal">
              {txPreview?.toTokenAmount}{" "}
              {txPreview?.toTokenAmount &&
                txPreview?.toTokenSymbol.toUpperCase()}
            </span>
            {/* horizontal divider */}
            <div className="border-t border-gray-300 my-2"></div>
            <a
              href={txPreview?.explorerUrl}
              target="_blank"
              rel="noopener noreferer"
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
            >
              Explore
            </a>
          </p>

          {isConnected ? (
            <>
              {isSuccess && (
                <p className=" p-2 rounded-2xl border-green-800 bg-green-200 w-full border-2 text-green-800">
                  {isSuccess && "Success!"}
                </p>
              )}
              {isPending && (
                <p className=" p-2 rounded-2xl border-gray-400 bg-gray-200 w-full border-2 text-slate-800">
                  {isPending && "Pending..."}
                </p>
              )}
              {error && (
                <p className=" p-2 rounded-2xl border-red-800 bg-red-400 w-full border-2 text-white">
                  Error! {error.message || JSON.stringify(error, null, 2)}
                </p>
              )}
              <div className="flex gap-3">
                {txPlan?.length > 1 && (
                  <button
                    className="mt-4 bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50"
                    type="button"
                    onClick={approveTransaction}
                    disabled={isPending}
                  >
                    Approve Transaction
                  </button>
                )}
                <button
                  className="mt-4 bg-red-500 text-white py-2 px-4 rounded disabled:opacity-50"
                  type="button"
                  onClick={signMainTransaction}
                  disabled={isPending}
                >
                  {txPlan?.length > 1
                    ? "Execute Transaction"
                    : "Sign Transaction"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-red-500 p-2 rounded-2xl border-gray-400 bg-gray-200 w-full border-2">
              Please connect your wallet
            </p>
          )}
        </div>
      )}
    </>
  );
}

// Added a helper function to convert values to BigInt safely
function toBigInt(
  value: string | number | boolean | bigint | undefined
): bigint | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return BigInt(value);
  } catch (e) {
    console.error("Failed to convert value to BigInt:", value, e);
    return undefined;
  }
}
