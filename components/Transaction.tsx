'use client';

import { parseTransaction } from "viem";
import { useSendTransaction } from "wagmi";


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
  txPlan
}: {
  txPreview: any;
  txPlan: any;
  }) {
  const {
  data: hash,
  error,
  isPending,
  isSuccess,
  sendTransactionAsync,
  } = useSendTransaction();
  console.log(hash)
  
async function signTransaction(data: any) {
  if (!data || !data.transaction_info || !data.transaction_info.transaction)
    return;
  const transaction = parseTransaction(
    data.transaction_info.transaction as `0x${string}`
  );
  if (!transaction.to) return;
  await sendTransactionAsync({
    to: transaction.to,
    data: transaction.data,
    value: toBigInt(transaction.value),
  });
}

  return (
    //Create a transaction preview card that displays the transaction details
    <div className="flex flex-col gap-2 p-4 bg-white shadow-md rounded-lg text-gray-900">
      <h2 className="text-lg font-semibold">Transaction Preview</h2>
      <p>From: {txPreview?.fromToken}</p>
      <p>To: {txPreview?.toToken}</p>
      <p>Amount: {txPreview?.amount}</p>
      <p>From Chain: {txPreview?.fromChain}</p>
      <p>To Chain: {txPreview?.toChain}</p>
      <div className="flex gap-3">
      <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded">
        Confirm Transaction
      </button>
      <button className="mt-4 bg-red-500 text-white py-2 px-4 rounded">
        Cancel Transaction
      </button>
    </div>
    </div>
  );
  

}
