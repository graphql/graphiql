/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import {
  isInputType,
  isCompositeType,
  isAbstractType,
  getNullableType,
  getNamedType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql/type';
import {
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
} from 'graphql/type/introspection';
import lexicalDistance from './lexicalDistance';


CodeMirror.registerHelper('hint', 'graphql', (editor, options) => {
  var schema = options.schema;
  if (!schema) {
    return;
  }

  var cur = editor.getCursor();
  var token = editor.getTokenAt(cur);
  var typeInfo = getTypeInfo(schema, token.state);

  var state = token.state;
  var kind = state.kind;
  var step = state.step;

  if (token.type === 'comment') {
    return;
  }

  // Definition kinds
  if (kind === 'Document') {
    return hintList(editor, options, cur, token, [
      { text: 'query' },
      { text: 'mutation' },
      { text: 'fragment' },
      { text: '{' },
    ]);
  }

  // Field names
  if (kind === 'SelectionSet' || kind === 'Field' || kind === 'AliasedField') {
    if (typeInfo.parentType) {
      var fields;
      if (typeInfo.parentType.getFields) {
        var fieldObj = typeInfo.parentType.getFields();
        fields = Object.keys(fieldObj).map(fieldName => fieldObj[fieldName]);
      } else {
        fields = [];
      }
      if (isAbstractType(typeInfo.parentType)) {
        fields.push(TypeNameMetaFieldDef);
      }
      if (typeInfo.parentType === schema.getQueryType()) {
        fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
      }
      return hintList(editor, options, cur, token, fields.map(field => ({
        text: field.name,
        type: field.type,
        description: field.description
      })));
    }
  }

  // Argument names
  if (kind === 'Arguments' || kind === 'Argument' && step === 0) {
    var argDefs = typeInfo.argDefs;
    if (argDefs) {
      return hintList(editor, options, cur, token, argDefs.map(argDef => ({
        text: argDef.name,
        type: argDef.type,
        description: argDef.description
      })));
    }
  }

  // Input Object fields
  if (kind === 'ObjectValue' || kind === 'ObjectField' && step === 0) {
    if (typeInfo.objectFieldDefs) {
      var objectFields = Object.keys(typeInfo.objectFieldDefs)
        .map(fieldName => typeInfo.objectFieldDefs[fieldName]);
      return hintList(editor, options, cur, token, objectFields.map(field => ({
        text: field.name,
        type: field.type,
        description: field.description
      })));
    }
  }

  // Input values: Enum and Boolean
  if (kind === 'EnumValue' ||
      kind === 'ListValue' && step === 1 ||
      kind === 'ObjectField' && step === 2 ||
      kind === 'Argument' && step === 2) {
    var namedInputType = getNamedType(typeInfo.inputType);
    if (namedInputType instanceof GraphQLEnumType) {
      var valueMap = namedInputType.getValues();
      var values = Object.keys(valueMap).map(valueName => valueMap[valueName]);
      return hintList(editor, options, cur, token, values.map(value => ({
        text: value.name,
        type: namedInputType,
        description: value.description
      })));
    } else if (namedInputType === GraphQLBoolean) {
      return hintList(editor, options, cur, token, [
        { text: 'true', type: GraphQLBoolean, description: 'Not false.' },
        { text: 'false', type: GraphQLBoolean, description: 'Not true.' },
      ]);
    }
  }

  // Fragment type conditions
  if (kind === 'FragmentDefinition' && step === 3 ||
      kind === 'InlineFragment' && step === 2 ||
      kind === 'NamedType' && (
        state.prevState.kind === 'FragmentDefinition' ||
        state.prevState.kind === 'InlineFragment')) {
    var possibleTypes;
    if (typeInfo.parentType) {
      possibleTypes = isAbstractType(typeInfo.parentType) ?
        typeInfo.parentType.getPossibleTypes() :
        [ typeInfo.parentType ];
    } else {
      var typeMap = schema.getTypeMap();
      possibleTypes = Object.keys(typeMap)
        .map(typeName => typeMap[typeName])
        .filter(isCompositeType);
    }
    return hintList(editor, options, cur, token, possibleTypes.map(type => ({
      text: type.name,
      description: type.description
    })));
  }

  // Variable definition types
  if (kind === 'VariableDefinition' && step === 2 ||
      kind === 'ListType' && step === 1 ||
      kind === 'NamedType' && (
        state.prevState.kind === 'VariableDefinition' ||
        state.prevState.kind === 'ListType')) {
    var inputTypeMap = schema.getTypeMap();
    var inputTypes = Object.keys(inputTypeMap)
      .map(typeName => inputTypeMap[typeName])
      .filter(isInputType);
    return hintList(editor, options, cur, token, inputTypes.map(type => ({
      text: type.name,
      description: type.description
    })));
  }

  // Directive names
  if (kind === 'Directive') {
    var directives = schema.getDirectives().filter(directive =>
      (directive.onField && state.prevState.kind === 'Field') ||
      (directive.onFragment &&
        (state.prevState.kind === 'FragmentDefinition' ||
         state.prevState.kind === 'InlineFragment' ||
         state.prevState.kind === 'FragmentSpread')) ||
      (directive.onOperation &&
        (state.prevState.kind === 'Query' ||
         state.prevState.kind === 'Mutation'))
    );
    return hintList(editor, options, cur, token, directives.map(directive => ({
      text: directive.name,
      description: directive.description
    })));
  }
});


// Utility for collecting rich type information given any token's state
// from the graphql-mode parser.
function getTypeInfo(schema, tokenState) {
  var info = {
    type: null,
    parentType: null,
    inputType: null,
    directiveDef: null,
    fieldDef: null,
    argDef: null,
    argDefs: null,
    objectFieldDefs: null,
  };

  forEachState(tokenState, state => {
    switch (state.kind) {
      case 'Query': case 'ShortQuery':
        info.type = schema.getQueryType();
        break;
      case 'Mutation':
        info.type = schema.getMutationType();
        break;
      case 'InlineFragment':
      case 'FragmentDefinition':
        info.type = state.type && schema.getType(state.type);
        break;
      case 'Field':
        info.fieldDef = info.type && state.name ?
          getFieldDef(schema, info.parentType, state.name) :
          null;
        info.type = info.fieldDef && info.fieldDef.type;
        break;
      case 'SelectionSet':
        info.parentType = getNamedType(info.type);
        break;
      case 'Directive':
        info.directiveDef = state.name && schema.getDirective(state.name);
        break;
      case 'Arguments':
        info.argDefs =
          state.prevState.kind === 'Field' ?
            info.fieldDef && info.fieldDef.args :
          state.prevState.kind === 'Directive' ?
            info.directiveDef && info.directiveDef.args :
            null;
        break;
      case 'Argument':
        info.argDef = null;
        if (info.argDefs) {
          for (var i = 0; i < info.argDefs.length; i++) {
            if (info.argDefs[i].name === state.name) {
              info.argDef = info.argDefs[i];
              break;
            }
          }
        }
        info.inputType = info.argDef && info.argDef.type;
        break;
      case 'ListValue':
        var nullableType = getNullableType(info.inputType);
        info.inputType = nullableType instanceof GraphQLList ?
          nullableType.ofType :
          null;
        break;
      case 'ObjectValue':
        var objectType = getNamedType(info.inputType);
        info.objectFieldDefs = objectType instanceof GraphQLInputObjectType ?
          objectType.getFields() :
          null;
        break;
      case 'ObjectField':
        var objectField = state.name && info.objectFieldDefs ?
          info.objectFieldDefs[state.name] :
          null;
        info.inputType = objectField && objectField.type;
        break;
    }
  });

  return info;
}

// Utility for iterating through a state stack bottom-up.
function forEachState(stack, fn) {
  var reverseStateStack = [];
  var state = stack;
  while (state && state.kind) {
    reverseStateStack.push(state);
    state = state.prevState;
  }
  for (var i = reverseStateStack.length - 1; i >= 0; i--) {
    fn(reverseStateStack[i]);
  }
}

// Gets the field definition given a type and field name
function getFieldDef(schema, type, fieldName) {
  if (fieldName === SchemaMetaFieldDef.name && schema.getQueryType() === type) {
    return SchemaMetaFieldDef;
  }
  if (fieldName === TypeMetaFieldDef.name && schema.getQueryType() === type) {
    return TypeMetaFieldDef;
  }
  if (fieldName === TypeNameMetaFieldDef.name && isCompositeType(type)) {
    return TypeNameMetaFieldDef;
  }
  if (type.getFields) {
    return type.getFields()[fieldName];
  }
}

// Create the expected hint response given a possible list and a token
function hintList(editor, options, cursor, token, list) {
  var hints = filterAndSortList(list, normalizeText(token.string));
  if (!hints) {
    return;
  }

  var tokenStart = token.type === null ? token.end :
    /\w/.test(token.string[0]) ? token.start :
    token.start + 1;

  var results = {
    list: hints,
    from: CodeMirror.Pos(cursor.line, tokenStart),
    to: CodeMirror.Pos(cursor.line, token.end),
  };

  // GraphiQL displays the custom typeahead which appends information to the
  // end of the UI.
  if (options.displayInfo) {
    var wrapper;
    var information;

    // When a hint result is selected, we touch the UI.
    CodeMirror.on(results, 'select', (ctx, el) => {
      // Only the first time (usually when the hint UI is first displayed)
      // do we create the wrapping node.
      if (!wrapper) {
        // Wrap the existing hint UI, so we have a place to put information.
        var hintsUl = el.parentNode;
        var container = hintsUl.parentNode;
        wrapper = document.createElement('div');
        container.appendChild(wrapper);

        // CodeMirror vertically inverts the hint UI if there is not enough
        // space below the cursor. Since this modified UI appends to the bottom
        // of CodeMirror's existing UI, it could cover the cursor. This adjusts
        // the positioning of the hint UI to accomodate.
        var top = hintsUl.style.top;
        var bottom = '';
        var cursorTop = editor.cursorCoords().top;
        if (parseInt(top, 10) < cursorTop) {
          top = '';
          bottom = (window.innerHeight - cursorTop + 3) + 'px';
        }

        // Style the wrapper, remove positioning from hints. Note that usage
        // of this option will need to specify CSS to remove some styles from
        // the existing hint UI.
        wrapper.className = 'CodeMirror-hints-wrapper';
        wrapper.style.left = hintsUl.style.left;
        wrapper.style.top = top;
        wrapper.style.bottom = bottom;
        hintsUl.style.left = '';
        hintsUl.style.top = '';

        // This "information" node will contain the additional info about the
        // highlighted typeahead option.
        information = document.createElement('div');
        information.className = 'CodeMirror-hint-information';
        if (bottom) {
          wrapper.appendChild(information);
          wrapper.appendChild(hintsUl);
        } else {
          wrapper.appendChild(hintsUl);
          wrapper.appendChild(information);
        }

        // When CodeMirror attempts to remove the hint UI, we detect that it was
        // removed from our wrapper and in turn remove the wrapper from the
        // original container.
        var onRemoveFn;
        wrapper.addEventListener('DOMNodeRemoved', onRemoveFn = event => {
          if (event.target === hintsUl) {
            wrapper.removeEventListener('DOMNodeRemoved', onRemoveFn);
            wrapper.parentNode.removeChild(wrapper);
            wrapper = null;
            information = null;
            onRemoveFn = null;
          }
        });
      }

      // Now that the UI has been set up, add info to information.
      var renderInfoFn =
        ctx.renderInfo || options.renderInfo || defaultRenderInfo;
      renderInfoFn(information, ctx);
    });
  }

  return results;
}

function defaultRenderInfo(elem, ctx) {
  elem.innerHTML = ctx.description || 'Self descriptive.';
}

// Given a list of hint entries and currently typed text, sort and filter to
// provide a concise list.
function filterAndSortList(list, text) {
  var sorted = !text ? list : list.map(
    entry => ({
      proximity: getProximity(normalizeText(entry.text), text),
      entry
    })
  ).filter(
    pair => pair.proximity <= 2
  ).sort(
    (a, b) =>
      (a.proximity - b.proximity) ||
      (a.entry.text.length - b.entry.text.length)
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
