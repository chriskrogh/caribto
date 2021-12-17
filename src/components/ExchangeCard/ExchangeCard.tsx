import { ethers } from 'ethers';
import { Formik } from 'formik';
import React, { useContext, useState } from 'react';
import styled from 'styled-components';

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

const SIDE_PADDING = 32;

const Container = styled(Column)`
  padding: ${SIDE_PADDING}px 32px;
  width: min(calc(100% - ${2 * SIDE_PADDING}px), 430px);
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 16px;
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

  const submit = async (values: FormValues) => {
    const { amount, walletAddress } = values;
    const formattedAmount = ethers.utils.parseEther(amount.toString());
    try {
      if (action === 'buy') {
        await mintTokens(walletAddress, formattedAmount);
      } else if (action === 'sell') {
        if (!approved) {
          await requestApproval(walletAddress, formattedAmount);
        } else {
          await burnTokens(walletAddress, formattedAmount);
        }
      }
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
        initialValues={{ amount: '', walletAddress: address }}
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
              <Row alignItems="center">
                <ConnectedDot />
                <Spacer width={8} />
                <Typography as="p" secondary>
                  Connected
                </Typography>
              </Row>
            </Row>
            <Spacer height={4} />
            <TextInput
              onChange={handleChange('walletAddress')}
              onBlur={handleBlur('walletAddress')}
              value={values.walletAddress}
              placeholder="0x... or .eth"
              type="text"
              fullWidth
            />
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
                    disabled={loading}
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
                disabled={loading}
                fullWidth
              >
                {`${action === 'sell' ? '2. ' : ''}Confirm`}
              </Button>
            </Row>
          </>
        )}
      </Formik>
      <Spacer height={16} />
      {success && (
        <Column alignItems="center" fullWidth>
          <Typography as="p" color={COLORS.success}>
            Your transaction was successful!
          </Typography>
        </Column>
      )}
    </Container>
  );
};

export default ExchangeCard;
