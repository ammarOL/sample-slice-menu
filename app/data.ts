export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVegetarian: boolean;
};

export const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Garlic Bread",
    description: "Fresh baked bread with garlic and cheese toppings.",
    price: 300,
    category: "Breads & Sides",
    isVegetarian: true,
  },
  {
    id: "2",
    name: "Margherita Pizza",
    description: "Classic pizza with tomato, mozzarella, and fresh basil.",
    price: 450,
    category: "Pizzas",
    isVegetarian: true,
  },
  {
    id: "3",
    name: "Paneer Tikka",
    description: "Grilled paneer cubes marinated in aromatic spices.",
    price: 380,
    category: "Mains",
    isVegetarian: true,
  },
  {
    id: "4",
    name: "Penne Arrabbiata",
    description: "Penne pasta tossed in a spicy tomato and garlic sauce.",
    price: 420,
    category: "Pasta",
    isVegetarian: true,
  },
  {
    id: "5",
    name: "Cappuccino",
    description: "Espresso with steamed milk and a layer of milk foam.",
    price: 220,
    category: "Coffee",
    isVegetarian: true,
  },
  {
    id: "6",
    name: "Iced Latte",
    description: "Chilled espresso blended with cold milk over ice.",
    price: 250,
    category: "Coffee",
    isVegetarian: true,
  },
  {
    id: "7",
    name: "Chocolate Brownie",
    description: "Warm, fudgy chocolate brownie served with chocolate sauce.",
    price: 280,
    category: "Desserts",
    isVegetarian: true,
  },
  {
    id: "8",
    name: "Classic Cheesecake",
    description: "Creamy New York-style cheesecake with a biscuit crust.",
    price: 320,
    category: "Desserts",
    isVegetarian: true,
  },
];
