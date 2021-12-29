import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';

import Row from '../Row';
import Spacer from '../Spacer';
import Typography from '../Typography';

const IMAGE_SIZE = 32;

const Container = styled(Row)`
  padding: 16px 16px 0;
  flex: 0 1 ${IMAGE_SIZE}px;
`;

const ClickableRow = styled(Row)`
  cursor: pointer;
`;

const Header: React.FC = () => {
  return (
    <Container justifyContent="space-between" alignItems="center">
      <Link href="/">
        <ClickableRow>
          <Image
            src="/assets/palm-tree-small.png"
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            alt="Palm tree"
          />
          <Spacer width={16} />
          <Typography as="h4">Caribto</Typography>
        </ClickableRow>
      </Link>
      <Link href="/about">
        <Typography as="a">About</Typography>
      </Link>
    </Container>
  );
};

export default Header;
