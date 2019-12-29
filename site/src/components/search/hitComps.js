import React, { Fragment } from 'react';
import { Highlight, Snippet } from 'react-instantsearch-dom';
import { Link } from 'gatsby';

export const PageHit = clickHandler => ({ hit }) => (
  <div>
    <Link to={hit.slug} onClick={clickHandler}>
      <div>
        <Highlight attribute="title" hit={hit} tagName="mark" />
      </div>
    </Link>
    <Snippet attribute="excerpt" hit={hit} tagName="mark" />
  </div>
);
