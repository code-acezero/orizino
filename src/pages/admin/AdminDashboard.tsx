import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Star } from "lucide-react";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, profiles, reviews] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);

      const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
      const pendingOrders = orders.data?.filter((o) => o.status === "pending").length ?? 0;

      return {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        users: profiles.count ?? 0,
        reviews: reviews.count ?? 0,
        revenue: totalRevenue,
        pendingOrders,
      };
    },
  });

  const cards = [
    { title: "Total Revenue", value: `$${(stats?.revenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-primary" },
    { title: "Orders", value: stats?.orders ?? 0, icon: ShoppingCart, color: "text-accent" },
    { title: "Products", value: stats?.products ?? 0, icon: Package, color: "text-primary" },
    { title: "Users", value: stats?.users ?? 0, icon: Users, color: "text-accent" },
    { title: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: TrendingUp, color: "text-destructive" },
    { title: "Reviews", value: stats?.reviews ?? 0, icon: Star, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
