import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import QRCode from "qrcode";
import {
  getOrders,
  getSalesOrder,
  queueDispatchMessageForOrder,
  saveDispatchForOrder,
  type PodStatus,
} from "../data/store";

export function DispatchNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orders = getOrders();
  const [selectedOrderId, setSelectedOrderId] = useState(id ?? "");
  const order = getSalesOrder(selectedOrderId);
  const [dispatchDate, setDispatchDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driver, setDriver] = useState("");
  const [quantities, setQuantities] = useState<number[]>([]);
  const [podStatus, setPodStatus] = useState<PodStatus>("Pending");
  const [proofType, setProofType] = useState<"camera" | "url">("camera");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrlInput, setProofUrlInput] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [podUrl, setPodUrl] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSelectedOrderId(id ?? "");
  }, [id]);

  useEffect(() => {
    if (order) {
      const pendingQty = order.items.map((item) => Math.max(0, item.boxes - item.dispatched));
      setQuantities(pendingQty.map(() => 0));
    } else {
      setQuantities([]);
    }
  }, [order?.id]);

  useEffect(() => {
    if (podStatus === "Verified" && qrCanvasRef.current && selectedOrderId) {
      const longUrl = `${window.location.origin}/feedback/${selectedOrderId}`;
      setPodUrl(longUrl);
      QRCode.toCanvas(qrCanvasRef.current, longUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }
  }, [podStatus, selectedOrderId]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not supported on this browser/device.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch {
      setCameraError("Unable to open camera. Please allow camera permission.");
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !captureCanvasRef.current) return;
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      setCameraError("Camera not ready yet. Try again.");
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Failed to capture photo. Try again.");
        return;
      }
      const file = new File([blob], `pod-${selectedOrderId || "dispatch"}.jpg`, {
        type: "image/jpeg",
      });
      setProofFile(file);
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  useEffect(() => {
    if (proofType !== "camera" || !order) {
      stopCamera();
    }
  }, [proofType, order?.id]);

  const pendingByRow = (order?.items ?? []).map((item) => Math.max(0, item.boxes - item.dispatched));

  const updateQty = (index: number, value: number) => {
    setQuantities((prev) =>
      prev.map((item, i) => (i === index ? Math.max(0, Math.min(pendingByRow[index], value)) : item)),
    );
  };

  const saveDispatch = () => {
    if (!selectedOrderId || !order) {
      alert("Please select a Sales Order ID.");
      return;
    }
    if (!dispatchDate || !vehicleNo || !driver) {
      alert("Dispatch date, vehicle number and driver details are required.");
      return;
    }
    if (proofType === "camera" && !proofFile) {
      alert("POD photo proof is mandatory. Please capture a photo.");
      return;
    }
    if (proofType === "url" && !proofUrlInput.trim()) {
      alert("POD photo proof is mandatory. Please provide a photo URL.");
      return;
    }
    if (quantities.every((qty) => qty <= 0)) {
      alert("Please enter dispatch quantity for at least one item.");
      return;
    }
    const ok = saveDispatchForOrder({
      orderId: selectedOrderId,
      quantities,
      podStatus,
    });
    if (!ok) {
      alert("Failed to save dispatch.");
      return;
    }
    const dispatchedBoxes = quantities.reduce((sum, qty) => sum + Math.max(0, qty), 0);
    const message = queueDispatchMessageForOrder({
      orderId: selectedOrderId,
      dispatchDate,
      dispatchedBoxes,
      channel: "whatsapp",
    });
    if (message) {
      const openSender = window.confirm(
        "Dispatch saved. Do you want to send customer dispatch message on WhatsApp now?",
      );
      if (openSender) {
        const waLink = `https://wa.me/${message.to}?text=${encodeURIComponent(message.text)}`;
        window.open(waLink, "_blank", "noopener,noreferrer");
      }
    }
    alert("Dispatch saved successfully.");
    navigate(`/sales-order/${selectedOrderId}`);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold mb-8">New Dispatch & POD</h2>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <label htmlFor="order-id-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Sales Order ID
        </label>
        <select
          id="order-id-select"
          value={selectedOrderId}
          onChange={(event) => {
            const nextId = event.target.value;
            setSelectedOrderId(nextId);
            navigate(nextId ? `/dispatch/new/${nextId}` : "/dispatch/new");
          }}
          className="w-full md:w-[360px] px-4 py-3 border rounded-lg"
        >
          <option value="">Select ID</option>
          {orders.map((salesOrder) => (
            <option key={salesOrder.id} value={salesOrder.id}>
              {salesOrder.id}
            </option>
          ))}
        </select>
      </div>

      {!order ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600 mb-8">
          Select a Sales Order ID to create dispatch.
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <input
          type="date"
          value={dispatchDate}
          onChange={(event) => setDispatchDate(event.target.value)}
          className="px-4 py-3 border rounded-lg"
          disabled={!order}
        />
        <input
          type="text"
          value={vehicleNo}
          onChange={(event) => setVehicleNo(event.target.value)}
          placeholder="Vehicle No"
          className="px-4 py-3 border rounded-lg"
          disabled={!order}
        />
        <input
          type="text"
          value={driver}
          onChange={(event) => setDriver(event.target.value)}
          placeholder="Driver Name & Phone"
          className="px-4 py-3 border rounded-lg"
          disabled={!order}
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto mb-8">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left">Product</th>
              <th>Size</th>
              <th>Shade</th>
              <th>Pending</th>
              <th>Dispatch Now</th>
            </tr>
          </thead>
          <tbody>
            {(order?.items ?? []).map((item, index) => (
              <tr key={`${item.product}-${index}`} className="border-t">
                <td className="px-6 py-4">{item.product}</td>
                <td className="text-center">{item.size}</td>
                <td className="text-center">{item.shade}</td>
                <td className="text-center font-bold text-orange-600">{pendingByRow[index]}</td>
                <td className="text-center">
                  <input
                    type="number"
                    min="0"
                    max={pendingByRow[index]}
                    value={quantities[index] ?? 0}
                    onChange={(event) => updateQty(index, Number.parseInt(event.target.value, 10) || 0)}
                    className="w-24 px-3 py-2 border rounded"
                    disabled={!order}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow p-8">
        <h3 className="text-2xl font-bold mb-6 text-green-600">Proof of Delivery (POD)</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="radio"
              name="proofType"
              value="camera"
              checked={proofType === "camera"}
              onChange={() => setProofType("camera")}
              disabled={!order}
            />
            Capture Photo Proof
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="radio"
              name="proofType"
              value="url"
              checked={proofType === "url"}
              onChange={() => setProofType("url")}
              disabled={!order}
            />
            Photo Proof URL
          </label>
        </div>

        {proofType === "camera" ? (
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                disabled={!order}
              >
                Open Camera
              </button>
              {cameraOpen ? (
                <>
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    Close Camera
                  </button>
                </>
              ) : null}
            </div>
            {cameraError ? <p className="text-sm text-red-600">{cameraError}</p> : null}
            {cameraOpen ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md rounded-lg border bg-black"
              />
            ) : null}
            {proofFile ? (
              <p className="text-sm text-green-700 font-medium">Captured: {proofFile.name}</p>
            ) : null}
            <div>
              <p className="text-sm text-gray-600 mb-2">Fallback: choose from file</p>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                className="w-full px-4 py-3 border rounded-lg"
                disabled={!order}
              />
            </div>
            <canvas ref={captureCanvasRef} className="hidden" />
          </div>
        ) : (
          <input
            type="url"
            value={proofUrlInput}
            onChange={(event) => setProofUrlInput(event.target.value)}
            placeholder="https://example.com/pod-photo.jpg"
            className="w-full px-4 py-3 border rounded-lg mb-6"
            disabled={!order}
          />
        )}

        <select
          value={podStatus}
          onChange={(event) => setPodStatus(event.target.value as PodStatus)}
          className="w-full px-4 py-3 border rounded-lg text-lg mb-6"
          disabled={!order}
        >
          <option>Pending</option>
          <option>Received</option>
          <option>Verified</option>
        </select>

        {podStatus === "Verified" ? (
          <div className="text-center p-10 bg-green-50 rounded-2xl">
            <div className="text-9xl text-green-600 mb-6">✓</div>
            <h4 className="text-3xl font-bold mb-6">POD Link Ready!</h4>

            <div className="bg-white p-6 rounded-xl shadow-lg inline-block mb-8">
              <p className="text-sm text-gray-600 mb-3">Scan QR or click link</p>
              <canvas ref={qrCanvasRef} className="mx-auto" />
            </div>

            <p className="text-lg font-mono break-all bg-gray-100 p-4 rounded-lg mb-4">{podUrl}</p>

            <p className="text-sm text-gray-600">
              Share this with the customer to confirm delivery feedback.
            </p>
          </div>
        ) : null}
      </div>

      <div className="text-center mt-10">
        <button
          onClick={saveDispatch}
          className="px-12 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-2xl rounded-xl shadow-2xl"
          disabled={!order}
        >
          Save Dispatch
        </button>
      </div>
    </main>
  );
}
