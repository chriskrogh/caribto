import './dropdown.css';

import React from 'react';
import ReactDropdown, { ReactDropdownProps } from 'react-dropdown';
import styled from 'styled-components';

type StyledDropdownProps = {
  fullWidth?: boolean;
};
const StyledDropdown = styled(ReactDropdown)<StyledDropdownProps>`
  width: ${({ fullWidth }) =>
    fullWidth ? `calc(100% - ${16 * 2}px)` : 'auto'};
`;

export type Props = ReactDropdownProps & StyledDropdownProps;

const Dropdown: React.FC<Props> = (props) => {
  return <StyledDropdown {...props} />;
};

export default Dropdown;
