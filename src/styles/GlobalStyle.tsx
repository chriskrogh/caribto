import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  h1 {
    font-family: Inter;
    font-size: 52px;
    font-weight: 700;
    line-height: 60px;
    letter-spacing: 3;
  }
  h2 {
    font-family: Inter;
    font-size: 44px;
    font-weight: 400;
    line-height: 50px;
    letter-spacing: 2;
  }
  h3 {
    font-family: Inter;
    font-size: 36px;
    font-weight: 300;
    line-height: 44px;
    letter-spacing: 1;
  }
  h4 {
    font-family: Jost;
    font-size: 28px;
    font-weight: 300;
    line-height: 36px;
    letter-spacing: 1;
  }
  h5 {
    font-family: Jost;
    font-size: 22px;
    font-weight: 300;
    line-height: 30px;
    letter-spacing: 0.5;
  }
  p {
    font-family: Jost;
    font-size: 18px;
    font-weight: 300;
    line-height: 28px;
    letter-spacing: 0.25;
  }
`;

export default GlobalStyle;
