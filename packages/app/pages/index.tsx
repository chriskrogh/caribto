import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

import Header from '../src/components/Header';
import Page from '../src/components/Page';
import Spacer from '../src/components/Spacer';
import { useIsMobile } from '../src/utils/isMobile';

const DynamicMobileSection = dynamic(() => import('./landing/Mobile'));
const DynamicDesktopSection = dynamic(() => import('./landing/Desktop'));

const Home: NextPage = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <Head>
        <title>Caribto</title>
        <meta
          name="description"
          content="Fiat on/off ramp aggregator in the Caribbean"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <Header />
        <Spacer height={isMobile ? 32 : 16} />
        {isMobile ? <DynamicMobileSection /> : <DynamicDesktopSection />}
      </Page>
    </>
  );
};

export default Home;