"use client";
import { useEffect, useState } from "react";
import SingleMenuItem from "./menu-components/single-menu-item";
import Link from "next/link";
import { menuItems } from "../data";

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

export default function SampleMenu() {
  const [orderList, setOrderList] = useState<Record<string, OrderItem>>({});
  const [total, setTotal] = useState(0);

  function handleClearCart() {
    // functionality for clearing the whole cart
    setOrderList({});
  }

  function alterQtyFunction(
    itemId: string,
    name: string,
    price: number,
    count: number,
  ) {
    setOrderList((prev: any) => ({
      ...prev,
      [itemId]: {
        name: name,
        price: price,
        quantity: count,
      },
    }));
  }

  useEffect(() => {
    const total = Object.values(orderList).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    setTotal(total);
  }, [orderList]);

  useEffect(() => {
    console.log("Here's the modified orderlist", orderList);
  }, [orderList]);
  return (
    <div className="lg:max-w-5xl lg:w-xl lg:mx-auto border">
      <div className="text-2xl font-medium font-garamond">
        Cafe Sonder (background image in behind the title as well.)
      </div>
      <div className="font-inter">
        Serving the best coffee in pune since 1951.
      </div>
      {/* This is where the menu item starts. */}
      <div>
        {menuItems.map((each) => (
          <SingleMenuItem
            itemId={each.id}
            itemName={each.name}
            itemDescription={each.description}
            itemPrice={each.price}
            quantity={orderList[each.id]?.quantity ?? 0}
            alterQtyFunction={alterQtyFunction}
          />
        ))}
      </div>

      {total !== 0 && (
        <div>
          <div>total price: {total}</div>
          <Link href="/checkout">Checkout</Link>
          <div onClick={handleClearCart}>clear all</div>
        </div>
      )}
    </div>
  );
}
