import React from 'react';
import Layout from './Layout';
import Nav from './Nav';

export default { title: 'Layout' };

export const withDefaultSlots = () => <Layout />;

export const withCustomSlots = () => <Layout nav={<Nav />} />;
