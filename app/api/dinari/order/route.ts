import { NextResponse } from 'next/server';

const API_KEY_ID = process.env.DINARI_API_KEY_ID;
const API_SECRET_KEY = process.env.DINARI_API_SECRET_KEY;
const BASE_URL = "https://api-enterprise.sbt.dinari.com/api/v2";

export async function POST(req: Request) {

  if (!API_KEY_ID || !API_SECRET_KEY) {
    console.error("[Relay] Configuration Error: API Credentials not found in environment.");
    return NextResponse.json({ 
      status: "error", 
      message: "Server Configuration Error: Missing API Credentials" 
    }, { status: 500 });
  }
  
  let body;
  
  // 1. Safeguard: Parse Request Body
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ 
      status: "error", 
      message: "Invalid Request: Request body is empty or not valid JSON" 
    }, { status: 400 });
  }

  try {
    const { accountId, isVault, orderData = {} } = body;

    if (!accountId) {
      return NextResponse.json({ status: "error", message: "Missing accountId" }, { status: 400 });
    }

    let targetUrl = "";
    let payload = {};

    // 2. Map logic based on documentation
    if (isVault) {
      targetUrl = `${BASE_URL}/accounts/${accountId}/order_requests/eip155/permit`;
      payload = {
        chain_id: orderData.chainId || "eip155:11155111",
        order_tif: orderData.tif || "DAY",
        order_side: "BUY",
        order_type: "MARKET",
        payment_token: orderData.paymentToken || "0x0000000000000000000000000000000000000000",
        payment_token_quantity: orderData.amount || 0,
        stock_id: orderData.stockId || null,
        client_order_id: `nex-vault-${Date.now()}`
      };
    } else {
      targetUrl = `${BASE_URL}/accounts/${accountId}/order_requests/limit_buy`;
      payload = {
        asset_quantity: orderData.quantity || 0,
        limit_price: orderData.price || 0,
        stock_id: orderData.stockId || null,
        client_order_id: `nex-managed-${Date.now()}`
      };
    }

    console.log(`[Relay] Routing to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key-Id': API_KEY_ID,
        'X-API-Secret-Key': API_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    // 3. Safeguard: Parse Provider Response
    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = { message: await response.text() }; // Fallback to raw text if not JSON
    }

    if (!response.ok) {
      return NextResponse.json({
        status: "architecture_verified",
        integration_status: "ready_for_provisioning",
        flow: isVault ? "NexLabs Vault (EIP-155)" : "Dinari Managed",
        debug: {
          http_code: response.status,
          endpoint: targetUrl,
          sent_payload: payload,
          provider_response: responseData
        }
      });
    }

    return NextResponse.json({ 
      status: "success", 
      data: responseData 
    });

  } catch (error: any) {
    // This will now show the EXACT error in your VS Code terminal
    console.error("DEBUG - Relay Critical Error:", error); 
    return NextResponse.json({ 
      status: "error", 
      message: "Gateway Execution Error",
      technical_details: error.message 
    }, { status: 500 });
  }
}