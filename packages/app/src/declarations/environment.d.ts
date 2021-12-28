declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS: string;
    }
  }
}
