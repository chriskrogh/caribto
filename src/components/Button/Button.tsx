import React, { ButtonHTMLAttributes } from 'react';
import styled from 'styled-components';

import Typography from '../Typography';

type ContainerProps = {
  fullWidth?: boolean;
};
const Container = styled.button<ContainerProps>`
  border: none;
  margin: 0;
  padding: 8px 16px;
  background-color: #0984e3;
  border-radius: 8px;
  cursor: pointer;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  ContainerProps & {
    children: string;
  };

const Button: React.FC<Props> = ({ children, ...props }) => {
  return (
    <Container {...props}>
      <Typography as="h5" bold>
        {children}
      </Typography>
    </Container>
  );
};

export default Button;
