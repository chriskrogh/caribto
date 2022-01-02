type NativeCurrency = {
  name: string;
  symbol: string;
  decimals: number;
};

class EthereumChain {
  chainId: string;
  chainName: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: string[];
  blockExplorerUrls: string[];

  constructor() {
    switch (process.env.NEXT_PUBLIC_SUPPORTED_NETWORK) {
      case 'localhost':
        this.chainId = '0x539';
        this.chainName = 'Localhost 8545';
        this.nativeCurrency = {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        };
        this.rpcUrls = ['http://localhost:8545'];
        this.blockExplorerUrls = [];
        break;
      case 'mumbai':
        this.chainId = '0x13881';
        this.chainName = 'Polygon Testnet Mumbai';
        this.nativeCurrency = {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        };
        this.rpcUrls = ['https://matic-mumbai.chainstacklabs.com'];
        this.blockExplorerUrls = ['https://mumbai.polygonscan.com/'];
        break;
      default:
        throw new Error(
          `Unsupported network: ${process.env.NEXT_PUBLIC_SUPPORTED_NETWORK}`,
        );
    }
  }
}

export default new EthereumChain();
