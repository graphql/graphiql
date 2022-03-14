import {
  StatusBarAlignment,
  StatusBarItem,
  TextEditor,
  window,
  ThemeColor,
} from 'vscode';
import { LanguageClient, State } from 'vscode-languageclient';

enum Status {
  INIT = 1,
  RUNNING = 2,
  ERROR = 3,
}

const statusBarText = 'GraphQL';
const statusBarUIElements = {
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

// const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 0);
let extensionStatus: Status = Status.RUNNING;
let serverRunning: boolean = true; // TODO: See comment with client.onNotification("init".....

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

  const statusUI = statusBarUIElements[extensionStatus];
  statusBarItem.text = `$(${statusUI.icon}) ${statusBarText}`;
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
