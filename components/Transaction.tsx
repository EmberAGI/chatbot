'use client';


interface txPreview {
  fromToken: string;
  toToken: string;
  amount: string;
  fromChain: string;
  toChain: string;
}

export function Transaction({
  txPreview,
  txPlan
}: {
  txPreview: any;
  txPlan: any;
}){

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
      
      <div className="flex flex-col gap-2 mt-4">
        <h3 className="text-lg font-semibold">Transaction Plan</h3>
        {txPlan?.map((step: any, index: number) => (
          <div key={index} className="flex flex-row gap-2">
            <p>{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
  

}
