import type { HTMLAttributes } from 'react';
import React from 'react';

import type { Props as BoxProps } from '../Box';
import Box from '../Box';

type Props = Omit<BoxProps, 'flexDirection'> & HTMLAttributes<HTMLDivElement>;

const Row: React.FC<Props> = ({ children, ...props }) => {
  return (
    <Box {...props} flexDirection="row">
      {children}
    </Box>
  );
};

export default Row;
