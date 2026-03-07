import { Link, useParams } from "react-router";
import { Printer } from "lucide-react";
import { addOrderPayment, getOrderTotals, getSalesOrder } from "../data/store";
import { useState } from "react";

export function SalesOrderView() {
  const { id = "" } = useParams();
  const [orderSnapshot, setOrderSnapshot] = useState(() => getSalesOrder(id));
  const order = orderSnapshot ?? getSalesOrder(id);

  if (!order) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold">Sales Order Not Found</h2>
        <p className="text-gray-600 mt-4">No order exists for ID: {id}</p>
        <Link to="/sales-orders" className="text-orange-600 font-semibold mt-4 inline-block">
          Back to Sales Orders
        </Link>
      </main>
    );
  }

  const receivePayment = () => {
    const raw = prompt("Enter amount received:");
    const amount = Number(raw ?? 0);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    const ok = addOrderPayment(order.id, amount);
    if (!ok) {
      alert("Unable to save payment.");
      return;
    }
    alert(`₹${amount.toLocaleString("en-IN")} received successfully.`);
    setOrderSnapshot(getSalesOrder(id));
  };

  const refreshedOrder = getSalesOrder(id) ?? order;
  if (!refreshedOrder) return null;
  const refreshedTotals = getOrderTotals(refreshedOrder);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-start mb-6 gap-4">
              <div>
                <h2 className="text-4xl font-bold text-orange-600">{refreshedOrder.id}</h2>
                <p className="text-gray-600">Date of Order: {refreshedOrder.date}</p>
              </div>
              <div className="text-right">
                <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-medium">
                  {refreshedOrder.status}
                </span>
                {refreshedOrder.podVerified ? (
                  <div className="mt-3">
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-2 inline-flex">
                      <span>✓</span>
                      POD Verified {refreshedOrder.podRating ? `• ${refreshedOrder.podRating} stars` : ""}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
              <div>
                <strong>Customer:</strong> {refreshedOrder.customer}
              </div>
              <div>
                <strong>Address:</strong> {refreshedOrder.address}
              </div>
              <div>
                <strong>Phone:</strong> {refreshedOrder.phone || "-"}
              </div>
              <div>
                <strong>Date of Dispatch:</strong> {refreshedOrder.expectedDate}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
            <div className="px-8 py-6 border-b">
              <h3 className="text-2xl font-bold">Order Items</h3>
            </div>
            <table className="w-full min-w-[720px]">
              <thead className="bg-gray-100 text-sm uppercase">
                <tr>
                  <th className="px-8 py-4 text-left">Product</th>
                  <th className="px-8 py-4 text-center">Size</th>
                  <th className="px-8 py-4 text-center">Shade</th>
                  <th className="px-8 py-4 text-center">Ordered</th>
                  <th className="px-8 py-4 text-center text-green-600">Dispatched</th>
                  <th className="px-8 py-4 text-center text-orange-600">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {refreshedOrder.items.map((item, index) => {
                  const pending = Math.max(0, item.boxes - item.dispatched);
                  return (
                    <tr key={`${item.product}-${index}`}>
                      <td className="px-8 py-5">{item.product}</td>
                      <td className="px-8 py-5 text-center">{item.size}</td>
                      <td className="px-8 py-5 text-center">{item.shade}</td>
                      <td className="px-8 py-5 text-center font-bold text-xl">{item.boxes}</td>
                      <td className="px-8 py-5 text-center font-bold text-xl text-green-600">
                        {item.dispatched}
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-xl text-orange-600">
                        {pending}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg p-8 sticky top-24">
            <h3 className="text-xl font-bold mb-6">Payment & Summary</h3>
            <div className="space-y-4 text-lg">
              <div className="flex justify-between">
                <span>Grand Total</span>
                <span className="font-bold text-orange-600">
                  ₹{refreshedTotals.grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Paid</span>
                <span className="text-green-600 font-bold">
                  ₹{refreshedOrder.paymentsReceived.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Pending</span>
                <span className="text-red-600">
                  ₹{refreshedTotals.pendingPayment.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Boxes</span>
                <span>{refreshedTotals.totalBoxes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending Boxes</span>
                <span>{refreshedTotals.pendingBoxes}</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={receivePayment}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg"
              >
                Receive Payment
              </button>
              <Link
                to={`/dispatch/new/${refreshedOrder.id}`}
                className="block text-center py-5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-xl rounded-xl shadow-lg"
              >
                New Dispatch
              </Link>
              <Link
                to={`/invoice/${refreshedOrder.id}`}
                className="w-full py-4 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Printer size={20} />
                Print Invoice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
