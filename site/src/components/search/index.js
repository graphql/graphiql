import React, { useState, useEffect, createRef } from 'react';
import {
  InstantSearch,
  Index,
  Hits,
  Configure,
  Pagination,
  connectStateResults,
} from 'react-instantsearch-dom';
import algoliasearch from 'algoliasearch/lite';
import config from '../../../config.js';

import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { PoweredBy } from './styles';
import { Search } from 'styled-icons/fa-solid/Search';
import Input from './input';
import * as hitComps from './hitComps';
import '../styles.css';

const SearchIcon = styled(Search)`
  width: 1em;
  pointer-events: none;
`;

const HitsWrapper = styled.div`
  display: ${props => (props.show ? `grid` : `none`)};
  max-height: 80vh;
  overflow: scroll;
  z-index: 2;
  -webkit-overflow-scrolling: touch;
  position: absolute;
  right: 0;
  top: calc(100% + 0.5em);
  width: 80vw;
  max-width: 30em;
  box-shadow: 0 0 5px 0;
  padding: 0.7em 1em 0.4em;
  background: white;
  @media only screen and (max-width: 991px) {
    width: 400px;
    max-width: 400px;
  }
  @media only screen and (max-width: 767px) {
    width: 100%;
    max-width: 500px;
  }
  border-radius: ${props => props.theme.smallBorderRadius};
  > * + * {
    padding-top: 1em !important;
    border-top: 2px solid ${props => props.theme.darkGray};
  }
  li + li {
    margin-top: 0.7em;
    padding-top: 0.7em;
    border-top: 1px solid ${props => props.theme.lightGray};
  }
  * {
    margin-top: 0;
    padding: 0;
    color: black !important;
  }
  ul {
    list-style: none;
  }
  mark {
    color: ${props => props.theme.lightBlue};
    background: ${props => props.theme.darkBlue};
  }
  header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.3em;
    h3 {
      color: black;
      background: ${props => props.theme.gray};
      padding: 0.1em 0.4em;
      border-radius: ${props => props.theme.smallBorderRadius};
    }
  }
  h3 {
    color: black;
    margin: 0 0 0.5em;
  }
  h4 {
    color: black;
    margin-bottom: 0.3em;
  }
`;
const Root = styled.div`
  position: relative;
  display: grid;
  grid-gap: 1em;
  @media only screen and (max-width: 767px) {
    width: 100%;
  }
`;

const Results = connectStateResults(
  ({ searching, searchState: state, searchResults: res }) =>
    (searching && `Searching...`) ||
    (res && res.nbHits === 0 && `No results for '${state.query}'`),
);

const useClickOutside = (ref, handler, events) => {
  if (!events) {
    events = [`mousedown`, `touchstart`];
  }
  const detectClickOutside = event =>
    ref && ref.current && !ref.current.contains(event.target) && handler();
  useEffect(() => {
    for (const event of events) {
      document.addEventListener(event, detectClickOutside);
    }
    return () => {
      for (const event of events) {
        document.removeEventListener(event, detectClickOutside);
      }
    };
  });
};

export default function SearchComponent({ indices, collapse, hitsAsGrid }) {
  const ref = createRef();
  const [query, setQuery] = useState(``);
  const [focus, setFocus] = useState(false);
  const searchClient = algoliasearch(
    config.header.search.algoliaAppId,
    config.header.search.algoliaSearchKey,
  );
  useClickOutside(ref, () => setFocus(false));
  const displayResult =
    query.length > 0 && focus ? 'showResults' : 'hideResults';
  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={indices[0].name}
      onSearchStateChange={({ query }) => setQuery(query)}
      root={{ Root, props: { ref } }}>
      <Input onFocus={() => setFocus(true)} {...{ collapse, focus }} />
      <HitsWrapper
        className={'hitWrapper ' + displayResult}
        show={query.length > 0 && focus}
        asGrid={hitsAsGrid}>
        {indices.map(({ name, title, hitComp, type }) => {
          return (
            <Index key={name} indexName={name}>
              <Results />
              <Hits hitComponent={hitComps[hitComp](() => setFocus(false))} />
            </Index>
          );
        })}
        <PoweredBy />
      </HitsWrapper>
      <Configure hitsPerPage={5} />
    </InstantSearch>
  );
}
