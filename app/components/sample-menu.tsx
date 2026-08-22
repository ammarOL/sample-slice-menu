"use client";
import { useState } from "react";
import SingleMenuItem from "./menu-components/single-menu-item";

export default function SampleMenu() {
  return (
    <div className="lg:max-w-5xl lg:w-xl lg:mx-auto border">
      <div className="text-2xl font-medium">
        Cafe Sonder (background image in behind the title as well.)
      </div>
      <div>Serving the best coffee in pune since 1951.</div>
      {/* This is where the menu item starts. */}
      <div>
        <SingleMenuItem />
        <SingleMenuItem />

        <SingleMenuItem />

        <SingleMenuItem />
      </div>
    </div>
  );
}
