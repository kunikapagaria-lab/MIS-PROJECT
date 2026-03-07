import { ChangeEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Plus, FileSpreadsheet, Eye, Download, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { getDispatchPriority, getOrderTotals, getOrders, importSalesOrdersFromRows } from "../data/store";

type BulkMode = "file" | "manual";

interface ManualOrderRow {
  id: string;
  date: string;
  customer: string;
  site: string;
  phone: string;
  expectedDate: string;
  product: string;
  size: string;
  shade: string;
  boxes: string;
}

function getTodayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function createManualRow(): ManualOrderRow {
  const today = getTodayISODate();
  return {
    id: "",
    date: today,
    customer: "",
    site: "",
    phone: "",
    expectedDate: today,
    product: "",
    size: "800x800",
    shade: "",
    boxes: "",
  };
}

export function SalesOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState(getOrders());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<BulkMode>("file");
  const [previewData, setPreviewData] = useState<unknown[][]>([]);
  const [manualRows, setManualRows] = useState<ManualOrderRow[]>([createManualRow()]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const view = searchParams.get("view");

  const filteredOrders = orders.filter((order) => {
    if (view === "dispatched") return order.status === "Dispatched";
    if (view === "pending") return order.status !== "Dispatched";
    return true;
  });

  const title =
    view === "dispatched" ? "Dispatched Orders" : view === "pending" ? "Pending Orders" : "Sales Orders";

  const handleExcelUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      setPreviewData(rows.slice(1).filter((row) => row[0]));
    };
    reader.readAsBinaryString(file);
  };

  const handleManualRowChange = (index: number, field: keyof ManualOrderRow, value: string) => {
    setManualRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addManualRow = () => {
    setManualRows((rows) => [...rows, createManualRow()]);
  };

  const removeManualRow = (index: number) => {
    setManualRows((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));
  };

  const getManualRowsAsImportRows = () =>
    manualRows
      .filter((row) => row.id.trim())
      .map((row) => [
        row.id.trim(),
        row.date,
        row.customer,
        row.site,
        row.phone,
        row.expectedDate,
        row.product,
        row.size,
        row.shade,
        Number(row.boxes) || 0,
      ]);

  const createBulkOrders = () => {
    const rows = bulkMode === "file" ? previewData : getManualRowsAsImportRows();
    if (!rows.length) {
      alert("Please add at least one valid row before creating orders.");
      return;
    }
    const created = importSalesOrdersFromRows(rows);
    if (!created) {
      alert("No new orders were created. Check SO numbers for duplicates.");
      return;
    }
    alert(`${created} orders created successfully.`);
    setOrders(getOrders());
    setPreviewData([]);
    setManualRows([createManualRow()]);
    setBulkModalOpen(false);
  };

  const downloadOrdersExcel = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates.");
      return;
    }
    const fromTs = new Date(`${fromDate}T00:00:00`).getTime();
    const toTs = new Date(`${toDate}T23:59:59`).getTime();
    if (!Number.isFinite(fromTs) || !Number.isFinite(toTs) || fromTs > toTs) {
      alert("Please select a valid date range.");
      return;
    }

    const rows = getOrders()
      .filter((order) => {
        const orderTs = new Date(`${order.date}T12:00:00`).getTime();
        return Number.isFinite(orderTs) && orderTs >= fromTs && orderTs <= toTs;
      })
      .flatMap((order) =>
        order.items.map((item) => [
          order.id,
          order.date,
          order.customer,
          order.site,
          order.phone,
          order.expectedDate,
          order.status,
          item.product,
          item.size,
          item.shade,
          item.boxes,
          item.dispatched,
          item.rate,
          item.boxes * item.rate,
          order.paymentsReceived,
        ]),
      );

    if (!rows.length) {
      alert("No orders found for selected date range.");
      return;
    }

    const header = [
      [
        "SO No",
        "Order Date",
        "Customer",
        "Site",
        "Phone",
        "Expected Date",
        "Status",
        "Product",
        "Size",
        "Shade",
        "Ordered Boxes",
        "Dispatched Boxes",
        "Rate",
        "Line Amount",
        "Payments Received",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Orders");
    XLSX.writeFile(wb, `SalesOrders_${fromDate}_to_${toDate}.xlsx`);
    setDownloadModalOpen(false);
  };

  const downloadTemplate = () => {
    const data = [
      ["SO No", "Date", "Customer Name", "Site", "Phone", "Expected Date", "Product", "Size", "Shade", "Boxes"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "OrderTrail_Bulk_Template.xlsx");
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold">{title}</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/sales-order/new"
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow flex items-center gap-2"
          >
            <Plus size={20} />
            New Sales Order
          </Link>
          <button
            onClick={() => setBulkModalOpen(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow flex items-center gap-2"
          >
            <FileSpreadsheet size={20} />
            Bulk Upload Excel
          </button>
          <button
            onClick={() => setDownloadModalOpen(true)}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow flex items-center gap-2"
          >
            <Download size={20} />
            Download Excel
          </button>
          <Link
            to="/dispatch/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
          >
            New Dispatch
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 text-left">ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4 text-center">Boxes</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">POD</th>
              <th className="px-6 py-4 text-center">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const totals = getOrderTotals(order);
              const priority = getDispatchPriority(order.expectedDate);
              const priorityClass =
                priority === "High"
                  ? "bg-red-100 text-red-700"
                  : priority === "Medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700";
              const rowClass =
                priority === "High"
                  ? "hover:bg-red-50 bg-red-50/40"
                  : priority === "Medium"
                    ? "hover:bg-amber-50 bg-amber-50/30"
                    : "hover:bg-gray-50";
              const statusClass =
                order.status === "Pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : order.status.includes("Partial")
                    ? "bg-orange-100 text-orange-800"
                    : "bg-green-100 text-green-800";
              return (
                <tr
                  key={order.id}
                  className={`${rowClass} cursor-pointer`}
                  onClick={() => navigate(`/sales-order/${order.id}`)}
                >
                  <td className="px-6 py-4 font-bold text-orange-600">{order.id}</td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 text-center font-bold">{totals.totalBoxes}</td>
                  <td className="px-6 py-4 text-right font-bold">
                    ₹{totals.grandTotal.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityClass}`}>
                      {priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${statusClass}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {order.podVerified ? `Verified${order.podRating ? ` (${order.podRating}★)` : ""}` : "Pending"}
                  </td>
                  <td className="px-6 py-4 text-center text-blue-600">
                    <Link
                      to={`/sales-order/${order.id}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Eye size={20} className="inline" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                  No orders found for this list.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8">
            <h3 className="text-2xl font-bold mb-6">Bulk Upload Sales Orders</h3>
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setBulkMode("file")}
                className={`px-4 py-2 rounded-lg font-semibold ${bulkMode === "file" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Upload Excel File
              </button>
              <button
                onClick={() => setBulkMode("manual")}
                className={`px-4 py-2 rounded-lg font-semibold ${bulkMode === "manual" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Manual Entry
              </button>
            </div>

            {bulkMode === "file" ? (
              <>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="block w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded file:bg-green-600 file:text-white file:border-0 file:cursor-pointer mb-6"
                />

                <button
                  onClick={downloadTemplate}
                  className="text-orange-600 font-bold mb-6 inline-block"
                >
                  Download Excel Template
                </button>
              </>
            ) : (
              <div className="mb-6">
                <div className="max-h-80 overflow-auto border rounded-lg">
                  <table className="w-full text-sm min-w-[1100px]">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">SO No</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Customer</th>
                        <th className="p-2 text-left">Site</th>
                        <th className="p-2 text-left">Phone</th>
                        <th className="p-2 text-left">Expected Date</th>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-left">Size</th>
                        <th className="p-2 text-left">Shade</th>
                        <th className="p-2 text-left">Boxes</th>
                        <th className="p-2 text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualRows.map((row, index) => (
                        <tr key={`manual-row-${index}`} className="border-t">
                          <td className="p-2">
                            <input value={row.id} onChange={(e) => handleManualRowChange(index, "id", e.target.value)} className="w-28 border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.date} onChange={(e) => handleManualRowChange(index, "date", e.target.value)} className="border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input value={row.customer} onChange={(e) => handleManualRowChange(index, "customer", e.target.value)} className="w-36 border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input value={row.site} onChange={(e) => handleManualRowChange(index, "site", e.target.value)} className="w-36 border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input value={row.phone} onChange={(e) => handleManualRowChange(index, "phone", e.target.value)} className="w-32 border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input type="date" value={row.expectedDate} onChange={(e) => handleManualRowChange(index, "expectedDate", e.target.value)} className="border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input value={row.product} onChange={(e) => handleManualRowChange(index, "product", e.target.value)} className="w-36 border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input value={row.size} onChange={(e) => handleManualRowChange(index, "size", e.target.value)} className="w-24 border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input value={row.shade} onChange={(e) => handleManualRowChange(index, "shade", e.target.value)} className="w-24 border rounded px-2 py-1" />
                          </td>
                          <td className="p-2">
                            <input type="number" min={0} value={row.boxes} onChange={(e) => handleManualRowChange(index, "boxes", e.target.value)} className="w-24 border rounded px-2 py-1" />
                          </td>
                          <td className="p-2 text-center">
                            <button onClick={() => removeManualRow(index)} className="text-red-600 hover:text-red-700">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={addManualRow}
                  className="mt-4 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
                >
                  + Add Row
                </button>
              </div>
            )}

            {(bulkMode === "file" ? previewData.length > 0 : getManualRowsAsImportRows().length > 0) && (
              <div className="mt-6">
                <p className="font-bold text-lg mb-4">
                  Preview: {(bulkMode === "file" ? previewData.length : getManualRowsAsImportRows().length)} orders will be created
                </p>
                {bulkMode === "file" ? (
                  <div className="max-h-96 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="p-3 text-left">SO No</th>
                          <th>Customer</th>
                          <th>Site</th>
                          <th>Product</th>
                          <th className="text-right">Boxes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={`${row[0] ?? "row"}-${index}`} className="border-t">
                            <td className="p-3">{String(row[0] ?? "")}</td>
                            <td className="p-3">{String(row[2] ?? "")}</td>
                            <td className="p-3">{String(row[3] ?? "")}</td>
                            <td className="p-3">{String(row[6] ?? "")}</td>
                            <td className="p-3 text-right">{String(row[9] ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                <button
                  onClick={createBulkOrders}
                  className="mt-6 w-full py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-lg"
                >
                  Create All Orders Now
                </button>
              </div>
            )}

            <button
              onClick={() => setBulkModalOpen(false)}
              className="mt-6 text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {downloadModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8">
            <h3 className="text-2xl font-bold mb-6">Download Sales Orders Excel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-semibold text-gray-700">
                From Date
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2"
                />
              </label>
              <label className="text-sm font-semibold text-gray-700">
                To Date
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-orange-200 px-3 py-2"
                />
              </label>
            </div>
            <button
              onClick={downloadOrdersExcel}
              className="mt-6 w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-lg font-bold rounded-lg"
            >
              Download Excel
            </button>
            <button
              onClick={() => setDownloadModalOpen(false)}
              className="mt-4 text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
