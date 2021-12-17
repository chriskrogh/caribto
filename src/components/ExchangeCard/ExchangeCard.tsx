import { Formik } from 'formik';
import React, { useState } from 'react';
import styled from 'styled-components';

import Button from '../Button';
import Clickable from '../Clickable';
import Column from '../Column';
import Row from '../Row';
import Spacer from '../Spacer';
import TextInput from '../TextInput/TextInput';
import Typography from '../Typography';
import Summary from './Summary/Summary';
import { validationSchema } from './validationSchema';

const SIDE_PADDING = 32;

const Container = styled(Column)`
  padding: ${SIDE_PADDING}px 32px;
  width: min(calc(100% - ${2 * SIDE_PADDING}px), 400px);
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 16px;
`;

type FormValues = {
  amount: string;
  walletAddress: string;
};

const initialFormValues: FormValues = {
  amount: '',
  walletAddress: '',
};

const ExchangeCard: React.FC = () => {
  const [action, setAction] = useState<'buy' | 'sell'>('buy');

  const setBuy = () => setAction('buy');
  const setSell = () => setAction('sell');

  const currentCurrency = action === 'buy' ? 'TTD' : 'TTC';
  const desiredCurrency = action === 'buy' ? 'TTC' : 'TTD';

  const submit = (values: FormValues) => {
    console.log(values);
  };

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
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
          <>
            <Row justifyContent="space-between" fullWidth>
              <Typography as="p">Amount</Typography>
              <Typography as="p">
                {desiredCurrency}/{currentCurrency}
              </Typography>
            </Row>
            <TextInput
              onChange={handleChange('amount')}
              onBlur={handleBlur('amount')}
              placeholder="0.00"
              type="number"
              fullWidth
            />
            {errors.amount && (
              <>
                <Spacer height={4} />
                <Typography as="p" error>
                  {errors.amount}
                </Typography>
              </>
            )}
            <Spacer height={16} />
            <Typography as="p">Wallet address</Typography>
            <TextInput
              onChange={handleChange('walletAddress')}
              onBlur={handleBlur('walletAddress')}
              placeholder="0x... or .eth"
              type="text"
              fullWidth
            />
            {errors.walletAddress && (
              <>
                <Spacer height={4} />
                <Typography as="p" error>
                  {errors.walletAddress}
                </Typography>
              </>
            )}
            <Spacer height={16} />
            <Summary
              {...{
                amount: parseFloat(values.amount) || 0,
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
                    fullWidth
                    secondary
                  >
                    1. Approve
                  </Button>
                  <Spacer width={16} />
                </>
              )}
              <Button onClick={handleSubmit as () => void} fullWidth>
                {`${action === 'sell' ? '2. ' : ''}Confirm`}
              </Button>
            </Row>
          </>
        )}
      </Formik>
    </Container>
  );
};

export default ExchangeCard;
