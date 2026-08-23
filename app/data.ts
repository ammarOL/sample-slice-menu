export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVegetarian: boolean;
  isBestseller: boolean;
  imageUrl: string;
};

export const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Garlic Bread",
    description: "Fresh baked bread with garlic and cheese toppings.",
    price: 300,
    category: "Breads & Sides",
    isVegetarian: true,
    isBestseller: false,
    imageUrl:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "2",
    name: "Margherita Pizza",
    description: "Classic pizza with tomato, mozzarella, and fresh basil.",
    price: 450,
    category: "Pizzas",
    isVegetarian: true,
    isBestseller: true,
    imageUrl:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "3",
    name: "Paneer Tikka",
    description: "Grilled paneer cubes marinated in aromatic spices.",
    price: 380,
    category: "Mains",
    isVegetarian: true,
    isBestseller: true,
    imageUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "4",
    name: "Penne Arrabbiata",
    description: "Penne pasta tossed in a spicy tomato and garlic sauce.",
    price: 420,
    category: "Pasta",
    isVegetarian: true,
    isBestseller: false,
    imageUrl:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "5",
    name: "Cappuccino",
    description: "Espresso with steamed milk and a layer of milk foam.",
    price: 220,
    category: "Coffee",
    isVegetarian: true,
    isBestseller: true,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "6",
    name: "Iced Latte",
    description: "Chilled espresso blended with cold milk over ice.",
    price: 250,
    category: "Coffee",
    isVegetarian: true,
    isBestseller: false,
    imageUrl:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "7",
    name: "Chocolate Brownie",
    description: "Warm, fudgy chocolate brownie served with chocolate sauce.",
    price: 280,
    category: "Desserts",
    isVegetarian: true,
    isBestseller: true,
    imageUrl:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "8",
    name: "Classic Cheesecake",
    description: "Creamy New York-style cheesecake with a biscuit crust.",
    price: 320,
    category: "Desserts",
    isVegetarian: true,
    isBestseller: false,
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=320&q=80",
  },
];
