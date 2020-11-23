/**
 *  Copyright (c) 2020 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
} from 'graphql';

import jsonParse from '../utils/jsonParse';

/**
 * Registers a "lint" helper for CodeMirror.
 *
 * Using CodeMirror's "lint" addon: https://codemirror.net/demo/lint.html
 * Given the text within an editor, this helper will take that text and return
 * a list of linter issues ensuring that correct variables were provided.
 *
 * Options:
 *
 *   - variableToType: { [variable: string]: GraphQLInputType }
 *
 */
CodeMirror.registerHelper(
  'lint',
  'graphql-variables',
  (text, options, editor) => {
    // If there's no text, do nothing.
    if (!text) {
      return [];
    }

    // First, linter needs to determine if there are any parsing errors.
    let ast;
    try {
      ast = jsonParse(text);
    } catch (syntaxError) {
      if (syntaxError.stack) {
        throw syntaxError;
      }
      return [lintError(editor, syntaxError, syntaxError.message)];
    }

    // If there are not yet known variables, do nothing.
    const variableToType = options.variableToType;
    if (!variableToType) {
      return [];
    }

    // Then highlight any issues with the provided variables.
    return validateVariables(editor, variableToType, ast);
  },
);

// Given a variableToType object, a source text, and a JSON AST, produces a
// list of CodeMirror annotations for any variable validation errors.
function validateVariables(editor, variableToType, variablesAST) {
  const errors = [];

  variablesAST.members.forEach(member => {
    const variableName = member.key.value;
    const type = variableToType[variableName];
    if (!type) {
      errors.push(
        lintError(
          editor,
          member.key,
          `Variable "$${variableName}" does not appear in any GraphQL query.`,
        ),
      );
    } else {
      validateValue(type, member.value).forEach(([node, message]) => {
        errors.push(lintError(editor, node, message));
      });
    }
  });

  return errors;
}

// Returns a list of validation errors in the form Array<[Node, String]>.
function validateValue(type, valueAST) {
  // Validate non-nullable values.
  if (type instanceof GraphQLNonNull) {
    if (valueAST.kind === 'Null') {
      return [[valueAST, `Type "${type}" is non-nullable and cannot be null.`]];
    }
    return validateValue(type.ofType, valueAST);
  }

  if (valueAST.kind === 'Null') {
    return [];
  }

  // Validate lists of values, accepting a non-list as a list of one.
  if (type instanceof GraphQLList) {
    const itemType = type.ofType;
    if (valueAST.kind === 'Array') {
      return mapCat(valueAST.values, item => validateValue(itemType, item));
    }
    return validateValue(itemType, valueAST);
  }

  // Validate input objects.
  if (type instanceof GraphQLInputObjectType) {
    if (valueAST.kind !== 'Object') {
      return [[valueAST, `Type "${type}" must be an Object.`]];
    }

    // Validate each field in the input object.
    const providedFields = Object.create(null);
    const fieldErrors = mapCat(valueAST.members, member => {
      const fieldName = member.key.value;
      providedFields[fieldName] = true;
      const inputField = type.getFields()[fieldName];
      if (!inputField) {
        return [
          [member.key, `Type "${type}" does not have a field "${fieldName}".`],
        ];
      }
      const fieldType = inputField ? inputField.type : undefined;
      return validateValue(fieldType, member.value);
    });

    // Look for missing non-nullable fields.
    Object.keys(type.getFields()).forEach(fieldName => {
      if (!providedFields[fieldName]) {
        const fieldType = type.getFields()[fieldName].type;
        if (fieldType instanceof GraphQLNonNull) {
          fieldErrors.push([
            valueAST,
            `Object of type "${type}" is missing required field "${fieldName}".`,
          ]);
        }
      }
    });

    return fieldErrors;
  }

  // Validate common scalars.
  if (
    (type.name === 'Boolean' && valueAST.kind !== 'Boolean') ||
    (type.name === 'String' && valueAST.kind !== 'String') ||
    (type.name === 'ID' &&
      valueAST.kind !== 'Number' &&
      valueAST.kind !== 'String') ||
    (type.name === 'Float' && valueAST.kind !== 'Number') ||
    (type.name === 'Int' &&
      // eslint-disable-next-line no-bitwise
      (valueAST.kind !== 'Number' || (valueAST.value | 0) !== valueAST.value))
  ) {
    return [[valueAST, `Expected value of type "${type}".`]];
  }

  // Validate enums and custom scalars.
  if (type instanceof GraphQLEnumType || type instanceof GraphQLScalarType) {
    if (
      (valueAST.kind !== 'String' &&
        valueAST.kind !== 'Number' &&
        valueAST.kind !== 'Boolean' &&
        valueAST.kind !== 'Null') ||
      isNullish(type.parseValue(valueAST.value))
    ) {
      return [[valueAST, `Expected value of type "${type}".`]];
    }
  }

  return [];
}

// Give a parent text, an AST node with location, and a message, produces a
// CodeMirror annotation object.
function lintError(editor, node, message) {
  return {
    message,
    severity: 'error',
    type: 'validation',
    from: editor.posFromIndex(node.start),
    to: editor.posFromIndex(node.end),
  };
}

function isNullish(value: mixed): boolean {
  // eslint-disable-next-line no-self-compare
  return value === null || value === undefined || value !== value;
}

function mapCat<T>(array: Array<T>, mapper: (item: T) => Array<T>): Array<T> {
  return Array.prototype.concat.apply([], array.map(mapper));
}
