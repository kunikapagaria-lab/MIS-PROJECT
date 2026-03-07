import { Link, useLocation } from "react-router";
import { ShoppingCart, Package, Truck, FileText, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrderTotals, getOrders, getStock } from "../data/store";
import { getCurrentUser } from "../data/auth";

export function Dashboard() {
  const location = useLocation();
  const [ordersCount, setOrdersCount] = useState(0);
  const [dispatchesCount, setDispatchesCount] = useState(0);
  const [pendingPodCount, setPendingPodCount] = useState(0);
  const [stockBoxes, setStockBoxes] = useState(0);
  const currentUser = getCurrentUser() ?? "there";

  useEffect(() => {
    const orders = getOrders();
    const stock = getStock();
    const totalDispatched = orders.filter((order) => order.status === "Dispatched").length;
    const pendingOrders = orders.filter((order) => order.status !== "Dispatched").length;
    const boxes = stock.reduce((sum, item) => sum + item.boxes, 0);

    setOrdersCount(orders.length);
    setDispatchesCount(totalDispatched);
    setPendingPodCount(pendingOrders);
    setStockBoxes(boxes);
  }, [location.key]);

  const stats = [
    {
      title: "Sales Orders",
      value: String(ordersCount),
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-600",
      link: "/sales-orders",
    },
    {
      title: "In Stock",
      value: `${stockBoxes.toLocaleString("en-IN")} Boxes`,
      icon: Package,
      color: "bg-green-100 text-green-600",
      link: "/stock",
    },
    {
      title: "Dispatched",
      value: String(dispatchesCount),
      icon: Truck,
      color: "bg-orange-100 text-orange-600",
      link: "/sales-orders?view=dispatched",
    },
    {
      title: "Pending Orders",
      value: String(pendingPodCount),
      icon: FileText,
      color: "bg-purple-100 text-purple-600",
      link: "/sales-orders?view=pending",
    },
  ];

  const recentOrders = getOrders().slice(0, 3);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <p className="text-4xl md:text-5xl font-black tracking-tight text-[#8a5a34] mb-2">Welcome, {currentUser}</p>
      <h2 className="text-3xl font-bold mb-8 text-[#5b4332]">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="group soft-glow-card glow-pulse rise-in h-full min-h-[170px] rounded-2xl p-6 hover:shadow-[0_24px_48px_rgba(160,87,35,0.2)] transition-shadow"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl soft-float ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="relative inline-flex items-center justify-center h-7 w-7 text-[#9a775f]">
                <Info size={14} />
                <span className="pointer-events-none absolute right-0 top-8 z-20 w-max max-w-[220px] rounded-lg bg-[#3d2a1f] px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  {stat.title}: {stat.value}
                </span>
              </span>
            </div>
            <h3 className="relative z-10 text-[#5b4332] text-2xl font-bold mb-1">{stat.title}</h3>
          </Link>
        ))}
      </div>

      <div className="soft-glow-card rise-in rounded-2xl p-8" style={{ animationDelay: "240ms" }}>
        <h3 className="text-2xl font-bold mb-6 text-[#4f392b]">Recent Activity</h3>
        <div className="space-y-4">
          {recentOrders.map((order, index) => {
            const totals = getOrderTotals(order);
            const altCardClass =
              index % 2 === 0
                ? "bg-orange-50/95 border-orange-200/90"
                : "bg-white/95 border-[#f2dfd1]";
            return (
              <div
                key={order.id}
                className={`relative z-10 flex min-h-[90px] items-center justify-between rounded-xl border px-4 py-4 ${altCardClass}`}
              >
                <div>
                  <p className="font-semibold">
                    {order.id} {order.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.customer} • {totals.totalBoxes} Boxes
                  </p>
                </div>
                <span className="text-sm text-gray-500">{order.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
