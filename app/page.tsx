import HomeClient from './home-client';

export default function Home() {
  // Server-side: read environment variables securely
  const accountIdSelfManagedVault = process.env.DINARI_ACCOUNT_ID_SELF_MANAGED_VAULT || "your-self-managed-vault-id";
  const accountIdSelfManagedWallet = process.env.DINARI_ACCOUNT_ID_SELF_MANAGED_WALLET || "your-self-managed-wallet-id";
  const accountIdManaged = process.env.DINARI_ACCOUNT_ID_MANAGED || "your-managed-account-id";

  // Pass data to client component as props
  return <HomeClient 
    accountIdSelfManagedVault={accountIdSelfManagedVault}
    accountIdSelfManagedWallet={accountIdSelfManagedWallet}
    accountIdManaged={accountIdManaged}
  />;
}