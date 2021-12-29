import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

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
          content="Caribto is a fiat on/off ramp platform for the Caribbean. It allows you to purchase crypto using your local island currency."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {isMobile ? <DynamicMobileSection /> : <DynamicDesktopSection />}
    </>
  );
};

export default Home;
