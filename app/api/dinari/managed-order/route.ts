import { NextResponse } from 'next/server';

const API_KEY_ID = process.env.DINARI_API_KEY_ID;
const API_SECRET_KEY = process.env.DINARI_API_SECRET_KEY;
const BASE_URL = "https://api-enterprise.sandbox.dinari.com/api/v2";

/**
 * @desc Managed Order Flow (SIMPLER ALTERNATIVE to EIP155)
 * @route POST /api/dinari/managed-order
 * Just send the order directly to Dinari - no permit signing needed!
 */
export async function POST(req: Request) {
  // Validate config
  if (!API_KEY_ID || !API_SECRET_KEY) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing API credentials" 
    }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ 
      status: "error", 
      message: "Invalid JSON request" 
    }, { status: 400 });
  }

  const { accountId, orderType, stockId, amount, quantity, recipientAccountId } = body;

  if (!accountId || !orderType || !stockId) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing required fields: accountId, orderType, stockId" 
    }, { status: 400 });
  }

  try {
    console.log(`\n[MANAGED] Creating ${orderType} order...`);

    let endpoint: string;
    let payload: any;

    if (orderType === 'BUY') {
      if (!amount) {
        return NextResponse.json({ 
          status: "error", 
          message: "BUY orders require 'amount' (payment_amount in USD)" 
        }, { status: 400 });
      }

      endpoint = `${BASE_URL}/accounts/${accountId}/order_requests/market_buy`;
      payload = {
        payment_amount: parseFloat(amount),
        stock_id: stockId,
        client_order_id: `managed-buy-${Date.now()}`,
        recipient_account_id: recipientAccountId || undefined
      };

      console.log(`[MANAGED] BUY Order: ${amount} USD`);
    } else if (orderType === 'SELL') {
      if (!quantity) {
        return NextResponse.json({ 
          status: "error", 
          message: "SELL orders require 'quantity' (asset_quantity in shares)" 
        }, { status: 400 });
      }

      endpoint = `${BASE_URL}/accounts/${accountId}/order_requests/market_sell`;
      payload = {
        asset_quantity: parseFloat(quantity),
        stock_id: stockId,
        client_order_id: `managed-sell-${Date.now()}`,
        recipient_account_id: recipientAccountId || undefined
      };

      console.log(`[MANAGED] SELL Order: ${quantity} shares`);
    } else {
      return NextResponse.json({ 
        status: "error", 
        message: "orderType must be BUY or SELL" 
      }, { status: 400 });
    }

    // Remove undefined fields
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    console.log(`[MANAGED] Payload:`, JSON.stringify(payload, null, 2));
    console.log(`[MANAGED] → POST ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key-Id': API_KEY_ID,
        'X-API-Secret-Key': API_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: await response.text() };
    }

    console.log(`[MANAGED] ← ${response.status}`, responseData);

    if (!response.ok) {
      return NextResponse.json({
        status: "error",
        http_code: response.status,
        endpoint: endpoint,
        provider_response: responseData
      }, { status: response.status });
    }

    console.log(`\n[MANAGED] ✓ ORDER CREATED SUCCESSFULLY!`);

    return NextResponse.json({
      status: "success",
      order_type: orderType,
      http_code: response.status,
      data: responseData
    });

  } catch (error: any) {
    console.error("[MANAGED] Critical Error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
}
