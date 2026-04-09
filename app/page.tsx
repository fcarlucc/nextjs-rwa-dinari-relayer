import HomeClient from './home-client';

export default function Home() {
  // Server-side: read environment variables securely
  const accountIdSelfManaged = process.env.DINARI_ACCOUNT_ID_SELF_MANAGED || "your-self-managed-account-id";
  const accountIdManaged = process.env.DINARI_ACCOUNT_ID_MANAGED || "your-managed-account-id";

  // Pass data to client component as props
  return <HomeClient 
    accountIdSelfManaged={accountIdSelfManaged}
    accountIdManaged={accountIdManaged}
  />;
}