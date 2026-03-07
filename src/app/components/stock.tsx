import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { getStock, updateStock } from "../data/store";

export function Stock() {
  const [items, setItems] = useState(getStock());
  const [isEditing, setIsEditing] = useState(false);
  const [draftItems, setDraftItems] = useState(getStock());

  const startEdit = () => {
    setDraftItems(items);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftItems(items);
    setIsEditing(false);
  };

  const saveEdit = () => {
    const updated = updateStock(draftItems);
    setItems(updated);
    setDraftItems(updated);
    setIsEditing(false);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Current Stock</h2>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={saveEdit}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow flex items-center gap-2"
              >
                <Save size={20} />
                Save Stock
              </button>
              <button
                onClick={cancelEdit}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow flex items-center gap-2"
              >
                <X size={20} />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow flex items-center gap-2"
            >
              <Pencil size={20} />
              Edit Stock
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left">Product</th>
              <th className="px-6 py-4 text-center">Shade</th>
              <th className="px-6 py-4 text-center">Size</th>
              <th className="px-6 py-4 text-center">Boxes in Stock</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(isEditing ? draftItems : items).map((item, index) => {
              const isLow = item.boxes < 100;
              return (
                <tr key={`${item.product}-${index}`} className={isLow ? "bg-red-50" : "hover:bg-gray-50"}>
                  <td className="px-6 py-5 font-medium">{item.product}</td>
                  <td className="px-6 py-5 text-center">{item.shade}</td>
                  <td className="px-6 py-5 text-center">{item.size}</td>
                  <td
                    className={`px-6 py-5 text-center text-2xl font-bold ${
                      isLow ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={item.boxes}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          setDraftItems((prev) =>
                            prev.map((entry, i) =>
                              i === index ? { ...entry, boxes: Number.isFinite(next) ? next : 0 } : entry,
                            ),
                          );
                        }}
                        className="w-28 px-3 py-2 border rounded text-center text-lg font-bold"
                      />
                    ) : (
                      item.boxes
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {isLow ? (
                      <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-xs">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
