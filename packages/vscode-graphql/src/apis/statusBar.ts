import {
  StatusBarAlignment,
  StatusBarItem,
  TextEditor,
  window,
  ThemeColor,
  version,
} from 'vscode';

import { LanguageClient, State } from 'vscode-languageclient/node';

enum Status {
  INIT = 1,
  RUNNING = 2,
  ERROR = 3,
}

// const statusBarText = 'GraphQL';

const oldStatusBarUIElements = {
  [Status.INIT]: {
    icon: 'sync',
    tooltip: 'GraphQL language server is initializing',
  },
  [Status.RUNNING]: {
    icon: 'plug',
    tooltip: 'GraphQL language server is running',
  },
  [Status.ERROR]: {
    icon: 'stop',
    color: new ThemeColor('list.warningForeground'),
    tooltip: 'GraphQL language server has stopped',
  },
};

// Uses an API added in Feb 2022
const statusBarUIElements = {
  [Status.INIT]: {
    icon: 'graphql-loading',
    tooltip: 'GraphQL language server is starting up, click to show logs',
  },
  [Status.RUNNING]: {
    icon: 'graphql-logo',
    tooltip: 'GraphQL language server is running, click to show logs',
  },
  [Status.ERROR]: {
    icon: 'graphql-error',
    color: new ThemeColor('list.warningForeground'),
    tooltip: 'GraphQL language server has stopped, click to show logs',
  },
};

// const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 0);
let extensionStatus: Status = Status.RUNNING;
let serverRunning = true; // TODO: See comment with client.onNotification("init".....

const statusBarActivationLanguageIds = [
  'graphql',
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
];

export const createStatusBar = () => {
  return window.createStatusBarItem(StatusBarAlignment.Right, 0);
};

export function initStatusBar(
  statusBarItem: StatusBarItem,
  client: LanguageClient,
  editor: TextEditor | undefined,
) {
  extensionStatus = Status.INIT;

  // TODO: Make graphql-language-service-server throw relevant
  // notifications. Currently, it does not throw "init" or "exit"
  // and status bar is hard coded to all greens.

  client.onNotification('init', _params => {
    extensionStatus = Status.RUNNING;
    serverRunning = true;
    updateStatusBar(statusBarItem, editor);
  });

  client.onNotification('exit', _params => {
    extensionStatus = Status.ERROR;
    serverRunning = false;
    updateStatusBar(statusBarItem, editor);
  });

  client.onDidChangeState(event => {
    if (event.newState === State.Running) {
      extensionStatus = Status.RUNNING;
      serverRunning = true;
    } else {
      extensionStatus = Status.ERROR;
      client.info('The graphql server has stopped running');
      serverRunning = false;
    }
    updateStatusBar(statusBarItem, editor);
  });

  updateStatusBar(statusBarItem, editor);

  window.onDidChangeActiveTextEditor((activeEditor: TextEditor | undefined) => {
    // update the status if the server is running
    updateStatusBar(statusBarItem, activeEditor);
  });
}

function updateStatusBar(
  statusBarItem: StatusBarItem,
  editor: TextEditor | undefined,
) {
  extensionStatus = serverRunning ? Status.RUNNING : Status.ERROR;

  // Support two different versions of the status bar UI,
  // a modern version which uses the new API which lets us use the GraphQL logo and
  // a legacy version which says 'graphql' in text.

  const [major, minor] = version.split('.');
  const userNewVersion =
    Number(major) > 1 || (Number(major) === 1 && Number(minor) >= 65);
  const statusBarUIElement = userNewVersion
    ? statusBarUIElements
    : oldStatusBarUIElements;
  const message = userNewVersion ? '' : ' GraphQL';

  const statusUI = statusBarUIElement[extensionStatus];
  statusBarItem.text = `$(${statusUI.icon})${message}`;
  statusBarItem.tooltip = statusUI.tooltip;
  statusBarItem.command = 'vscode-graphql.showOutputChannel';
  if ('color' in statusUI) {
    statusBarItem.color = statusUI.color;
  }

  if (
    editor &&
    statusBarActivationLanguageIds.indexOf(editor.document.languageId) > -1
  ) {
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}
