import { BigNumber, ethers } from 'ethers';
import { useState } from 'react';

import TokenArtifact from '../../artifacts/contracts/Token.sol/Token.json';
import { Token as TokenContract } from '../../generated/Token';

const buildTokenContract = (): TokenContract => {
  if (typeof window !== 'undefined') {
    const provider = new ethers.providers.JsonRpcProvider();
    return new ethers.Contract(
      process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS,
      TokenArtifact.abi,
      provider.getSigner(),
    ) as TokenContract;
  }
};

type HookReturn = {
  mintTokens: (address: string, amount: BigNumber) => Promise<void>;
  requestApproval: (address: string, amount: BigNumber) => Promise<void>;
  burnTokens: (address: string, amount: BigNumber) => Promise<void>;
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

  const contract = buildTokenContract();

  const mintTokens = async (address: string, amount: BigNumber) => {
    setLoading(true);
    const mintTransaction = await contract.mint(address, amount);
    await mintTransaction.wait();
    if (mintTransaction.blockHash) {
      handleSuccess();
    }
    setLoading(false);
  };

  const requestApproval = async (address: string, amount: BigNumber) => {
    setLoading(true);
    const approveTransaction = await contract.approve(address, amount);
    await approveTransaction.wait();
    if (approveTransaction.blockHash) {
      setApproved(true);
    }
    setLoading(false);
  };

  const burnTokens = async (address: string, amount: BigNumber) => {
    setLoading(true);
    const burnTransaction = await contract.burnFrom(address, amount);
    await burnTransaction.wait();
    if (burnTransaction.blockHash) {
      setApproved(false);
      handleSuccess();
    }
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
