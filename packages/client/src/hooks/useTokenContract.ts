import axios from 'axios';
import { BigNumber, ethers } from 'ethers';
import { useState } from 'react';

import TokenArtifact from '../../../blockchain/artifacts/contracts/Token.sol/Token.json';
import { Token as TokenContract } from '../../../blockchain/generated/Token';

const buildTokenContract = (
  provider: ethers.providers.Web3Provider,
): TokenContract =>
  new ethers.Contract(
    process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS ?? '',
    TokenArtifact.abi,
    provider.getSigner(),
  ) as TokenContract;

type HookReturn = {
  mintTokens: (address: string, amount: number) => Promise<void>;
  requestApproval: (
    provider: ethers.providers.Web3Provider,
    address: string,
    amount: BigNumber,
  ) => Promise<void>;
  burnTokens: (
    provider: ethers.providers.Web3Provider,
    address: string,
    amount: BigNumber,
  ) => Promise<void>;
  loading: boolean;
  approved: boolean;
  success: boolean;
};

export const useTokenContract = (): HookReturn => {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 5000);
  };

  const mintTokens = async (address: string, amount: number) => {
    setLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/token/mint` ?? '',
        {
          address,
          amount,
        },
      );
      handleSuccess();
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const requestApproval = async (
    provider: ethers.providers.Web3Provider,
    address: string,
    amount: BigNumber,
  ) => {
    setLoading(true);
    const contract = buildTokenContract(provider);
    const approveTransaction = await contract.approve(address, amount);
    await approveTransaction.wait();
    setApproved(true);
    setLoading(false);
  };

  const burnTokens = async (
    provider: ethers.providers.Web3Provider,
    address: string,
    amount: BigNumber,
  ) => {
    setLoading(true);
    const contract = buildTokenContract(provider);
    const burnTransaction = await contract.burnFrom(address, amount);
    await burnTransaction.wait();
    setApproved(false);
    handleSuccess();
    setLoading(false);
  };

  return {
    mintTokens,
    requestApproval,
    burnTokens,
    loading,
    approved,
    success,
  };
};