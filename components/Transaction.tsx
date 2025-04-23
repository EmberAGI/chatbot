"use client";

import {
  parseTransaction,
  createPublicClient,
  http,
  parseUnits,
  type PublicClient,
  type Hex,
} from "viem";
import { useAccount, useSendTransaction } from "wagmi";
import { mainnet } from "viem/chains";

interface txPreview {
  fromToken: string;
  toToken: string;
  amount: string;
  fromChain: string;
  toChain: string;
}

function toBigInt(value: string | number | boolean | bigint | undefined) {
  return value ? BigInt(value) : undefined;
}

// === global tuning parameters ===
const GAS_LIMIT_BUFFER_PCT = 120n; // 120% → +20%
const LEGACY_GAS_PRICE_BUFFER_PCT = 120n; // 120% → +20%
const DEFAULT_PRIORITY_FEE_GWEI = "1.5"; // 1.5 gwei

// initialize public client for gas estimation
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Given a bare tx, returns gas overrides with safe defaults
 */
async function withSafeDefaults(
  client: PublicClient,
  tx: { to: Hex; data: Hex; value?: bigint }
) {
  const estimated = await client.estimateGas(tx);
  const gasLimit = (estimated * GAS_LIMIT_BUFFER_PCT) / 100n;
  const block = await client.getBlock({ blockTag: "latest" });
  if (block.baseFeePerGas !== null) {
    // EIP-1559 chain
    const baseFee = block.baseFeePerGas;
    const priority = parseUnits(DEFAULT_PRIORITY_FEE_GWEI, 9);
    const maxFee = baseFee * 2n + priority;
    return {
      gas: gasLimit,
      maxPriorityFeePerGas: priority,
      maxFeePerGas: maxFee,
    };
  } else {
    // legacy chain
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

  //useWallet to check if is connected
  const { address, isConnected } = useAccount();

  async function signTx(transaction: any) {
    if (!transaction.to) return;
    // prepare base tx
    const txBase = {
      to: transaction.to as Hex,
      data: transaction.data as Hex,
      value: toBigInt(transaction.value),
    };
    // compute gas overrides
    const overrides = await withSafeDefaults(publicClient, txBase);
    console.log("Transaction", { ...txBase, ...overrides });
    await sendTransactionAsync({
      ...txBase,
      chainId: parseInt(transaction.chainId),
      ...overrides,
    });
  }

  const signTransaction = () => {
    if (!txPlan) return;
    if (txPlan.length === 1) {
      const transaction = txPlan[0];
      signTx(transaction);
    } else {
      // Handle multiple transactions
      for (const transaction of txPlan) {
        signTx(transaction);
      }
    }
  };

  const approveTransaction = () => {
    if (!txPlan) return;
    if (txPlan.length === 1) {
      return;
    } else {
      if (txPlan.length === 2) {
        signTx(txPlan[0]);
      }
    }
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
                  {error && "Error! " + error}
                </p>
              )}
              <div className="flex gap-3">
                {txPlan?.length > 1 && (
                  <button
                    className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
                    type="button"
                    onClick={() => approveTransaction()}
                  >
                    Approve Transaction
                  </button>
                )}
                <button
                  className="mt-4 bg-red-500 text-white py-2 px-4 rounded"
                  type="button"
                  onClick={() => signTransaction()}
                >
                  Sign Transaction
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
