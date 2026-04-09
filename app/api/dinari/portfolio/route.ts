import { NextResponse } from 'next/server';

const API_KEY_ID = process.env.DINARI_API_KEY_ID;
const API_SECRET_KEY = process.env.DINARI_API_SECRET_KEY;
const BASE_URL = "https://api-enterprise.sandbox.dinari.com/api/v2";

/**
 * Get account portfolio (holdings + cash balances)
 */
export async function POST(req: Request) {
  if (!API_KEY_ID || !API_SECRET_KEY) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing API credentials" 
    }, { status: 500 });
  }

  const { accountId } = await req.json();

  if (!accountId) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing accountId" 
    }, { status: 400 });
  }

  try {
    // Get portfolio holdings
    console.log(`[Portfolio] Fetching holdings for account ${accountId}...`);
    
    const portfolioUrl = `${BASE_URL}/accounts/${accountId}/portfolio`;
    const portfolioRes = await fetch(portfolioUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key-Id': API_KEY_ID,
        'X-API-Secret-Key': API_SECRET_KEY
      }
    });

    let portfolioData;
    try {
      portfolioData = await portfolioRes.json();
    } catch {
      portfolioData = { message: await portfolioRes.text() };
    }

    // Get cash balances
    console.log(`[Portfolio] Fetching cash balances...`);
    
    const cashUrl = `${BASE_URL}/accounts/${accountId}/cash`;
    const cashRes = await fetch(cashUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key-Id': API_KEY_ID,
        'X-API-Secret-Key': API_SECRET_KEY
      }
    });

    let cashData;
    try {
      cashData = await cashRes.json();
    } catch {
      cashData = { message: await cashRes.text() };
    }

    console.log(`[Portfolio] Portfolio:`, portfolioData);
    console.log(`[Portfolio] Cash:`, cashData);

    return NextResponse.json({
      status: "success",
      portfolio: portfolioData,
      cash: cashData
    });

  } catch (error: any) {
    console.error("[Portfolio] Error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
}
