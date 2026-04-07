import { NextResponse } from 'next/server';
import { Dinari } from '@dinari/api-sdk';

/**
 * @dest Mints testnet tokens (USD+) for a specific account in Sandbox
 * @route POST /api/fund-sandbox
 * @access Private (Internal PoC / Dev Only)
 */
export async function POST(request: Request) {
  try {
    const { accountId } = await request.json();

    // 1. Primary validation
    if (!accountId) {
      return NextResponse.json(
        { 
          status: "error", 
          code: "MISSING_ACCOUNT_ID", 
          message: "Account ID is required for faucet operations" 
        }, 
        { status: 400 }
      );
    }

    // 2. Client initialization with config check
    const apiKeyID = process.env.DINARI_API_KEY_ID;
    const apiSecretKey = process.env.DINARI_API_SECRET_KEY;

    if (!apiKeyID || !apiSecretKey) {
      return NextResponse.json(
        { status: "error", code: "UNCONFIGURED_RELAYER", message: "API keys are missing" },
        { status: 500 }
      );
    }

    const client = new Dinari({
      apiKeyID,
      apiSecretKey,
      environment: 'sandbox',
    });

    /**
     * 3. Faucet Execution
     * @network Ethereum Sepolia (11155111)
     */
    await client.v2.accounts.mintSandboxTokens(accountId, {
      chain_id: 'eip155:11155111',
    });

    return NextResponse.json({ 
      status: "success", 
      data: {
        account_id: accountId,
        network: "eip155:11155111",
        operation: "sandbox_minting"
      }
    });

  } catch (error: any) {
    console.error(`[DINARI_FAUCET_ERROR] Account: ${error.message}`, error.response?.data || error);

    return NextResponse.json(
      { 
        status: "error", 
        code: "FAUCET_MINTING_FAILED",
        details: error.response?.data || error.message 
      }, 
      { status: 500 }
    );
  }
}