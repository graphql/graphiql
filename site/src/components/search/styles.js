import React from 'react';
import { Algolia } from 'styled-icons/fa-brands/Algolia';
import '../styles.css';

export const PoweredBy = () => (
  <span className="poweredBy">
    Powered by{` `}
    <a href="https://algolia.com">
      <Algolia size="1em" /> Algolia
    </a>
  </span>
);
