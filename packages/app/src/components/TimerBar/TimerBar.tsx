import styled, { keyframes } from 'styled-components';

const HEIGHT = 4;

const shrink = keyframes`
  to {
    width: 0;
    visibility: hidden;
  }
`;

type Props = {
  duration: number;
};

const TimerBar = styled.hr<Props>`
  width: 100%;
  height: ${HEIGHT}px;
  border-radius: ${HEIGHT / 2}px;
  animation: ${shrink} ${({ duration }) => duration}ms linear forwards;
`;

export default TimerBar;
