import { NextResponse } from 'next/server';
import { signPermit, PermitTemplate } from '@/lib/eip712';
import { ethers } from 'ethers';

const API_KEY_ID = process.env.DINARI_API_KEY_ID;
const API_SECRET_KEY = process.env.DINARI_API_SECRET_KEY;
const SIGNING_PRIVATE_KEY = process.env.SIGNING_PRIVATE_KEY;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
const BASE_URL = "https://api-enterprise.sandbox.dinari.com/api/v2";

const DEFAULT_PAYMENT_TOKEN = "0x665b099132d79739462DfDe6874126AFe840F7a3"; // mockUSD on Sepolia sandbox

/**
 * @desc Dual-Flow Order Processing:
 *   - MANAGED: Direct API order (2 steps)
 *   - VAULT/EIP155: Proxied order with permit signature (3 steps)
 * @route POST /api/dinari/order
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

  const { accountId, isVault, orderData = {} } = body;

  if (!accountId) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing accountId" 
    }, { status: 400 });
  }

  try {
    // ========================================
    // ROUTE 1: MANAGED ACCOUNT (Direct API)
    // ========================================
    if (!isVault) {
      console.log(`\n[MANAGED] Creating direct market order...`);
      
      const orderSide = orderData.orderSide || "BUY";
      const managedPayload: any = {
        client_order_id: `nex-${Date.now()}`
      };

      if (orderSide === "BUY") {
        const paymentAmount = parseFloat(orderData.amount || "0");
        managedPayload.payment_amount = paymentAmount;
        console.log(`[MANAGED] Market BUY: ${paymentAmount.toFixed(2)} USD`);
      } else if (orderSide === "SELL") {
        const quantity = parseFloat(orderData.quantity || "0");
        managedPayload.quantity = quantity;
        console.log(`[MANAGED] Market SELL: ${quantity.toFixed(6)} shares`);
      }

      // Add stock or alloy ID
      if (orderData.stockId) {
        managedPayload.stock_id = orderData.stockId;
        console.log(`[MANAGED] Stock ID: ${orderData.stockId}`);
      } else if (orderData.alloyId) {
        managedPayload.alloy_id = orderData.alloyId;
        console.log(`[MANAGED] Alloy ID: ${orderData.alloyId}`);
      }

      // Optional recipient and stock/alloy reference
      if (orderData.recipientAccountId) {
        managedPayload.recipient_account_id = orderData.recipientAccountId;
      }

      console.log(`[MANAGED] Payload:`, JSON.stringify(managedPayload, null, 2));

      const managedUrl = `${BASE_URL}/accounts/${accountId}/order_requests/market_${orderSide.toLowerCase()}`;
      console.log(`[MANAGED] → POST ${managedUrl}`);

      const managedResponse = await fetch(managedUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key-Id': API_KEY_ID,
          'X-API-Secret-Key': API_SECRET_KEY
        },
        body: JSON.stringify(managedPayload)
      });

      let managedData;
      try {
        managedData = await managedResponse.json();
      } catch {
        managedData = { message: await managedResponse.text() };
      }

      console.log(`[MANAGED] ← ${managedResponse.status}`, managedData);

      if (!managedResponse.ok) {
        return NextResponse.json({
          status: "error",
          flow: "MANAGED",
          http_code: managedResponse.status,
          endpoint: managedUrl,
          provider_response: managedData
        }, { status: managedResponse.status });
      }

      console.log(`[MANAGED] ✓ ORDER CREATED (ID: ${managedData.id}, Status: ${managedData.status})`);

      return NextResponse.json({
        status: "success",
        flow: "MANAGED",
        order_id: managedData.id,
        order_request_id: managedData.id,
        order_status: managedData.status,
        message: "Managed order created successfully",
        account_id: accountId,
        full_response: managedData
      }, { status: 201 });
    }

    // ========================================
    // ROUTE 2: VAULT/EIP155 (Proxied Order)
    // ========================================
    
    // ===== STEP 1: REQUEST PERMIT TEMPLATE =====
    console.log(`\n[EIP155:1] Requesting Permit Template...`);

    const orderSide = orderData.orderSide || "BUY";
    const permitRequestPayload: any = {
      chain_id: "eip155:11155111",
      order_tif: "DAY",
      order_side: orderSide,
      order_type: "MARKET",
      stock_id: orderData.stockId,
      client_order_id: `nex-${Date.now()}`
    };

    // Add payment token details based on order side
    if (orderSide === "BUY") {
      const amount = parseFloat(orderData.amount || "0");
      permitRequestPayload.payment_token = orderData.paymentToken || DEFAULT_PAYMENT_TOKEN;
      permitRequestPayload.payment_token_quantity = amount;
      console.log(`[EIP155:1] BUY Order: ${amount.toFixed(2)} USD+`);
    } else if (orderSide === "SELL") {
      const quantity = parseFloat(orderData.quantity || "0");
      permitRequestPayload.asset_token_quantity = quantity;
      permitRequestPayload.payment_token = orderData.paymentToken || DEFAULT_PAYMENT_TOKEN;
      console.log(`[EIP155:1] SELL Order: ${quantity.toFixed(6)} shares`);
    }

    console.log(`[EIP155:1] Payload:`, JSON.stringify(permitRequestPayload, null, 2));

    const permitUrl = `${BASE_URL}/accounts/${accountId}/order_requests/eip155/permit`;
    console.log(`[EIP155:1] → POST ${permitUrl}`);

    const permitResponse = await fetch(permitUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key-Id': API_KEY_ID,
        'X-API-Secret-Key': API_SECRET_KEY
      },
      body: JSON.stringify(permitRequestPayload)
    });

    let permitData;
    try {
      permitData = await permitResponse.json();
    } catch {
      permitData = { message: await permitResponse.text() };
    }

    console.log(`[EIP155:1] ← ${permitResponse.status}`, permitData);

    if (!permitResponse.ok) {
      return NextResponse.json({
        status: "error",
        flow: "EIP155",
        step: "1/3: Permit Request",
        http_code: permitResponse.status,
        endpoint: permitUrl,
        provider_response: permitData
      });
    }

    // ===== STEP 2: SIGN PERMIT LOCALLY =====
    console.log(`\n[EIP155:2] Signing Permit (EIP-712)...`);
    console.log(`[EIP155:2] permitData structure:`, JSON.stringify(permitData, null, 2));

    if (!SIGNING_PRIVATE_KEY) {
      return NextResponse.json({
        status: "error",
        message: "SIGNING_PRIVATE_KEY not configured",
        flow: "EIP155",
        step: "2/3: Sign Locally"
      }, { status: 500 });
    }

    let signature: string;
    try {
      // Dinari returns: { order_request_id, permit: { domain, message, types, primaryType } }
      const permitTemplate: PermitTemplate = permitData.permit || (permitData.data ? permitData.data : permitData);
      
      console.log(`[EIP155:2] Using permit template...`);
      console.log(`[EIP155:2] Permit deadline: ${permitTemplate.message?.deadline}`);
      console.log(`[EIP155:2] Current timestamp: ${Math.floor(Date.now() / 1000)}`);
      
      if (!permitTemplate || !permitTemplate.domain) {
        return NextResponse.json({
          status: "error",
          message: "Invalid permit template structure from Dinari",
          flow: "EIP155",
          step: "2/3: Sign Locally",
          received_data: permitData
        }, { status: 400 });
      }

      signature = await signPermit(permitTemplate, SIGNING_PRIVATE_KEY);
      console.log(`[EIP155:2] ✓ Signature: ${signature.slice(0, 20)}...`);
      console.log(`[EIP155:2] Full signature: ${signature}`);
    } catch (error: any) {
      console.error(`[EIP155:2] Signing failed:`, error.message);
      return NextResponse.json({
        status: "error",
        message: error.message,
        flow: "EIP155",
        step: "2/3: Sign Locally",
        debug: error.stack
      }, { status: 500 });
    }

    // ===== STEP 3: SUBMIT SIGNED PERMIT =====
    console.log(`\n[EIP155:3] Submitting Signed Permit...`);

    // Extract the correct order_request_id
    const orderId = permitData.order_request_id;
    if (!orderId) {
      console.error(`[EIP155:3] Missing order_request_id!`, permitData);
      return NextResponse.json({
        status: "error",
        message: "Missing order_request_id from permit response",
        flow: "EIP155",
        step: "3/3: Submit Permit",
        received_data: permitData
      }, { status: 400 });
    }

    const submitUrl = `${BASE_URL}/accounts/${accountId}/order_requests/eip155`;
    const submitPayload = {
      order_request_id: orderId,
      permit_signature: signature
    };

    console.log(`[EIP155:3] Order ID: ${orderId}`);
    console.log(`[EIP155:3] Payload:`, JSON.stringify(submitPayload, null, 2));
    console.log(`[EIP155:3] Signature length: ${signature.length}`);
    console.log(`[EIP155:3] → POST ${submitUrl}`);

    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key-Id': API_KEY_ID,
        'X-API-Secret-Key': API_SECRET_KEY
      },
      body: JSON.stringify(submitPayload)
    });

    let submitData;
    try {
      submitData = await submitResponse.json();
    } catch {
      submitData = { message: await submitResponse.text() };
    }

    console.log(`[EIP155:3] ← ${submitResponse.status}`, submitData);

    if (!submitResponse.ok) {
      return NextResponse.json({
        status: "error",
        flow: "EIP155",
        step: "3/3: Submit Permit",
        http_code: submitResponse.status,
        endpoint: submitUrl,
        sent_payload: submitPayload,
        provider_response: submitData
      });
    }

    console.log(`\n[EIP155] ✓ ORDER COMPLETE (Status: ${submitData.status})`);

    // Order completed successfully - no on-chain transaction needed for EIP155 managed accounts
    return NextResponse.json({
      status: "success",
      flow: "EIP155",
      order_id: orderId,
      order_status: submitData.status,
      message: "Order submitted to Dinari successfully",
      account_id: accountId
    });

  } catch (error: any) {
    console.error("[3-STEP] Critical Error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
}
