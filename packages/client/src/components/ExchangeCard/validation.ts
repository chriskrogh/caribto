import * as yup from 'yup';

export const validationSchema = yup.object().shape({
  amount: yup
    .number()
    .positive()
    .min(5, 'Minimum is 5')
    .max(10000, 'Maximum is 10,000')
    .required('An amount is required'),
  walletAddress: yup
    .string()
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
    .required('A wallet address is required'),
});
