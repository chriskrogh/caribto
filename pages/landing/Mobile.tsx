import type { NextPage } from 'next';
import styled from 'styled-components';

import Column from '../../src/components/Column';
import Spacer from '../../src/components/Spacer';
import Typography from '../../src/components/Typography';

const Container = styled(Column)`
  flex: 1 1 auto;
  padding: 0 16px;
`;

const Mobile: NextPage = () => {
  return (
    <Container alignItems="center">
      <Column justifyContent="center" alignItems="center" fullWidth>
        <Typography as="h1" center>
          Crypto for the Caribbean
        </Typography>
        <Spacer height={16} />
        <Typography as="h5" center>
          Buy and sell crypto using your local currency.
        </Typography>
      </Column>
      <Column justifyContent="center" alignItems="center" fullWidth></Column>
    </Container>
  );
};

export default Mobile;
