"use client";
import { useState } from "react";

export default function SingleMenuItem() {
  const [qty, setQty] = useState(0);

  function handleQtyReduce() {
    setQty((prev) => prev - 1);
  }

  function handleQtyAdd() {
    setQty((prev) => prev + 1);
  }
  // add the menu item component right here.
  return (
    <div>
      <div className="flex justify-between border px-2 py-2">
        <div>
          <div>Affogato</div>
          <div>Coffee topped with ice-cream, a true italian delight.</div>
        </div>
        <div>
          <div>Item Picture (if exists)</div>
          <div className="border px-3 py-1 text-center">
            {qty > 0 ? (
              <div className="flex gap-3 justify-center">
                <div onClick={handleQtyReduce}>-</div>
                <div>{qty}</div>
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
