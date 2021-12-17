import React from 'react';

import { Currency } from '../../../utils/Currency';
import Column from '../../Column';
import LineItem from './LineItem';

type Props = {
  amount: number;
  currentCurrency: Currency;
  desiredCurrency: Currency;
};

const Summary: React.FC<Props> = ({
  amount,
  currentCurrency,
  desiredCurrency,
}) => {
  /** This should be pulled from somwehere */
  const processingFee: { amount: number; currency: Currency } = {
    amount: 3,
    currency: 'TTD',
  };

  /** This should be determined based on the
   * user currency and the desired currency */
  const price = 1;

  const subtotal = amount * price;
  const total = subtotal + processingFee.amount;

  return (
    <Column fullWidth>
      <LineItem
        title={`${desiredCurrency} price`}
        amount={price}
        currency={currentCurrency}
      />
      <LineItem title="Processing fee" {...processingFee} />
      <LineItem title="You get" amount={subtotal} currency={desiredCurrency} />
      <LineItem title="Total" amount={total} currency={currentCurrency} bold />
    </Column>
  );
};

export default Summary;
