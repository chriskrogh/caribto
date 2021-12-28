import React from 'react';
import styled, { css, keyframes } from 'styled-components';

import { COLORS } from '../../utils/colors';
import Row from '../Row';
import Spacer from '../Spacer';

const DOT_SIZE = 16;
const BOUNCE_HEIGHT = 12;

const Container = styled(Row)`
  padding-top: ${BOUNCE_HEIGHT}px;
  height: ${BOUNCE_HEIGHT + DOT_SIZE}px;
`;

const bounce = keyframes`
  to {
    width: ${DOT_SIZE}px;
    height: ${DOT_SIZE}px;
    transform: translate3d(0, -${BOUNCE_HEIGHT}px, 0);
  }
`;

const commonDotStyles = css`
  display: inline-block;
  background-color: ${COLORS.primary};
  width: ${DOT_SIZE / 2}px;
  height: ${DOT_SIZE / 2}px;
  border-radius: 50%;
  transform: translate3d(0);
  animation: ${bounce} 0.6s infinite alternate;
`;

const First = styled.div`
  ${commonDotStyles}
`;

const Second = styled.div`
  ${commonDotStyles}
  background-color: ${COLORS.secondary};
  animation-delay: 0.2s;
`;

const Third = styled.div`
  ${commonDotStyles}
  animation-delay: 0.4s;
`;

const Loader: React.FC = () => {
  return (
    <Container justifyContent="center" alignItems="center">
      <First />
      <Spacer width={8} />
      <Second />
      <Spacer width={8} />
      <Third />
    </Container>
  );
};

export default Loader;
