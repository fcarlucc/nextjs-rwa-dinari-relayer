import { NextResponse } from 'next/server';

const API_KEY_ID = process.env.DINARI_API_KEY_ID;
const API_SECRET_KEY = process.env.DINARI_API_SECRET_KEY;
const BASE_URL = "https://api-enterprise.sandbox.dinari.com/api/v2";

/**
 * Poll order status until it changes from PENDING or gets an order_id
 * Max 30 seconds of polling
 */
export async function POST(req: Request) {
  if (!API_KEY_ID || !API_SECRET_KEY) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing API credentials" 
    }, { status: 500 });
  }

  const { accountId, orderId } = await req.json();

  if (!accountId || !orderId) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing accountId or orderId" 
    }, { status: 400 });
  }

  try {
    console.log(`\n[POLL] Waiting for order ${orderId} to progress...`);
    
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds total
    let lastStatus: any = null;

    while (attempts < maxAttempts) {
      const url = `${BASE_URL}/accounts/${accountId}/order_requests/${orderId}`;
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

      lastStatus = data;

      console.log(`[POLL:${attempts + 1}] Status: ${data.status}, order_id: ${data.order_id}`);
      
      // Log full details if ERROR
      if (data.status === 'ERROR') {
        console.log(`[POLL:${attempts + 1}] ERROR DETAILS:`, {
          reject_message: data.reject_message,
          cancel_message: data.cancel_message,
          error: data.error,
          full_response: JSON.stringify(data, null, 2)
        });
      }

      // If order got an order_id or status changed from PENDING
      if (data.order_id || (data.status && data.status !== 'PENDING')) {
        console.log(`[POLL] ✓ Order progressed! Status: ${data.status}, Order ID: ${data.order_id}`);
        return NextResponse.json({
          status: "success",
          attempt: attempts + 1,
          final_data: data
        });
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    console.log(`[POLL] Timeout after ${maxAttempts} seconds. Last status:`, lastStatus);

    return NextResponse.json({
      status: "timeout",
      attempts: maxAttempts,
      last_status: lastStatus.status,
      message: "Order remained in PENDING state - may need manual intervention"
    });

  } catch (error: any) {
    console.error("[POLL] Error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
}
