import React from 'react';
import { connectSearchBox } from 'react-instantsearch-dom';

import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { Search } from 'styled-icons/fa-solid/Search';

const SearchIcon = styled(Search)`
  width: 1em;
  pointer-events: none;
  margin-right: 10px;
`;
const focus = props => css`
  background: white;
  color: ${props => props.theme.darkBlue};
  cursor: text;
  width: 5em;
  + ${SearchIcon} {
    color: ${props => props.theme.darkBlue};
    margin: 0.3em;
  }
`;
const collapse = props => css`
  width: 0;
  cursor: pointer;
  color: ${props => props.theme.lightBlue};
  + ${SearchIcon} {
    color: white;
  }
  ${props => props.focus && focus()}
  margin-left: ${props => (props.focus ? `-1.6em` : `-1em`)};
  padding-left: ${props => (props.focus ? `1.6em` : `1em`)};
  ::placeholder {
    color: ${props => props.theme.gray};
  }
`;
const expand = props => css`
  background: ${props => props.theme.veryLightGray};
  width: 6em;
  margin-left: -1.6em;
  padding-left: 1.6em;
  + ${SearchIcon} {
    margin: 0.3em;
  }
`;

const collapseExpand = props => css`
  ${props => (props.collapse ? collapse() : expand())}
`;

const Input = styled.input`
  outline: none;
  border: none;
  font-size: 1em;
  background: white;
  transition: ${props => props.theme.shortTrans};
  border-radius: ${props => props.theme.smallBorderRadius};
  {collapseExpand}
`;
const Form = styled.form`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  @media only screen and (max-width: 767px) {
    width: 100%;
    margin-left: 15px;
  }
`;

export default connectSearchBox(({ refine, ...rest }) => {
  const preventSubmit = e => {
    e.preventDefault();
  };
  return (
    <Form className={'formElement'} onSubmit={preventSubmit}>
      <SearchIcon />
      <Input
        className={'searchInput '}
        type="text"
        placeholder="Search"
        aria-label="Search"
        onChange={e => refine(e.target.value)}
        {...rest}
      />
    </Form>
  );
});
