import * as testRunner from "vscode/lib/testrunner";

testRunner.configure({
 ui: "tdd",
 useColors: true
});

module.exports = testRunner;
