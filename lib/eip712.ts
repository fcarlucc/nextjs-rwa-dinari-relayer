import { ethers } from 'ethers';

/**
 * EIP-712 Typed Data Signing for Dinari V2 Permits
 * Signs permit templates using local private key
 */

export interface PermitTemplate {
  id: string;
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: Record<string, any>;
  primaryType: string;
  message: Record<string, any>;
}

/**
 * Sign a permit template using EIP-712 standard
 * Returns signature in hex format
 */
export async function signPermit(
  permitTemplate: PermitTemplate,
  privateKey: string
): Promise<string> {
  // Normalize private key (add 0x prefix if missing)
  const normalizedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(normalizedKey);

    // ethers.js v6: types must NOT include EIP712Domain
    // Remove it if present (Dinari includes it)
    const types = { ...permitTemplate.types };
    delete types['EIP712Domain'];

    // Sign the permit using EIP-712
    const signature = await wallet.signTypedData(
      permitTemplate.domain,
      types,
      permitTemplate.message
    );

    console.log('[EIP-712] Permit signed successfully');
    return signature;
  } catch (error: any) {
    console.error('[EIP-712] Signing failed:', error.message);
    throw new Error(`EIP-712 signing failed: ${error.message}`);
  }
}

/**
 * Verify a signature (mostly for debug/validation)
 */
export async function verifySignature(
  permitTemplate: PermitTemplate,
  signature: string,
  expectedSigner: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyTypedData(
      permitTemplate.domain,
      permitTemplate.types,
      permitTemplate.message,
      signature
    );

    const matches = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
    console.log(`[EIP-712] Signature verification: ${matches ? 'PASS' : 'FAIL'}`);
    return matches;
  } catch (error: any) {
    console.error('[EIP-712] Verification error:', error.message);
    return false;
  }
}
