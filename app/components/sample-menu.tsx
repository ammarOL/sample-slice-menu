"use client";
import { useEffect, useState } from "react";
import SingleMenuItem from "./menu-components/single-menu-item";

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

export default function SampleMenu() {
  const [orderList, setOrderList] = useState<Record<string, OrderItem>>({});

  function alterQtyFunction(
    itemId: string,
    name: string,
    count: number,
    price: number,
  ) {
    setOrderList((prev: any) => ({
      ...prev,
      [itemId]: {
        name,
        price,
        count,
      },
    }));
  }

  useEffect(() => {
    console.log("Here's the modified orderlist", orderList);
  }, [orderList]);
  return (
    <div className="lg:max-w-5xl lg:w-xl lg:mx-auto border">
      <div className="text-2xl font-medium">
        Cafe Sonder (background image in behind the title as well.)
      </div>
      <div>Serving the best coffee in pune since 1951.</div>
      {/* This is where the menu item starts. */}
      <div>
        <SingleMenuItem
          itemId="1"
          itemName="garlic bread"
          itemDescription="fresh baked bread with garlic and cheese toppings."
          itemPrice={300}
          alterQtyFunction={alterQtyFunction}
        />
        <SingleMenuItem
          itemId="2"
          itemName="garlic bread"
          itemDescription="fresh baked bread with garlic and cheese toppings."
          itemPrice={300}
          alterQtyFunction={alterQtyFunction}
        />
        <SingleMenuItem
          itemId="3"
          itemName="garlic bread"
          itemDescription="fresh baked bread with garlic and cheese toppings."
          itemPrice={300}
          alterQtyFunction={alterQtyFunction}
        />
      </div>
    </div>
  );
}
