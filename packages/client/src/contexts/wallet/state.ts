import { createContext } from 'react';

export type State = {
  address: string;
  setAddress: (address: string) => void;
};

export const initialState: State = {
  address: '',
  setAddress: (address: string) => {
    void address;
  },
};

export const WalletContext = createContext(initialState);
