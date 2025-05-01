"use client";

interface IPosition {
  tokenId: string;
  providerId: string;
  symbol0: string;
  symbol1: string;
  amount0: string;
  amount1: string;
  price: string;
}

export function Liquidity({ positions }: { positions: IPosition[] }) {
  return (
    <>
      {positions && (
        <div className="flex flex-col gap-2 p-8 bg-transparent shadow-md rounded-2xl text-white border-red-200 border-2">
          <h2 className="text-lg font-semibold mb-4">Liquidity Positions</h2>
          {positions?.map((x) => (
            <div className="rounded-xl bg-zinc-700 p-4 flex flex-col gap-2">
              <span className="font-normal flex gap-3 w-full items-center text-sm">
                {x.tokenId}{" "}
                <span className="text-xs text-gray-400">
                  {x.symbol0?.toUpperCase()} / {x.symbol1?.toUpperCase()}
                </span>
              </span>

              <p className="font-normal w-full ">
                <span className="font-normal">
                  <span className="font-semibold">
                    {x.amount0} {x.amount0 && x.symbol0?.toUpperCase()}
                  </span>
                  {" (on "}
                  {x.providerId?.toUpperCase()}
                  {")"}
                </span>
              </p>
              <p className="font-normal w-full ">
                <span className="font-normal">
                  <span className="font-semibold">
                    {x.amount1} {x.amount1 && x.symbol1?.toUpperCase()}
                  </span>
                  {" (on "}
                  {x.providerId?.toUpperCase()}
                  {")"}
                </span>
              </p>
              <span className="font-normal flex gap-3 w-full items-center text-sm">
                {x.tokenId}{" "}
                <span className="text-xs text-gray-400">Price: {x.price}</span>
              </span>
              <p className="font-normal w-full bg-zinc-600 rounded-full p-2">
                <span className="font-normal  text-sm">
                  {x.tokenId}
                  {" on "}
                  {x.providerId?.toUpperCase()}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function toBigInt(
  value: string | number | boolean | bigint | undefined
): bigint | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    if (typeof value === "string" && value.toLowerCase().includes("e")) {
      const parts = value.toLowerCase().split("e");
      if (parts.length === 2) {
        const base = Number.parseFloat(parts[0]);
        const exponent = Number.parseInt(parts[1], 10);
        if (!Number.isNaN(base) && !Number.isNaN(exponent)) {
          return BigInt(Math.round(base * Math.pow(10, exponent)));
        }
      }
    }
    return BigInt(value);
  } catch (e) {
    console.error("[toBigInt] Failed to convert value to BigInt:", value, e);
    return undefined;
  }
}
