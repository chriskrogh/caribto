import { BigNumber, ethers } from 'ethers';
import { useState } from 'react';

import TokenArtifact from '../../artifacts/contracts/Token.sol/Token.json';
import { Token as TokenContract } from '../../generated/Token';

const buildTokenContract = (
  signer: 'default' | 'web3',
): TokenContract | undefined => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const provider =
      signer === 'default'
        ? new ethers.providers.JsonRpcProvider()
        : new ethers.providers.Web3Provider(window.ethereum);
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

  const jsonRpcContract = buildTokenContract('default');
  const web3Contract = buildTokenContract('web3');

  const mintTokens = async (address: string, amount: BigNumber) => {
    setLoading(true);
    const mintTransaction = await jsonRpcContract.mint(address, amount);
    await mintTransaction.wait();
    if (mintTransaction.blockHash) {
      handleSuccess();
    }
    setLoading(false);
  };

  const requestApproval = async (address: string, amount: BigNumber) => {
    setLoading(true);
    const approveTransaction = await web3Contract.approve(address, amount);
    await approveTransaction.wait();
    setApproved(true);
    setLoading(false);
  };

  const burnTokens = async (address: string, amount: BigNumber) => {
    setLoading(true);
    const burnTransaction = await web3Contract.burnFrom(address, amount);
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
