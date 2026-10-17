export const demoSales = [
  { product: "Cotton T-Shirt", quantity: 120, selling_price: 499, unit_cost: 220, shipping_cost: 45, marketplace_fee: 35, packaging_cost: 12, discount: 20, returns: 3 },
  { product: "Steel Bottle", quantity: 70, selling_price: 349, unit_cost: 145, shipping_cost: 35, marketplace_fee: 25, packaging_cost: 10, discount: 0, returns: 1 },
  { product: "Desk Lamp", quantity: 35, selling_price: 899, unit_cost: 510, shipping_cost: 65, marketplace_fee: 65, packaging_cost: 18, discount: 50, returns: 2 },
  { product: "Canvas Tote Bag", quantity: 95, selling_price: 299, unit_cost: 95, shipping_cost: 30, marketplace_fee: 22, packaging_cost: 8, discount: 10, returns: 4 },
  { product: "Wireless Mouse", quantity: 42, selling_price: 799, unit_cost: 520, shipping_cost: 45, marketplace_fee: 58, packaging_cost: 12, discount: 0, returns: 2 },
  { product: "Ceramic Mug Set", quantity: 56, selling_price: 449, unit_cost: 190, shipping_cost: 55, marketplace_fee: 32, packaging_cost: 20, discount: 25, returns: 5 },
  { product: "Phone Stand", quantity: 150, selling_price: 199, unit_cost: 65, shipping_cost: 25, marketplace_fee: 15, packaging_cost: 6, discount: 0, returns: 2 },
  { product: "Notebook Bundle", quantity: 88, selling_price: 249, unit_cost: 105, shipping_cost: 22, marketplace_fee: 18, packaging_cost: 7, discount: 15, returns: 1 },
  { product: "LED Strip Light", quantity: 30, selling_price: 599, unit_cost: 430, shipping_cost: 48, marketplace_fee: 43, packaging_cost: 10, discount: 40, returns: 2 },
  { product: "Travel Organizer", quantity: 64, selling_price: 399, unit_cost: 155, shipping_cost: 38, marketplace_fee: 28, packaging_cost: 9, discount: 0, returns: 3 }
];

let currentSales = demoSales.map((row) => ({ ...row }));
let currentSource = "Demo dataset";

export function getSales() {
  return currentSales.map((row) => ({ ...row }));
}

export function setSales(rows, source = "Uploaded CSV") {
  currentSales = rows.map((row) => ({ ...row }));
  currentSource = source;
}

export function getSource() {
  return currentSource;
}

export function resetDemo() {
  currentSales = demoSales.map((row) => ({ ...row }));
  currentSource = "Demo dataset";
}
