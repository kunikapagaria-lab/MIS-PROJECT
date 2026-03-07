import { useParams } from "react-router";
import { getOrderTotals, getSalesOrder } from "../data/store";

export function InvoicePrint() {
  const { id = "" } = useParams();
  const order = getSalesOrder(id);

  if (!order) {
    return (
      <div className="bg-gray-100 min-h-screen p-10">
        <h1 className="text-3xl font-bold">Invoice Not Found</h1>
      </div>
    );
  }

  const totals = getOrderTotals(order);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl">
        <div className="border-b-4 border-orange-600 p-8 text-center">
          <h1 className="text-4xl font-bold text-orange-600">SALES INVOICE</h1>
          <p className="text-xl mt-2">Vijay Ceramics</p>
          <p>Phone: +91 98765 43210</p>
          <p>8-A, National Highway, Jamshedpur-363642, West Bengal</p>
        </div>

        <div className="grid grid-cols-2 gap-8 p-8 border-b">
          <div>
            <h3 className="font-bold text-lg mb-3">Billed To:</h3>
            <p className="font-semibold">{order.customer}</p>
            <p>{order.address || order.site}</p>
            <p>Phone: {order.phone || "N/A"}</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Ship To:</h3>
            <p className="font-semibold">{order.site}</p>
            <p>{order.address || "-"}</p>
            <p>Reference: {order.reference || "-"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 p-8 border-b bg-gray-50">
          <div>
            <p>
              <strong>Invoice No:</strong> INV-{id}
            </p>
            <p>
              <strong>Date:</strong> {order.date}
            </p>
          </div>
          <div>
            <p>
              <strong>Sales Order:</strong> {id}
            </p>
            <p>
              <strong>Date of Dispatch:</strong> {order.expectedDate}
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-orange-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left">Description</th>
              <th className="px-6 py-4 text-center">HSN</th>
              <th className="px-6 py-4 text-center">Qty (Boxes)</th>
              <th className="px-6 py-4 text-center">Rate/Box</th>
              <th className="px-6 py-4 text-center">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item, index) => (
              <tr key={`${item.product}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-5">
                  {item.product} {item.size} {item.shade}
                </td>
                <td className="text-center">6907</td>
                <td className="text-center font-bold">{item.boxes}</td>
                <td className="text-center">₹{item.rate.toLocaleString("en-IN")}</td>
                <td className="text-right font-bold">
                  ₹{Math.round(item.rate * item.boxes).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            <tr className="bg-orange-50 font-bold text-lg">
              <td colSpan={4} className="px-6 py-5 text-right">
                Sub Total
              </td>
              <td className="text-right">₹{totals.subtotal.toLocaleString("en-IN")}</td>
            </tr>
            <tr className="bg-orange-600 text-white font-bold text-xl">
              <td colSpan={4} className="px-6 py-5 text-right">
                Grand Total
              </td>
              <td className="text-right">₹{totals.grandTotal.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        <div className="p-8 border-t-4 border-orange-600 bg-gray-50">
          <p>
            <strong>Amount in Words:</strong> Rupees {totals.grandTotal.toLocaleString("en-IN")} Only
          </p>
        </div>

        <div className="p-8 text-center text-gray-600 border-t">
          <p className="font-bold text-lg">Thank you for your business!</p>
          <p>Bank: HDFC Bank • A/c: 50200012345678 • IFSC: HDFC0000123</p>
          <p className="mt-6 text-xs">This is a computer-generated invoice • Authorized Signatory</p>
        </div>
      </div>

      <div className="no-print text-center mt-10 mb-10">
        <button
          onClick={() => window.print()}
          className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-lg mr-4"
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg"
        >
          Close
        </button>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}
