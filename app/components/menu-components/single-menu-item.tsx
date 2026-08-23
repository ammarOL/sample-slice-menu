"use client";
import { useState } from "react";
import { useEffect } from "react";

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
  const [qty, setQty] = useState(0);

  function handleQtyReduce() {
    setQty((prev) => prev - 1);
  }

  function handleQtyAdd() {
    setQty((prev) => prev + 1);
  }

  useEffect(() => {
    alterQtyFunction(itemId, itemName, itemPrice, qty);
  }, [qty]);
  // add the menu item component right here.
  return (
    <div>
      <div className="flex justify-between border-b border-gray-200 px-2 py-4">
        <div>
          <div className="text-xl">{itemName}</div>
          <div className="text-sm text-gray-800">{itemDescription}</div>
        </div>
        <div className="border border-red-200">
          <div className="text-right">₹{itemPrice}</div>
          <div className="border border-gray-400 px-4 rounded-sm py-1 text-center mt-3">
            {quantity > 0 ? (
              <div className="flex gap-3 justify-center">
                <div onClick={handleQtyReduce}>-</div>
                <div>{quantity}</div>
                <div onClick={handleQtyAdd}>+</div>{" "}
              </div>
            ) : (
              <div onClick={() => setQty(1)}>Add</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
