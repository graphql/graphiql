import React from 'react';
import PropTypes from 'prop-types';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

export class PluginsPane extends React.Component {
  static propTypes = [
    {
      plugins: PropTypes.arrayOf(
        PropTypes.shape({
          title: PropTypes.string,
          content: PropTypes.any,
        }),
      ),
    },
  ];

  constructor() {
    super();
  }

  render() {
    return (
      <div className="plugins-pane">
        <Tabs>
          {this.tabList()}
          {this.tabPanels()}
        </Tabs>
      </div>
    );
  }

  tabList() {
    const tabs = this.props.plugins.map((plugin, id) =>
      <Tab key={id}> {plugin.title} </Tab>,
    );
    return <TabList>{tabs}</TabList>;
  }

  tabPanels() {
    const tabs = this.props.plugins.map((plugin, id) => {
      return <TabPanel key={id}> {plugin.content} </TabPanel>;
    });
    return tabs;
  }
}
