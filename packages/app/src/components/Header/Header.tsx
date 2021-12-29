import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import styled from 'styled-components';

import Row from '../Row';
import Spacer from '../Spacer';
import Typography from '../Typography';

const IMAGE_SIZE = 32;

const Container = styled(Row)`
  padding: 16px 32px 0;
  flex: 0 1 ${IMAGE_SIZE}px;

  @media screen and (max-width: 800px) {
    padding: 16px 16px 0;
  }
`;

const LogoContainer = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
`;

const Header: React.FC = () => {
  const { pathname } = useRouter();

  const isOnAboutPage = pathname === '/about';

  return (
    <Container justifyContent="space-between" alignItems="center">
      <Link href="/">
        <LogoContainer>
          <Image
            src="/assets/palm-tree-small.png"
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            alt="Palm tree"
          />
          <Spacer width={16} />
          <Typography as="h4">Caribto</Typography>
        </LogoContainer>
      </Link>
      <Link href="/about">
        <Typography as="a" secondary={!isOnAboutPage} underline={isOnAboutPage}>
          About
        </Typography>
      </Link>
    </Container>
  );
};

export default Header;
