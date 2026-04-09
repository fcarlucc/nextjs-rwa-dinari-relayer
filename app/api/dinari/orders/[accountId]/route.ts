import { NextResponse } from 'next/server';

const API_KEY_ID = process.env.DINARI_API_KEY_ID;
const API_SECRET_KEY = process.env.DINARI_API_SECRET_KEY;
const BASE_URL = "https://api-enterprise.sandbox.dinari.com/api/v2";

/**
 * List all orders for an account
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  if (!API_KEY_ID || !API_SECRET_KEY) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing API credentials" 
    }, { status: 500 });
  }

  const { accountId } = await params;
  if (!accountId) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing accountId" 
    }, { status: 400 });
  }

  try {
    console.log(`[Orders] Fetching orders for account ${accountId}...`);
    
    const url = `${BASE_URL}/accounts/${accountId}/order_requests`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key-Id': API_KEY_ID,
        'X-API-Secret-Key': API_SECRET_KEY
      }
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = { message: await res.text() };
    }

    console.log(`[Orders] Response:`, data);

    return NextResponse.json({
      status: res.ok ? "success" : "error",
      http_code: res.status,
      data: data
    });

  } catch (error: any) {
    console.error("[Orders] Error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
}
