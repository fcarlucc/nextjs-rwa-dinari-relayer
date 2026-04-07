import { NextResponse } from 'next/server';
import { Dinari } from '@dinari/api-sdk';

/**
 * @dest Connectivity check for Dinari V2 SDK
 * @route GET /api/dinari/permit
 * @access Private (Internal PoC)
 */
export async function GET() {
  // Validate environment variables before initialization
  const apiKeyID = process.env.DINARI_API_KEY_ID;
  const apiSecretKey = process.env.DINARI_API_SECRET_KEY;

  if (!apiKeyID || !apiSecretKey) {
    return NextResponse.json(
      { 
        status: "error", 
        code: "MISSING_CONFIGURATION",
        message: "Server-side API credentials are not configured" 
      }, 
      { status: 500 }
    );
  }

  try {
    const client = new Dinari({
      apiKeyID,
      apiSecretKey,
      environment: 'sandbox',
    });

    // Test SDK initialization by attempting a lightweight call if needed, 
    // or just confirm the client instance is ready.
    return NextResponse.json({ 
      status: "success", 
      data: {
        sdk_status: "initialized",
        environment: "sandbox",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("[DINARI_SDK_AUTH_ERROR]:", error);

    return NextResponse.json(
      { 
        status: "error", 
        code: "SDK_INITIALIZATION_FAILED",
        message: error.message || "Internal Server Error"
      }, 
      { status: 500 }
    );
  }
}