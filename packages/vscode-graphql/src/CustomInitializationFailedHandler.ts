import {
  InitializationFailedHandler,
  ResponseError,
  InitializeError,
} from 'vscode-languageclient';
import { OutputChannel } from 'vscode';

export function CustomInitializationFailedHandler(
  outputChannel: OutputChannel,
): InitializationFailedHandler {
  return (error: ResponseError<InitializeError> | Error | any) => {
    outputChannel.appendLine(`Caught the error ${error}`);
    error.stack && outputChannel.appendLine(error.stack);
    return false;
  };
}
