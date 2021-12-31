import React from 'react';

import { Currency } from '../../../../utils/Currency';
import { buildFormatter } from '../../../../utils/money';
import Row from '../../../Row';
import Typography from '../../../Typography';

type Props = {
  title: string;
  amount: number;
  currency: Currency;
  bold?: boolean;
};

const LineItem: React.FC<Props> = ({ title, amount, currency, bold }) => {
  return (
    <Row justifyContent="space-between" alignItems="center" fullWidth>
      <Typography as="p" bold={bold}>
        {title}
      </Typography>
      <Typography as="p">
        {buildFormatter(currency === 'TTDC' ? 'USD' : currency).format(amount)}
      </Typography>
    </Row>
  );
};

export default LineItem;
