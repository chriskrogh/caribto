import './index.css';

import type { AppProps } from 'next/app';

import Header from '../src/components/Header';
import Page from '../src/components/Page';
import WalletProvider from '../src/contexts/wallet';
import GlobalStyle from '../src/styles/GlobalStyle';

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyle />
      <WalletProvider>
        <Page>
          <Header />
          <Component {...pageProps} />
        </Page>
      </WalletProvider>
    </>
  );
}

export default App;
