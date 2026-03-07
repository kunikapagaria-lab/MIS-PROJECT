import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Trash2 } from "lucide-react";
import { createSalesOrder, type OrderItem } from "../data/store";

type DraftItem = Pick<OrderItem, "product" | "size" | "shade" | "boxes" | "rate">;

export function SalesOrderNew() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [creator, setCreator] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { product: "", size: "", shade: "", boxes: 0, rate: 3750 },
  ]);

  const addItem = () => {
    setItems((prev) => [...prev, { product: "", size: "", shade: "", boxes: 0, rate: 3750 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DraftItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.boxes * item.rate, 0);
    return {
      subtotal,
      grandTotal: subtotal,
    };
  }, [items]);

  const saveSO = () => {
    if (!customer || !phone || !address || !orderDate || !dispatchDate || !creator) {
      alert("Customer name, phone, address, date of order, date of dispatch and creator are required.");
      return;
    }

    const validItems = items.filter((item) => item.product && item.boxes > 0);
    if (validItems.length === 0) {
      alert("Add at least one item with product and boxes.");
      return;
    }

    const id = createSalesOrder({
      date: orderDate,
      customer,
      site: address,
      address,
      phone,
      gstNumber: "",
      reference,
      creator,
      expectedDate: dispatchDate,
      items: validItems,
    });
    alert(`Sales Order ${id} created successfully.`);
    navigate("/sales-orders");
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Create New Sales Order</h2>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Customer Name *"
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="Reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <div className="space-y-2">
                <label htmlFor="order-date" className="text-sm font-medium text-gray-700">
                  Date of Order *
                </label>
                <input
                  id="order-date"
                  type="date"
                  value={orderDate}
                  onChange={(event) => setOrderDate(event.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dispatch-date" className="text-sm font-medium text-gray-700">
                  Date of Dispatch *
                </label>
                <input
                  id="dispatch-date"
                  type="date"
                  value={dispatchDate}
                  onChange={(event) => setDispatchDate(event.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <input
                type="text"
                placeholder="Address *"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 md:col-span-2"
              />
              <input
                type="text"
                placeholder="Creator *"
                value={creator}
                onChange={(event) => setCreator(event.target.value)}
                className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg font-medium text-sm">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-center">Size</div>
                <div className="col-span-2 text-center">Shade</div>
                <div className="col-span-2 text-center">Boxes</div>
                <div className="col-span-2 text-center">Rate</div>
              </div>

              {items.map((item, index) => (
                <div
                  key={`item-${index}`}
                  className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg items-center"
                >
                  <input
                    type="text"
                    placeholder="Nano Polished"
                    value={item.product}
                    onChange={(event) => updateItem(index, "product", event.target.value)}
                    className="col-span-4 px-4 py-3 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="800x800"
                    value={item.size}
                    onChange={(event) => updateItem(index, "size", event.target.value)}
                    className="col-span-2 px-4 py-3 border rounded-lg text-center"
                  />
                  <input
                    type="text"
                    placeholder="SH-05"
                    value={item.shade}
                    onChange={(event) => updateItem(index, "shade", event.target.value)}
                    className="col-span-2 px-4 py-3 border rounded-lg text-center"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.boxes || ""}
                    onChange={(event) =>
                      updateItem(index, "boxes", Number.parseInt(event.target.value, 10) || 0)
                    }
                    className="col-span-2 px-4 py-3 border rounded-lg text-center"
                  />
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(event) =>
                      updateItem(index, "rate", Number.parseInt(event.target.value, 10) || 0)
                    }
                    className="col-span-2 px-4 py-3 border rounded-lg text-center"
                  />
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={20} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow"
            >
              + Add Item
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-8 sticky top-24">
            <h3 className="text-xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-4 text-lg">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{Math.round(totals.subtotal).toLocaleString("en-IN")}</span>
              </div>
              <hr className="border-t-2 border-orange-200" />
              <div className="flex justify-between text-2xl font-bold text-orange-600">
                <span>Grand Total</span>
                <span>₹{Math.round(totals.grandTotal).toLocaleString("en-IN")}</span>
              </div>
            </div>
            <button
              onClick={saveSO}
              className="w-full mt-8 py-5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold text-xl rounded-xl shadow-lg"
            >
              Save Sales Order
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
