import Image from 'next/image';
import React from 'react';
import styled from 'styled-components';

import Row from '../Row';
import Spacer from '../Spacer';
import Typography from '../Typography';

const IMAGE_SIZE = 32;

const Container = styled(Row)`
  padding: 16px;
`;

const Header: React.FC = () => {
  return (
    <Container justifyContent="space-between" alignItems="center" fullWidth>
      <Row>
        <Image
          src="/assets/palm-tree-small.png"
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          alt="Palm tree"
        />
        <Spacer width={16} />
        <Typography as="h4">Caribto</Typography>
      </Row>
    </Container>
  );
};

export default Header;
