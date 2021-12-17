import './index.css';

import type { AppProps } from 'next/app';

import WalletProvider from '../src/contexts/wallet';
import GlobalStyle from '../src/styles/GlobalStyle';

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyle />
      <WalletProvider>
        <Component {...pageProps} />
      </WalletProvider>
    </>
  );
}

export default App;
