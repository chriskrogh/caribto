import React, { InputHTMLAttributes } from 'react';
import styled from 'styled-components';

const SIDE_PADDING = 16;

type ContainerProps = {
  fullWidth?: boolean;
};
const Container = styled.div<ContainerProps>`
  display: flex;
  flex-flow: column;
  padding: 8px 16px;
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  width: ${({ fullWidth }) =>
    fullWidth ? `calc(100% - ${SIDE_PADDING * 2}px)` : 'auto'};
`;

const Input = styled.input`
  border: none;
  background: none;
  margin: 0;
  color: ${({ disabled }) => (disabled ? 'rgba(255, 255, 255, 0.5)' : 'white')};

  // from p
  font-family: Jost;
  font-size: 18px;
  font-weight: 300;
  line-height: 28px;
  letter-spacing: 0.25;

  :focus {
    outline: none;
  }
`;

type Props = InputHTMLAttributes<HTMLInputElement> & ContainerProps;

const TextField: React.FC<Props> = ({ fullWidth, ...props }) => {
  return (
    <Container fullWidth={fullWidth}>
      <Input {...props} />
    </Container>
  );
};

export default TextField;
