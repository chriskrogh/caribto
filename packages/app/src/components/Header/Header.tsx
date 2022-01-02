import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import styled from 'styled-components';

import EthereumChain from '../../utils/EthereumChain';
import { useIsMobile } from '../../utils/isMobile';
import Button from '../Button';
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
  const isMobile = useIsMobile();

  const { pathname } = useRouter();

  const [isOnSupportedNetwork, setIsOnSupportedNetwork] = useState(
    typeof window !== 'undefined' &&
      window.ethereum?.networkVersion &&
      EthereumChain.chainId ===
        `0x${parseInt(window.ethereum.networkVersion).toString(16)}`,
  );

  const isOnAboutPage = pathname === '/about';

  const handleSwitchNetwork = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: EthereumChain.chainId }],
        });
        setIsOnSupportedNetwork(true);
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [EthereumChain],
            });
            setIsOnSupportedNetwork(true);
          } catch (addError) {
            console.error('Error adding Ethereum chain to MetaMask', addError);
          }
        } else {
          console.error(
            'Error switching Ethereum chain in MetaMask',
            switchError,
          );
        }
      }
    }
  };

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
      <Row alignItems="center">
        <Link href="/about">
          <Typography
            as="a"
            secondary={!isOnAboutPage}
            underline={isOnAboutPage}
          >
            About
          </Typography>
        </Link>
        {!isMobile && !isOnSupportedNetwork && (
          <>
            <Spacer width={16} />
            <Button onClick={handleSwitchNetwork} secondary>
              Switch network
            </Button>
          </>
        )}
      </Row>
    </Container>
  );
};

export default Header;
