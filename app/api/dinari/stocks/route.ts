import { NextResponse } from 'next/server';

const API_KEY_ID = process.env.DINARI_API_KEY_ID;
const API_SECRET_KEY = process.env.DINARI_API_SECRET_KEY;
const BASE_URL = "https://api-enterprise.sandbox.dinari.com/api/v2";

/**
 * @desc List valid stocks in Dinari Sandbox
 * @route GET /api/dinari/stocks
 */
export async function GET(req: Request) {
  if (!API_KEY_ID || !API_SECRET_KEY) {
    return NextResponse.json({ 
      status: "error", 
      message: "Missing API credentials" 
    }, { status: 500 });
  }

  try {
    const stocksUrl = `${BASE_URL}/stocks`;
    console.log(`[STOCKS] → GET ${stocksUrl}`);

    const response = await fetch(stocksUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key-Id': API_KEY_ID,
        'X-API-Secret-Key': API_SECRET_KEY
      }
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = { message: await response.text() };
    }

    console.log(`[STOCKS] ← ${response.status}`, data);

    if (!response.ok) {
      return NextResponse.json({
        status: "error",
        http_code: response.status,
        provider_response: data
      }, { status: response.status });
    }

    // Extract the first 20 stocks for easier viewing
    const stocks = data.results || [];
    const preview = stocks.slice(0, 20).map((s: any) => ({
      id: s.id,
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      status: s.status
    }));

    return NextResponse.json({
      status: "success",
      total_count: stocks.length,
      preview: preview,
      all_stocks: stocks
    });

  } catch (error: any) {
    console.error("[STOCKS] Error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message
    }, { status: 500 });
  }
}
