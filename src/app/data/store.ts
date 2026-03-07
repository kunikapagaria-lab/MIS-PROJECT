export type PodStatus = "Pending" | "Received" | "Verified";

export interface OrderItem {
  product: string;
  size: string;
  shade: string;
  boxes: number;
  rate: number;
  dispatched: number;
}

export interface SalesOrder {
  id: string;
  date: string;
  customer: string;
  site: string;
  address: string;
  phone: string;
  gstNumber: string;
  reference: string;
  creator: string;
  expectedDate: string;
  status: "Pending" | "Partially Dispatched" | "Dispatched";
  podVerified: boolean;
  podRating: number | null;
  paymentsReceived: number;
  items: OrderItem[];
}

export interface StockItem {
  product: string;
  size: string;
  shade: string;
  boxes: number;
}

export interface OutboundMessage {
  id: string;
  orderId: string;
  to: string;
  channel: "sms" | "whatsapp";
  text: string;
  createdAt: string;
}

interface AppState {
  orders: SalesOrder[];
  stock: StockItem[];
  messages: OutboundMessage[];
}

const STORAGE_KEY = "ordertrail-state-v2";

const DEFAULT_STATE: AppState = {
  orders: [],
  stock: [
    { product: "Nano Polished", size: "800x800", shade: "SH-05", boxes: 460 },
    { product: "Wood Plank", size: "600x1200", shade: "WD-02", boxes: 500 },
    { product: "Double Charge", size: "600x600", shade: "DC-01", boxes: 280 },
    { product: "Glazed Vitrified", size: "800x800", shade: "GV-10", boxes: 90 },
    { product: "Full Body", size: "1200x1200", shade: "FB-03", boxes: 120 },
  ],
  messages: [],
};

function toINR(amount: number) {
  return Math.round(amount);
}

function readState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed.orders || !parsed.stock) return DEFAULT_STATE;
    return {
      orders: parsed.orders,
      stock: parsed.stock,
      messages: parsed.messages ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: AppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function initializeStore() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    writeState(DEFAULT_STATE);
  }
}

export function getOrders() {
  return readState().orders;
}

export function getStock() {
  return readState().stock;
}

export function getMessages() {
  return readState().messages;
}

export function updateStock(updatedStock: StockItem[]) {
  const state = readState();
  state.stock = updatedStock.map((item) => ({
    ...item,
    boxes: Math.max(0, Number(item.boxes) || 0),
  }));
  writeState(state);
  return state.stock;
}

export function getSalesOrder(id: string) {
  return getOrders().find((order) => order.id === id);
}

export function getDispatchPriority(dispatchDate: string): "High" | "Medium" | "Low" {
  if (!dispatchDate) return "Low";
  const dispatchAt = new Date(`${dispatchDate}T00:00:00`).getTime();
  const today = new Date();
  const todayAt = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (!Number.isFinite(dispatchAt)) return "Low";
  const days = Math.ceil((dispatchAt - todayAt) / (1000 * 60 * 60 * 24));
  if (days <= 1) return "High";
  if (days <= 3) return "Medium";
  return "Low";
}

export function getOrderTotals(order: SalesOrder) {
  const subtotal = order.items.reduce((sum, item) => sum + item.boxes * item.rate, 0);
  const grandTotal = subtotal;
  const pendingPayment = Math.max(0, grandTotal - order.paymentsReceived);
  const totalBoxes = order.items.reduce((sum, item) => sum + item.boxes, 0);
  const dispatchedBoxes = order.items.reduce((sum, item) => sum + item.dispatched, 0);
  const pendingBoxes = Math.max(0, totalBoxes - dispatchedBoxes);

  return {
    subtotal: toINR(subtotal),
    grandTotal: toINR(grandTotal),
    pendingPayment: toINR(pendingPayment),
    totalBoxes,
    dispatchedBoxes,
    pendingBoxes,
  };
}

export function createSalesOrder(input: {
  date: string;
  customer: string;
  site: string;
  address: string;
  phone: string;
  gstNumber: string;
  reference: string;
  creator: string;
  expectedDate: string;
  items: Array<Pick<OrderItem, "product" | "size" | "shade" | "boxes" | "rate">>;
}) {
  const state = readState();
  const lastNumber = state.orders.reduce((max, order) => {
    const num = Number(order.id.replace("SO-", ""));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  const id = `SO-${String(lastNumber + 1).padStart(4, "0")}`;
  const today = new Date().toISOString().slice(0, 10);

  const newOrder: SalesOrder = {
    id,
    date: input.date || today,
    customer: input.customer,
    site: input.site,
    address: input.address,
    phone: input.phone,
    gstNumber: input.gstNumber,
    reference: input.reference,
    creator: input.creator,
    expectedDate: input.expectedDate || today,
    status: "Pending",
    podVerified: false,
    podRating: null,
    paymentsReceived: 0,
    items: input.items.map((item) => ({ ...item, dispatched: 0 })),
  };

  state.orders.unshift(newOrder);
  writeState(state);
  return id;
}

export function importSalesOrdersFromRows(rows: unknown[][]) {
  const state = readState();
  let created = 0;

  rows.forEach((row) => {
    const id = String(row[0] ?? "").trim();
    if (!id) return;
    const customer = String(row[2] ?? "Unknown Customer");
    const site = String(row[3] ?? "");
    const boxes = Number(row[9] ?? 0) || 0;
    const rate = 3750;

    const order: SalesOrder = {
      id,
      date: String(row[1] ?? new Date().toISOString().slice(0, 10)),
      customer,
      site,
      address: site,
      phone: String(row[4] ?? ""),
      gstNumber: "",
      reference: "Bulk import",
      creator: "Bulk Upload",
      expectedDate: String(row[5] ?? new Date().toISOString().slice(0, 10)),
      status: "Pending",
      podVerified: false,
      podRating: null,
      paymentsReceived: 0,
      items: [
        {
          product: String(row[6] ?? "Tile Product"),
          size: String(row[7] ?? "800x800"),
          shade: String(row[8] ?? "NA"),
          boxes,
          rate,
          dispatched: 0,
        },
      ],
    };

    if (!state.orders.some((existing) => existing.id === order.id)) {
      state.orders.unshift(order);
      created += 1;
    }
  });

  writeState(state);
  return created;
}

export function addOrderPayment(orderId: string, amount: number) {
  if (amount <= 0) return false;
  const state = readState();
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return false;
  order.paymentsReceived += amount;
  writeState(state);
  return true;
}

export function saveDispatchForOrder(input: {
  orderId: string;
  quantities: number[];
  podStatus: PodStatus;
}) {
  const state = readState();
  const order = state.orders.find((item) => item.id === input.orderId);
  if (!order) return false;

  order.items = order.items.map((item, index) => {
    const maxPending = Math.max(0, item.boxes - item.dispatched);
    const qty = Math.max(0, Math.min(maxPending, input.quantities[index] || 0));
    return {
      ...item,
      dispatched: item.dispatched + qty,
    };
  });

  const totalBoxes = order.items.reduce((sum, item) => sum + item.boxes, 0);
  const dispatchedBoxes = order.items.reduce((sum, item) => sum + item.dispatched, 0);
  if (dispatchedBoxes <= 0) {
    order.status = "Pending";
  } else if (dispatchedBoxes < totalBoxes) {
    order.status = "Partially Dispatched";
  } else {
    order.status = "Dispatched";
  }

  if (input.podStatus === "Verified") {
    order.podVerified = true;
    if (!order.podRating) {
      order.podRating = 5;
    }
  }

  order.items.forEach((item, index) => {
    const qty = Math.max(0, input.quantities[index] || 0);
    if (qty <= 0) return;
    const stock = state.stock.find(
      (entry) => entry.product.includes(item.product.split(" ")[0]) && entry.size === item.size,
    );
    if (stock) {
      stock.boxes = Math.max(0, stock.boxes - qty);
    }
  });

  writeState(state);
  return true;
}

export function queueDispatchMessageForOrder(input: {
  orderId: string;
  dispatchDate: string;
  dispatchedBoxes: number;
  channel?: "sms" | "whatsapp";
}) {
  const state = readState();
  const order = state.orders.find((item) => item.id === input.orderId);
  if (!order || !order.phone) return null;

  const channel = input.channel ?? "whatsapp";
  const cleanPhone = order.phone.replace(/[^\d]/g, "");
  const to = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const text =
    `Your order ${order.id} has been dispatched on ${input.dispatchDate}. ` +
    `Dispatched boxes: ${input.dispatchedBoxes}. Thank you, ${order.creator}.`;

  const message: OutboundMessage = {
    id: `MSG-${Date.now()}`,
    orderId: order.id,
    to,
    channel,
    text,
    createdAt: new Date().toISOString(),
  };

  state.messages.unshift(message);
  writeState(state);
  return message;
}

export function saveDeliveryFeedback(orderId: string, rating: number) {
  const state = readState();
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return false;
  order.podVerified = true;
  order.podRating = rating;
  writeState(state);
  return true;
}
