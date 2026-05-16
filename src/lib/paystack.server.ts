// Paystack helpers (server-only)
const PAYSTACK_BASE = "https://api.paystack.co";

export async function paystackInit(payload: {
  email: string;
  amount: number; // GHS
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY missing");
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email,
      amount: Math.round(payload.amount * 100), // pesewas
      reference: payload.reference,
      callback_url: payload.callback_url,
      currency: "GHS",
      metadata: payload.metadata ?? {},
      channels: payload.channels ?? ["card", "mobile_money", "bank", "ussd"],
    }),
  });
  const json = (await res.json()) as { status: boolean; message: string; data?: { authorization_url: string; reference: string; access_code: string } };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message || "Paystack init failed");
  }
  return json.data;
}

export async function paystackVerify(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY missing");
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const json = await res.json();
  return json;
}

export function newRef(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
