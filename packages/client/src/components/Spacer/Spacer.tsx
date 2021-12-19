import styled from 'styled-components';

type Props = {
  width?: number;
  height?: number;
};

const Spacer = styled.span<Props>`
  display: inline-block;
  min-width: ${({ width = 1 }) => width}px;
  min-height: ${({ height = 1 }) => height}px;
`;

export default Spacer;
