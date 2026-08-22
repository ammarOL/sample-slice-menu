"use client";
import { useState } from "react";

export default function SampleMenu() {
  const [qty, setQty] = useState(0);

  function handleQtyReduce() {
    setQty((prev) => prev - 1);
  }

  function handleQtyAdd() {
    setQty((prev) => prev + 1);
  }
  return (
    <div className="lg:max-w-5xl lg:w-xl lg:mx-auto border">
      <div className="text-2xl font-medium">
        Cafe Sonder (background image in behind the title as well.)
      </div>
      <div>Serving the best coffee in pune since 1951.</div>
      {/* This is where the menu item starts. */}
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
