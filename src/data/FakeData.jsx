import CATEGORY from '../constants/Category';
import BUSINESS from '../constants/Business';

export const INIT_CURRENT_LOCATION = {
  streetName: 'Ixhuatlan de Madero',
  gps: {
    latitude: 1.5496614931250685,
    longitude: 110.36381866919922,
  },
};

export const DATA_CATEGORY = [
  {
    id: 1,
    name: 'Pasteles',
    icon: CATEGORY.cakes,
  },
  {
    id: 2,
    name: 'Pizza',
    icon: CATEGORY.pizza,
  },
  {
    id: 3,
    name: 'Pollo',
    icon: CATEGORY.chicken,
  },
  {
    id: 4,
    name: 'Hamburguesas',
    icon: CATEGORY.hamburger,
  },
];

export const DATA_BUSINESS = [
  {
    id: 1,
    cellPhone: 8117975347,
    name: 'Hamburguesas',
    businessName: 'Burger Llanos',
    isOpen: true,
    schedule: '9:00 AM - 6:30 PM',
    rating: 4.8,
    categories: [4],
    priceRating: 'fairPrice',
    photo: BUSINESS.burgerRestaurant1,
    duration: '30 - 45 min',
    location: {
      latitude: 1.5347282806345879,
      longitude: 110.35632207358996,
    },
    menu: [
      {
        menuId: 1,
        name: 'Hamburguesa de pollo crujiente',
        photo: BUSINESS.crispyChickenBurger,
        description: 'Hamburguesa con pollo crujiente, queso y lechuga.',
        calories: 200,
        price: 80,
      },
      {
        menuId: 2,
        name: 'Hamburguesa de pollo crujiente con mostaza y miel',
        photo: BUSINESS.honeyMustardChickenBurger,
        description:
          'Hamburguesa de pollo crujiente con ensalada de col con mostaza y miel',
        calories: 250,
        price: 115,
      },
      {
        menuId: 3,
        name: 'Papas fritas crujientes al horno',
        photo: BUSINESS.bakedFries,
        description: 'Papas fritas crujientes al horno',
        calories: 194,
        price: 90,
      },
    ],
  },
  {
    id: 2,
    cellPhone: 8117975347,
    name: "Pizza's",
    businessName: 'Mamamia pizzas',
    isOpen: false,
    schedule: '6:00 PM - 10:30 PM',
    rating: 4.3,
    categories: [2],
    priceRating: 'expensive',
    photo: BUSINESS.pizzaRestaurant,
    duration: '15 - 20 min',
    location: {
      latitude: 1.556306570595712,
      longitude: 110.35504616746915,
    },
    menu: [
      {
        menuId: 4,
        name: 'Hawaian Pizza',
        photo: BUSINESS.hawaiianPizza,
        description: 'Tocino canadiense, masa de pizza casera, salsa de pizza',
        calories: 250,
        price: 150,
      },
      {
        menuId: 5,
        name: 'Tomato & Basil Pizza',
        photo: BUSINESS.pizza,
        description:
          'Tomates frescos, pesto aromático de albahaca y bocconcini fundidos',
        calories: 250,
        price: 130,
      },
      {
        menuId: 6,
        name: 'Sopa de tomate',
        photo: BUSINESS.tomatoPasta,
        description: 'Pasta con tomates frescos',
        calories: 100,
        price: 100,
      },
      {
        menuId: 7,
        name: 'Mediterranean Chopped Salad ',
        photo: BUSINESS.salad,
        description: 'Lechuga finamente picada, tomates, pepinos.',
        calories: 160,
        price: 100,
      },
    ],
  },
  {
    id: 3,
    cellPhone: 8117975347,
    name: 'Pollos a la parrilla',
    businessName: 'La parrilla ixhuateca',
    isOpen: true,
    schedule: '10:00 AM - 5:30 PM',
    rating: 4.9,
    categories: [3],
    priceRating: 'fairPrice',
    photo: BUSINESS.polloCover,
    duration: '30 - 45 min',
    location: {
      latitude: 1.5347282806345879,
      longitude: 110.35632207358996,
    },
    menu: [
      {
        menuId: 1,
        name: 'Pollo asado pack 1',
        photo: BUSINESS.polloHorno,
        description: 'Pollo al horno apetitoso con naranjas y arandanos',
        calories: 200,
        price: 180,
      },
      {
        menuId: 2,
        name: 'Pollo emparrillado pack 2',
        photo: BUSINESS.polloParrilla,
        description:
          'Pollo jugoso emparrillado con salsa verde y cebollas asadas',
        calories: 250,
        price: 190,
      },
    ],
  },
];
