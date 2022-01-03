import type { Meta, Story } from '@storybook/react';
import styled from 'styled-components';

import Dropdown, { Props } from './Dropdown';

export default {
  title: 'Common/Dropdown',
  component: Dropdown,
} as Meta;

const Wrapper = styled.div`
  width: 400px;
  padding: 16px;
  min-height: 200px;
  background-color: #000;
`;

export const Default: Story<Props> = (args) => {
  return (
    <Wrapper>
      <Dropdown {...args} />
    </Wrapper>
  );
};
Default.args = {
  options: [
    { label: 'Option 1', value: 'option-1' },
    { label: 'Option 2', value: 'option-2' },
    { label: 'Option 3', value: 'option-3' },
  ],
  fullWidth: true,
};
