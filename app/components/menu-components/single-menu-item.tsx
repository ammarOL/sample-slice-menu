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
      <div className="flex justify-between border px-2 py-2">
        <div>
          <div>{itemName}</div>
          <div>{itemDescription}</div>
        </div>
        <div>
          <div>₹{itemPrice}</div>
          <div className="border px-3 py-1 text-center">
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
