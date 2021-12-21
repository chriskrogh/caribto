import { ethers } from 'ethers';
import express, { NextFunction, Request, Response } from 'express';

import TokenArtifact from '../../../../blockchain/artifacts/contracts/Token.sol/Token.json';
import { Token as TokenContract } from '../../../../blockchain/generated/Token';
import validate from '../../middleware/validate';
import { LOCAL_ROUTES } from './types';
import getValidations from './validator';

export const TokenRouter = express.Router();

TokenRouter.post(
  '/mint',
  getValidations(LOCAL_ROUTES.MINT),
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address, amount } = req.body;
      const formattedAmount = ethers.utils.parseEther(amount.toString());

      const contract = new ethers.Contract(
        process.env.TOKEN_CONTRACT_ADDRESS ?? '',
        TokenArtifact.abi,
        new ethers.providers.JsonRpcProvider(process.env.RPC_URL).getSigner(),
      ) as TokenContract;

      const mintTransaction = await contract.mint(address, formattedAmount);
      await mintTransaction.wait();

      if (mintTransaction.blockHash) {
        res.send();
      } else {
        res.status(400).send();
      }
    } catch (error) {
      next(error);
    }
  },
);
