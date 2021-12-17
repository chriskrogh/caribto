import type { NextPage } from 'next';
import Image from 'next/image';
import styled from 'styled-components';

import Column from '../../src/components/Column';
import ExchangeCard from '../../src/components/ExchangeCard';
import Row from '../../src/components/Row';
import Spacer from '../../src/components/Spacer';
import Typography from '../../src/components/Typography';

const IMAGE_SIZE = Math.min(
  process.browser ? window.innerWidth / 2 - 2 * 32 : Number.MAX_SAFE_INTEGER,
  320,
);

const Container = styled(Row)`
  flex: 1 1 auto;
  padding: 0 16px;
`;

const SemiContainer = styled(Column)`
  height: 100%;
`;

const Desktop: NextPage = () => {
  return (
    <Container alignItems="center">
      <SemiContainer justifyContent="center" alignItems="center" fullWidth>
        <Typography as="h1" center>
          Crypto for the Caribbean
        </Typography>
        <Spacer height={16} />
        <Typography as="h5" center>
          Buy and sell crypto using your local currency.
        </Typography>
        <Spacer height={32} />
        <Image
          src="/assets/crypto.png"
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          alt="Crypto coins"
          priority
        />
      </SemiContainer>
      <SemiContainer justifyContent="center" alignItems="center" fullWidth>
        <ExchangeCard />
      </SemiContainer>
    </Container>
  );
};

export default Desktop;
