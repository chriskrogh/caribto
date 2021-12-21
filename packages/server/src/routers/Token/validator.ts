import { body, ValidationChain } from 'express-validator';

import { LOCAL_ROUTES } from './types';

const getValidations = (route: LOCAL_ROUTES): ValidationChain[] => {
  switch (route) {
    case LOCAL_ROUTES.MINT:
      return [
        body('address').matches(/^0x[a-fA-F0-9]{40}$/),
        body('amount').isNumeric(),
      ];
    default:
      return [];
  }
};

export default getValidations;
