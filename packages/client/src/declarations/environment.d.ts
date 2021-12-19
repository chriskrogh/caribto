declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS: string;
      NEXT_PUBLIC_INFURA_ID: string;
      NEXT_PUBLIC_RPC_URL: string;
    }
  }
}
