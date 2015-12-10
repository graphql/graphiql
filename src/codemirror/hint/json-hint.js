/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE-examples file in the root directory of this source tree.
 */

import CodeMirror from 'codemirror';

CodeMirror.registerHelper('hint', 'json', (editor, options) => {
  var cur = editor.getCursor();
  var token = editor.getTokenAt(cur);
  var tokenStart = token.type === null ? token.end :
    /\w/.test(token.string[0]) ? token.start :
    token.start + 1;

  // Match all variableDefinitions, even if they're not declared on the top.
  // De-duplicate before filtering/sorting the list
  let hintList = options.query.match(/\$\s*[_A-Za-z][_0-9A-Za-z]*/g);
  let hintMap = {};
  hintList.forEach(hint => {
    hintMap[hint] = true;
  });

  let hints = filterAndSortList(
    Object.keys(hintMap),
    normalizeText(token.string)
  );

  var results = {
    list: hints,
    from: CodeMirror.Pos(cur.line, tokenStart),
    to: CodeMirror.Pos(cur.line, token.end),
  };

  CodeMirror.signal(editor, 'hasCompletion', editor, results, token);

  return results;
});

// Given a list of hint entries and currently typed text, sort and filter to
// provide a concise list.
function filterAndSortList(list, text) {
  var sorted = !text ? list : list.map(
    entry => ({
      proximity: getProximity(normalizeText(entry), text),
      entry
    })
  ).filter(
    pair => pair.proximity <= 2
  ).sort(
    (a, b) =>
      (a.proximity - b.proximity) ||
      (a.entry.length - b.entry.length)
  ).map(
    pair => pair.entry
  );

  return sorted.length > 0 ? sorted : list;
}

function normalizeText(text) {
  return text.toLowerCase().replace(/\W/g, '');
}

// Determine a numeric proximity for a suggestion based on current text.
function getProximity(suggestion, text) {
  // start with lexical distance
  var proximity = lexicalDistance(text, suggestion);
  if (suggestion.length > text.length) {
    // do not penalize long suggestions.
    proximity -= suggestion.length - text.length - 1;
    // penalize suggestions not starting with this phrase
    proximity += suggestion.indexOf(text) === 0 ? 0 : 0.5;
  }
  return proximity;
}

/**
 * Computes the lexical distance between strings A and B.
 *
 * The "distance" between two strings is given by counting the minimum number
 * of edits needed to transform string A into string B. An edit can be an
 * insertion, deletion, or substitution of a single character, or a swap of two
 * adjacent characters.
 *
 * This distance can be useful for detecting typos in input or sorting
 *
 * @param {string} a
 * @param {string} b
 * @return {int} distance in number of edits
 */
function lexicalDistance(a, b) {
  var i;
  var j;
  var d = [];
  var aLength = a.length;
  var bLength = b.length;

  for (i = 0; i <= aLength; i++) {
    d[i] = [ i ];
  }

  for (j = 1; j <= bLength; j++) {
    d[0][j] = j;
  }

  for (i = 1; i <= aLength; i++) {
    for (j = 1; j <= bLength; j++) {
      var cost = a[i - 1] === b[j - 1] ? 0 : 1;

      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );

      if (i > 1 && j > 1 &&
          a[i - 1] === b[j - 2] &&
          a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[aLength][bLength];
}
