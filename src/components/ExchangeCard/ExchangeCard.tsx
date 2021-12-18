import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers } from 'ethers';
import { Formik } from 'formik';
import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import Web3Modal from 'web3modal';

import { WalletContext } from '../../contexts/wallet';
import { useTokenContract } from '../../hooks/useTokenContract';
import { COLORS } from '../../utils/colors';
import Button from '../Button';
import Clickable from '../Clickable';
import Column from '../Column';
import Row from '../Row';
import Spacer from '../Spacer';
import TextInput from '../TextInput/TextInput';
import Typography from '../Typography';
import Summary from './Summary/Summary';
import { validationSchema } from './validation';

const Container = styled(Column)`
  padding: 32px;
  width: min(calc(100% - 64px), 430px);
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 16px;

  @media screen and (max-width: 800px) {
    padding: 16px;
    width: calc(100% - 32px);
  }
`;

const DOT_SIZE = 12;
const ConnectedDot = styled.div`
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
  border-radius: 50%;
  background-color: ${COLORS.success};
`;

type FormValues = {
  amount: string;
  walletAddress: string;
};

const connectWallet = async (): Promise<
  ethers.providers.Web3Provider | undefined
> => {
  try {
    if (typeof window !== undefined && window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    } else {
      const web3Modal = new Web3Modal({
        network: 'mainnet', // optional
        cacheProvider: true, // optional
        providerOptions: {
          walletconnect: {
            package: WalletConnectProvider, // required
            options: {
              infuraId: process.env.NEXT_PUBLIC_INFURA_ID, // required
            },
          },
        },
      });
      const provider = await web3Modal.connect();
      return new ethers.providers.Web3Provider(provider);
    }
  } catch (error) {
    console.error(error);
  }
};

const ExchangeCard: React.FC = () => {
  const { address } = useContext(WalletContext);

  const [action, setAction] = useState<'buy' | 'sell'>('buy');

  const setBuy = () => setAction('buy');
  const setSell = () => setAction('sell');

  const {
    mintTokens,
    requestApproval,
    burnTokens,
    loading,
    approved,
    success,
  } = useTokenContract();

  const initialFormValues: FormValues = { amount: '', walletAddress: address };

  const submit = async (values: FormValues, { resetForm }) => {
    const { amount, walletAddress } = values;
    const formattedAmount = ethers.utils.parseEther(amount.toString());
    try {
      if (action === 'buy') {
        await mintTokens(walletAddress, formattedAmount);
      } else if (action === 'sell') {
        const provider = await connectWallet();
        if (!provider) throw new Error();
        if (!approved) {
          await requestApproval(provider, walletAddress, formattedAmount);
        } else {
          await burnTokens(provider, walletAddress, formattedAmount);
        }
      }
      resetForm(initialFormValues);
    } catch (error) {
      console.error(error);
    }
  };

  /** User should be able to choose these */
  const currentCurrency = action === 'buy' ? 'TTD' : 'TTC';
  const desiredCurrency = action === 'buy' ? 'TTC' : 'TTD';

  return (
    <Container>
      <Row>
        <Clickable onClick={setBuy}>
          <Typography as="h4" secondary={action === 'sell'} bold>
            Buy TTC
          </Typography>
        </Clickable>
        <Spacer width={16} />
        <Clickable onClick={setSell}>
          <Typography as="h4" secondary={action === 'buy'} bold>
            Sell TTC
          </Typography>
        </Clickable>
      </Row>
      <Spacer height={16} />
      <Formik
        validationSchema={validationSchema}
        initialValues={initialFormValues}
        onSubmit={submit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
          <>
            <Row justifyContent="space-between" fullWidth>
              <Typography as="p">Amount</Typography>
              <Typography as="p">
                {desiredCurrency}/{currentCurrency}
              </Typography>
            </Row>
            <Spacer height={4} />
            <TextInput
              onChange={handleChange('amount')}
              onBlur={handleBlur('amount')}
              value={values.amount}
              placeholder="0.00"
              type="number"
              fullWidth
            />
            {errors.amount && (
              <>
                <Spacer height={4} />
                <Typography as="p" color={COLORS.error}>
                  {errors.amount}
                </Typography>
              </>
            )}
            <Spacer height={16} />
            <Row justifyContent="space-between" fullWidth>
              <Typography as="p">Wallet Address</Typography>
              {address && (
                <Row alignItems="center">
                  <ConnectedDot />
                  <Spacer width={8} />
                  <Typography as="p" secondary>
                    Connected
                  </Typography>
                </Row>
              )}
            </Row>
            <Spacer height={4} />
            {action === 'sell' && !address ? (
              <Button onClick={connectWallet} secondary fullWidth>
                Connect Wallet
              </Button>
            ) : (
              <TextInput
                onChange={handleChange('walletAddress')}
                onBlur={handleBlur('walletAddress')}
                value={values.walletAddress}
                disabled={action === 'sell'}
                placeholder="0x... or .eth"
                type="text"
                fullWidth
              />
            )}
            {errors.walletAddress && (
              <>
                <Spacer height={4} />
                <Typography as="p" color={COLORS.error}>
                  {errors.walletAddress}
                </Typography>
              </>
            )}
            <Spacer height={16} />
            <Summary
              {...{
                amount: Number(values.amount) || 0,
                currentCurrency,
                desiredCurrency,
              }}
            />
            <Spacer height={32} />
            <Row fullWidth>
              {action === 'sell' && (
                <>
                  <Button
                    onClick={handleSubmit as () => void}
                    type="submit"
                    disabled={loading || approved}
                    fullWidth
                    secondary
                  >
                    1. Approve
                  </Button>
                  <Spacer width={16} />
                </>
              )}
              <Button
                onClick={handleSubmit as () => void}
                type="submit"
                disabled={loading || (action === 'sell' && !approved)}
                fullWidth
              >
                {`${action === 'sell' ? '2. ' : ''}Confirm`}
              </Button>
            </Row>
          </>
        )}
      </Formik>
      {success && (
        <>
          <Spacer height={16} />
          <Column alignItems="center" fullWidth>
            <Typography as="p" color={COLORS.success}>
              Your transaction was successful!
            </Typography>
          </Column>
        </>
      )}
    </Container>
  );
};

export default ExchangeCard;
