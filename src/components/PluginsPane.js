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
    this.state = {
      pluginsPaneOpen: true,
      pluginsPaneHeight: 29,
    };
    this.handleResizeStart = this.handleResizeStart.bind(this);
  }

  render() {
    const style = {
      height: this.state.pluginsPaneOpen
        ? this.state.pluginsPaneHeight
        : '29px',
    };

    return (
      <div className="plugins-pane" style={style}>
        <div
          className="plugins-pane__title"
          style={{
            cursor: this.state.pluginsPaneOpen ? 'row-resize' : 'n-resize',
          }}
          onMouseDown={this.handleResizeStart}>
          Plugins
        </div>

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

  handleResizeStart(downEvent) {
    downEvent.preventDefault();

    let didMove = false;
    const wasOpen = this.state.pluginsPaneOpen;
    const hadHeight = this.state.pluginsPaneHeight;
    const offset = downEvent.clientY - getTop(downEvent.target);

    let onMouseUp = () => {
      if (!didMove) {
        this.setState({ pluginsPaneOpen: !wasOpen });
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      onMouseMove = null;
      onMouseUp = null;
    };

    let onMouseMove = moveEvent => {
      if (moveEvent.buttons === 0) {
        return onMouseUp();
      }

      didMove = true;

      const editorBar = document.querySelector('.editorBar');
      const topSize = moveEvent.clientY - getTop(editorBar) - offset;
      const bottomSize = editorBar.clientHeight - topSize - 30;

      if (bottomSize < 60) {
        this.setState({
          pluginsPaneOpen: false,
          pluginsPaneHeight: hadHeight,
        });
      } else {
        this.setState({
          pluginsPaneOpen: true,
          pluginsPaneHeight: bottomSize,
        });
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}

function getTop(initialElem) {
  let pt = 0;
  let elem = initialElem;
  while (elem.offsetParent) {
    pt += elem.offsetTop;
    elem = elem.offsetParent;
  }
  return pt;
}
