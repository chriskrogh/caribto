import React, { useEffect, useState } from 'react';

import { WalletContext } from './state';

const Provider: React.FC = ({ children }) => {
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(window.ethereum.selectedAddress);
      }
    })();
  });

  return (
    <WalletContext.Provider
      value={{
        address,
        setAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default Provider;
