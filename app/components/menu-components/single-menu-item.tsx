"use client";

export default function SingleMenuItem({
  itemId,
  itemName,
  itemDescription,
  itemPrice,
  quantity,
  alterQtyFunction,
}: {
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemPrice: number;
  quantity: number;
  alterQtyFunction: (
    itemId: string,
    name: string,
    price: number,
    count: number,
  ) => void;
}) {
  const lineTotal = itemPrice * quantity;

  return (
    <article className="flex gap-4 border-b border-stone-200 px-4 py-4 last:border-b-0 sm:px-6">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-stone-950">{itemName}</h2>
        <p className="mt-1 text-sm leading-5 text-stone-700">
          {itemDescription}
        </p>
        {quantity > 0 && (
          <p className="mt-2 text-sm font-medium text-stone-800">
            {quantity} × ₹{itemPrice} = ₹{lineTotal}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-3">
        <div className="text-sm font-semibold text-stone-950">₹{itemPrice}</div>
        <div className="min-w-24 rounded-md border border-stone-300 bg-white text-center text-sm font-semibold">
          {quantity > 0 ? (
            <div className="grid grid-cols-3 items-center">
              <button
                type="button"
                onClick={() =>
                  alterQtyFunction(itemId, itemName, itemPrice, quantity - 1)
                }
                className="h-9 rounded-l-md text-lg leading-none text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                aria-label={`Remove one ${itemName}`}
              >
                -
              </button>
              <span className="tabular-nums text-stone-950">{quantity}</span>
              <button
                type="button"
                onClick={() =>
                  alterQtyFunction(itemId, itemName, itemPrice, quantity + 1)
                }
                className="h-9 rounded-r-md text-lg leading-none text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                aria-label={`Add one ${itemName}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => alterQtyFunction(itemId, itemName, itemPrice, 1)}
              className="h-9 w-full rounded-md px-4 text-stone-950 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
