import { buildRecommendations } from "./analytics.js";

import test from "node:test";
import assert from "node:assert/strict";

test("prioritizes loss-making products", () => {
  const products = [
    {
      product: "Healthy",
      revenue: 100,
      total_cost: 70,
      profit: 30,
      margin: 30,
      net_units: 1,
    },
    {
      product: "Loss",
      revenue: 100,
      total_cost: 120,
      profit: -20,
      margin: -20,
      net_units: 1,
    },
  ];

  const result = buildRecommendations(products);

  assert.equal(result[0].product, "Loss");
});

test("prioritizes lower margins within the same category", () => {
  const products = [
    {
      product: "Higher margin",
      revenue: 100,
      total_cost: 70,
      profit: 30,
      margin: 30,
      net_units: 1,
    },
    {
      product: "Lower margin",
      revenue: 100,
      total_cost: 90,
      profit: 10,
      margin: 10,
      net_units: 1,
    },
  ];

  const result = buildRecommendations(products);

  assert.equal(result[0].product, "Lower margin");
});

test("returns no recommendations for an empty dataset", () => {
  assert.deepEqual(buildRecommendations([]), []);
});

test("respects the recommendation limit", () => {
  const products = [
    {
      product: "A",
      revenue: 100,
      total_cost: 90,
      profit: 10,
      margin: 10,
      net_units: 1,
    },
    {
      product: "B",
      revenue: 100,
      total_cost: 80,
      profit: 20,
      margin: 20,
      net_units: 1,
    },
    {
      product: "C",
      revenue: 100,
      total_cost: 70,
      profit: 30,
      margin: 30,
      net_units: 1,
    },
    {
      product: "D",
      revenue: 100,
      total_cost: 60,
      profit: 40,
      margin: 40,
      net_units: 1,
    },
  ];

  assert.equal(buildRecommendations(products, 2).length, 2);
});
