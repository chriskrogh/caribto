import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';

import * as dotenv from 'dotenv';

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: any = {
  solidity: '0.8.4',
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: `https://speedy-nodes-nyc.moralis.io/${process.env.MORALIS_CLIENT_ID}/polygon/mumbai`,
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
    mainnet: {
      url: `https://speedy-nodes-nyc.moralis.io/${process.env.MORALIS_CLIENT_ID}/polygon/mainnet`,
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: './generated',
  },
};

export default config;
