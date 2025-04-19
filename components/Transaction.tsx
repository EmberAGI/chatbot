"use client";

import { parseTransaction } from "viem";
import { useAccount, useSendTransaction } from "wagmi";

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
    await sendTransactionAsync({
      to: transaction.to,
      data: transaction.data,
      value: toBigInt(transaction.value),
      chainId: transaction.chainId,
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
      signTx(txPlan[0]);
    }
  };

  return (
    //Create a transaction preview card that displays the transaction details
    <div className="flex flex-col gap-2 p-4 bg-white shadow-md rounded-lg text-gray-900">
      <h2 className="text-lg font-semibold">Transaction Preview</h2>

      <div className="flex gap-2">
        <p className="font-semibold">
          From: <span className="font-normal">{txPreview?.fromToken}</span>
        </p>
        <p className="font-semibold">
          To: <span className="font-normal">{txPreview?.toToken}</span>
        </p>
      </div>
      <div className="flex gap-2">
        <p className="font-semibold">
          From Chain:{" "}
          <span className="font-normal">{txPreview?.fromChain}</span>
        </p>
        <p className="font-semibold">
          To Chain: <span className="font-normal">{txPreview?.toChain}</span>
        </p>
      </div>

      <p className="font-semibold">
        Amount:{" "}
        <span className="font-normal">
          {txPreview?.amount} {txPreview?.fromToken}
        </span>
      </p>

      {isConnected ? (
        <>
          <p>{isSuccess && "Success!"}</p>
          <p>{isPending && "Pending..."}</p>
          <p>{error && "Error!"}</p>
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
        <p className="text-red-500">Please connect your wallet</p>
      )}
    </div>
  );
}
