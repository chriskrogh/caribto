import { ethers } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';

import TokenArtifact from '../../../../../blockchain/artifacts/contracts/Token.sol/Token.json';
import { Token as TokenContract } from '../../../../../blockchain/generated/Token';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { address, amount } = req.query;
    const formattedAmount = ethers.utils.parseEther(amount.toString());

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(
      process.env.WALLET_PRIVATE_KEY ?? '',
      provider,
    );

    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS ?? '',
      TokenArtifact.abi,
      wallet,
    ) as TokenContract;

    const mintTransaction = await contract.mint(
      address as string,
      formattedAmount,
    );
    await mintTransaction.wait();
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false });
  }
};
