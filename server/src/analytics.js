const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Normalize CSV column names and validate product data.
export function normalizeRow(row, index = 0) {
  const normalized = {};

  for (const [key, value] of Object.entries(row)) {
    normalized[
      String(key)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
    ] = value;
  }

  const get = (...keys) => {
    for (const key of keys) {
      if (normalized[key] !== undefined && normalized[key] !== "") {
        return normalized[key];
      }
    }

    return undefined;
  };

  const product = String(
    get("product", "product_name", "item", "name", "title") ??
      `Product ${index + 1}`,
  ).trim();

  const quantity = number(get("quantity", "units_sold", "units", "qty"), NaN);

  const sellingPrice = number(
    get("selling_price", "price", "sale_price", "sellingprice"),
    NaN,
  );

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error(
      `Row ${index + 2}: quantity/units_sold must be a non-negative number.`,
    );
  }

  if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
    throw new Error(
      `Row ${index + 2}: selling_price/price must be a non-negative number.`,
    );
  }

  const unitCost = number(
    get("unit_cost", "cost", "cost_price", "purchase_price"),
    0,
  );

  const shippingCost = number(
    get("shipping_cost", "shipping", "delivery_cost"),
    0,
  );

  const marketplaceFee = number(
    get("marketplace_fee", "platform_fee", "commission"),
    0,
  );

  const packagingCost = number(get("packaging_cost", "packaging"), 0);

  const discount = number(get("discount", "discount_per_unit"), 0);

  const returns = number(get("returns", "returned_units", "return_units"), 0);

  for (const [field, value] of Object.entries({
    unitCost,
    shippingCost,
    marketplaceFee,
    packagingCost,
    discount,
    returns,
  })) {
    if (value < 0) {
      throw new Error(`Row ${index + 2}: ${field} cannot be negative.`);
    }
  }

  if (returns > quantity) {
    throw new Error(`Row ${index + 2}: returns cannot exceed quantity.`);
  }

  return {
    product,
    quantity,
    selling_price: sellingPrice,
    unit_cost: unitCost,
    shipping_cost: shippingCost,
    marketplace_fee: marketplaceFee,
    packaging_cost: packagingCost,
    discount,
    returns,
  };
}

// Calculate revenue, costs, profit and margin for one product row.
export function calculateRow(row) {
  const netUnits = Math.max(row.quantity - row.returns, 0);

  const netUnitPrice = Math.max(row.selling_price - row.discount, 0);

  const revenue = netUnits * netUnitPrice;

  const unitCostTotal =
    row.unit_cost +
    row.shipping_cost +
    row.marketplace_fee +
    row.packaging_cost;

  const totalCost = netUnits * unitCostTotal;
  const profit = revenue - totalCost;

  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    ...row,
    net_units: netUnits,
    net_unit_price: netUnitPrice,
    revenue: round(revenue),
    total_cost: round(totalCost),
    profit: round(profit),
    margin: round(margin),
  };
}

// Assign recommendation categories using calculated metrics.
// Lower category numbers represent more urgent issues.
function classifyProduct(row) {
  if (row.profit < 0) return 1;
  if (row.revenue === 0) return 2;
  if (row.margin < 15) return 3;
  return 4;
}

// Recommend products deterministically; the AI does not rank them.
export function buildRecommendations(products, limit = 3) {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 3;

  return [...products]
    .sort((a, b) => {
      const categoryDifference = classifyProduct(a) - classifyProduct(b);

      if (categoryDifference !== 0) {
        return categoryDifference;
      }

      // For loss-making products, prioritize larger losses.
      if (a.profit < 0 && b.profit < 0) {
        return a.profit - b.profit;
      }

      // Within other categories, review weaker margins first.
      if (a.margin !== b.margin) {
        return a.margin - b.margin;
      }

      // Use lower profit as a tie-breaker.
      return a.profit - b.profit;
    })
    .slice(0, safeLimit)
    .map((row, index) => {
      let reason;

      if (row.profit < 0) {
        reason =
          "Loss-making product: investigate costs, discounts and pricing.";
      } else if (row.revenue === 0) {
        reason = "No recorded revenue: verify sales and pricing data.";
      } else if (row.margin < 15) {
        reason = "Low-margin product: review costs, discounts and pricing.";
      } else {
        reason =
          "Review opportunity: assess whether costs or pricing can be improved.";
      }

      return {
        product: row.product,
        revenue: row.revenue,
        total_cost: row.total_cost,
        profit: row.profit,
        margin: row.margin,
        net_units: row.net_units,
        priority: index + 1,
        reason,
      };
    });
}

// Aggregate all product metrics and dashboard summaries.
export function buildAnalytics(rows) {
  const products = rows.map(calculateRow).sort((a, b) => b.profit - a.profit);

  const revenue = round(products.reduce((sum, row) => sum + row.revenue, 0));

  const profit = round(products.reduce((sum, row) => sum + row.profit, 0));

  const totalCost = round(
    products.reduce((sum, row) => sum + row.total_cost, 0),
  );

  const units = products.reduce((sum, row) => sum + row.net_units, 0);

  const lossCount = products.filter((row) => row.profit < 0).length;

  const lowMarginCount = products.filter(
    (row) => row.revenue > 0 && row.margin < 15 && row.profit >= 0,
  ).length;

  const bestProduct =
    [...products].sort((a, b) => b.profit - a.profit)[0] ?? null;

  const worstProduct =
    [...products].sort((a, b) => a.profit - b.profit)[0] ?? null;

  const recommendations = buildRecommendations(products);

  return {
    summary: {
      product_count: products.length,
      units_sold: units,
      revenue,
      estimated_cost: totalCost,
      estimated_profit: profit,
      overall_margin: revenue > 0 ? round((profit / revenue) * 100) : 0,
      loss_making_products: lossCount,
      low_margin_products: lowMarginCount,
      best_product: bestProduct?.product ?? null,
      worst_product: worstProduct?.product ?? null,
    },

    products,

    recommendations,

    chart: [...products]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7)
      .map((row) => ({
        product:
          row.product.length > 17
            ? `${row.product.slice(0, 16)}…`
            : row.product,
        revenue: row.revenue,
        profit: row.profit,
        margin: row.margin,
      })),
  };
}

// Give the AI actual calculated figures and deterministic priorities.
export function makeBusinessContext(analytics) {
  const { summary, products } = analytics;

  const recommendations =
    analytics.recommendations ?? buildRecommendations(products);

  return JSON.stringify({
    currency: "INR",
    summary,
    recommended_actions: recommendations,

    products: products.map(
      ({ product, revenue, total_cost, profit, margin, net_units }) => ({
        product,
        revenue,
        total_cost,
        profit,
        margin,
        net_units,
      }),
    ),
  });
}
