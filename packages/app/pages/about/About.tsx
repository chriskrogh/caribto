import type { NextPage } from 'next';
import Head from 'next/head';
import styled from 'styled-components';

import Column from '../../src/components/Column';
import Spacer from '../../src/components/Spacer';
import Typography from '../../src/components/Typography';

const Container = styled(Column)`
  width: min(calc(100% - 32px), 800px);
`;

const About: NextPage = () => {
  return (
    <>
      <Head>
        <title>Caribto - About</title>
        <meta
          name="description"
          content="Learn more about the inspiration behind Caribto"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Column alignItems="center" fullWidth>
        <Container>
          <Typography as="p">
            by <a href="https://chriskrogh.com">Chris Krogh</a>
          </Typography>
          <Typography as="p">29th December, 2021</Typography>
          <Spacer height={16} />
          <Typography as="h4" secondary>
            Background & Motivation
          </Typography>
          <Spacer height={8} />
          <Typography as="p">
            Throughout the course of 2021, I became increasingly interested in
            the crypto / web 3 world. I was fascinated by the paradigms that
            these concepts introduced (trust, ownership and transparency), and
            found it quite difficult to ignore the potential impact that
            blockchain networks like Ethereum could have at scale.
          </Typography>
          <Spacer height={16} />
          <Typography as="p">
            I think it would be pretty cool to get a job in the industry, so I
            decided to get some experience with the relevant tools and
            frameworks (Solidity, Hardhat, Ethers JS) by building my first Dapp,
            Caribto.
          </Typography>
          <Spacer height={16} />
          <Typography as="h4" secondary>
            Overview
          </Typography>
          <Spacer height={8} />
          <Typography as="p">
            Caribto is a fiat on/off ramp project that facilitates "buying" and
            "selling" ERC20 tokens on the Polygon blockchain. When tokens are
            "bought", they are minted to the specified wallet address and when
            they are "sold", they are burned from the wallet address.
          </Typography>
          <Spacer height={16} />
          <Typography as="h4" secondary>
            Network
          </Typography>
          <Spacer height={8} />
          <Typography as="p">
            The token's contract is deployed on Polygon's Mumbai test network,
            so none of the transactions require real MATIC to be signed or
            processed. To add the network to your wallet, you can head over to{' '}
            <a href="https://chainlist.org/">Chainlist</a>, search for "mumbai"
            and add the Polygon test network.
          </Typography>
          <Spacer height={16} />
          <Typography as="h4" secondary>
            Plans for the future
          </Typography>
          <Spacer height={8} />
          <Typography as="p">
            The goal of this project was just to get more experience interacting
            with smart contracts, however since there aren't many fiat on/off
            ramps that accept local Caribbean currencies, there could be some
            launch potential. Will probably look into, but not right now.
          </Typography>
          <Spacer height={32} />
        </Container>
      </Column>
    </>
  );
};

export default About;
