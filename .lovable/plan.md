

## Plan: Category Analytics Card

### What
Add an analytics summary card to the admin Categories page that shows **product count**, **order count**, and **revenue** per category. This will be a collapsible section above the category grid.

### Data Fetching
Add a new `useQuery` that:
1. Fetches all products with their `category_id` and joins to `order_items` via `product_id` to get order/revenue data
2. Since Supabase JS client can't do complex aggregations across joins easily, we'll use two queries:
   - Products grouped by `category_id` (count per category) — fetch all products, aggregate client-side
   - Order items joined with products to get revenue per category — fetch `order_items` with product's `category_id`, aggregate client-side

Query approach:
- Fetch all products (`id, category_id, price`) — already have this or can reuse
- Fetch all order_items (`product_id, total_price, quantity`) with a nested select to get `products(category_id)`
- Client-side: build a map of `category_id → { productCount, orderCount, revenue }`

### UI Design
- Place a toggleable "Category Analytics" card between the header/search bar and the category grid
- Show a responsive grid of mini-stat rows — one per parent category — with columns: Category Name, Products, Orders, Revenue
- Use a simple `Table` or styled card list
- Include a bar chart (Recharts `BarChart`) showing top categories by revenue
- Sortable by any column

### Files to Edit
- **`src/pages/admin/AdminCategories.tsx`**: Add the analytics query, state for toggling visibility, and render the analytics card with table + chart

### Implementation Details
- New `useQuery({ queryKey: ["category-analytics"] })` fetching `order_items` with `products(category_id)` 
- `useMemo` to aggregate into `Map<categoryId, { products: number, orders: number, revenue: number }>`
- Render inside a `Card` with `Collapsible` or simple toggle, containing a `Table` and a small `BarChart`
- Use existing `useCurrency` → `formatPrice` for revenue display

