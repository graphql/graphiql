import {
  InitializationFailedHandler,
  ResponseError,
  InitializeError
} from "vscode-languageclient";
import { OutputChannel } from "vscode";

export function CustomInitializationFailedHandler(
  outputChannel: OutputChannel
): InitializationFailedHandler {
  return (error: ResponseError<InitializeError> | Error | any) => {
    if (
      error
        .toString()
        .includes(`Request initialize failed with message: ".graphqlconfig"`)
    ) {
      outputChannel.appendLine(
        `Caught the error when there is no GraphQL config file: ${error}`
      );
      return false;
    } else {
      return true;
    }
  };
}
