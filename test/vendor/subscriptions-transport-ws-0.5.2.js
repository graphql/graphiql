var SubscriptionsTransportWs =
  /******/ (function(modules) { // webpackBootstrap
  /******/ 	// The module cache
  /******/ 	var installedModules = {};

  /******/ 	// The require function
  /******/ 	function __webpack_require__(moduleId) {

    /******/ 		// Check if module is in cache
    /******/ 		if(installedModules[moduleId])
    /******/ 			return installedModules[moduleId].exports;

    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = installedModules[moduleId] = {
      /******/ 			i: moduleId,
      /******/ 			l: false,
      /******/ 			exports: {}
      /******/ 		};

    /******/ 		// Execute the module function
    /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

    /******/ 		// Flag the module as loaded
    /******/ 		module.l = true;

    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}


  /******/ 	// expose the modules object (__webpack_modules__)
  /******/ 	__webpack_require__.m = modules;

  /******/ 	// expose the module cache
  /******/ 	__webpack_require__.c = installedModules;

  /******/ 	// identity function for calling harmony imports with the correct context
  /******/ 	__webpack_require__.i = function(value) { return value; };

  /******/ 	// define getter function for harmony exports
  /******/ 	__webpack_require__.d = function(exports, name, getter) {
    /******/ 		if(!__webpack_require__.o(exports, name)) {
      /******/ 			Object.defineProperty(exports, name, {
        /******/ 				configurable: false,
        /******/ 				enumerable: true,
        /******/ 				get: getter
        /******/ 			});
      /******/ 		}
    /******/ 	};

  /******/ 	// getDefaultExport function for compatibility with non-harmony modules
  /******/ 	__webpack_require__.n = function(module) {
    /******/ 		var getter = module && module.__esModule ?
      /******/ 			function getDefault() { return module['default']; } :
      /******/ 			function getModuleExports() { return module; };
    /******/ 		__webpack_require__.d(getter, 'a', getter);
    /******/ 		return getter;
    /******/ 	};

  /******/ 	// Object.prototype.hasOwnProperty.call
  /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

  /******/ 	// __webpack_public_path__
  /******/ 	__webpack_require__.p = "";

  /******/ 	// Load entry module and return exports
  /******/ 	return __webpack_require__(__webpack_require__.s = 9);
  /******/ })
/************************************************************************/
/******/ ([
  /* 0 */
  /***/ (function(module, exports, __webpack_require__) {

    "use strict";

    var printer_1 = __webpack_require__(8);
    function addGraphQLSubscriptions(networkInterface, wsClient) {
      return Object.assign(networkInterface, {
        subscribe: function (request, handler) {
          return wsClient.subscribe({
            query: printer_1.print(request.query),
            variables: request.variables,
          }, handler);
        },
        unsubscribe: function (id) {
          wsClient.unsubscribe(id);
        },
      });
    }
    exports.addGraphQLSubscriptions = addGraphQLSubscriptions;
//# sourceMappingURL=helpers.js.map

    /***/ }),
  /* 1 */
  /***/ (function(module, exports, __webpack_require__) {

    "use strict";

    var SUBSCRIPTION_FAIL = 'subscription_fail';
    exports.SUBSCRIPTION_FAIL = SUBSCRIPTION_FAIL;
    var SUBSCRIPTION_END = 'subscription_end';
    exports.SUBSCRIPTION_END = SUBSCRIPTION_END;
    var SUBSCRIPTION_DATA = 'subscription_data';
    exports.SUBSCRIPTION_DATA = SUBSCRIPTION_DATA;
    var SUBSCRIPTION_START = 'subscription_start';
    exports.SUBSCRIPTION_START = SUBSCRIPTION_START;
    var SUBSCRIPTION_SUCCESS = 'subscription_success';
    exports.SUBSCRIPTION_SUCCESS = SUBSCRIPTION_SUCCESS;
    var KEEPALIVE = 'keepalive';
    exports.KEEPALIVE = KEEPALIVE;
    var INIT = 'init';
    exports.INIT = INIT;
    var INIT_SUCCESS = 'init_success';
    exports.INIT_SUCCESS = INIT_SUCCESS;
    var INIT_FAIL = 'init_fail';
    exports.INIT_FAIL = INIT_FAIL;
//# sourceMappingURL=messageTypes.js.map

    /***/ }),
  /* 2 */
  /***/ (function(module, exports, __webpack_require__) {

    "use strict";

    var GRAPHQL_SUBSCRIPTIONS = 'graphql-subscriptions';
    exports.GRAPHQL_SUBSCRIPTIONS = GRAPHQL_SUBSCRIPTIONS;
//# sourceMappingURL=protocols.js.map

    /***/ }),
  /* 3 */
  /***/ (function(module, exports) {


    /**
     * Expose `Backoff`.
     */

    module.exports = Backoff;

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }

    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

    Backoff.prototype.duration = function(){
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
        var rand =  Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
    };

    /**
     * Reset the number of attempts.
     *
     * @api public
     */

    Backoff.prototype.reset = function(){
      this.attempts = 0;
    };

    /**
     * Set the minimum duration
     *
     * @api public
     */

    Backoff.prototype.setMin = function(min){
      this.ms = min;
    };

    /**
     * Set the maximum duration
     *
     * @api public
     */

    Backoff.prototype.setMax = function(max){
      this.max = max;
    };

    /**
     * Set the jitter
     *
     * @api public
     */

    Backoff.prototype.setJitter = function(jitter){
      this.jitter = jitter;
    };



    /***/ }),
  /* 4 */
  /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    var has = Object.prototype.hasOwnProperty
      , prefix = '~';

    /**
     * Constructor to create a storage for our `EE` objects.
     * An `Events` instance is a plain object whose properties are event names.
     *
     * @constructor
     * @api private
     */
    function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
    if (Object.create) {
      Events.prototype = Object.create(null);

      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) prefix = false;
    }

    /**
     * Representation of a single event listener.
     *
     * @param {Function} fn The listener function.
     * @param {Mixed} context The context to invoke the listener with.
     * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
     * @constructor
     * @api private
     */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @api public
     */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }

    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @api public
     */
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;

      if (this._eventsCount === 0) return names;

      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }

      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }

      return names;
    };

    /**
     * Return the listeners registered for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Boolean} exists Only check if there are listeners.
     * @returns {Array|Boolean}
     * @api public
     */
    EventEmitter.prototype.listeners = function listeners(event, exists) {
      var evt = prefix ? prefix + event : event
        , available = this._events[evt];

      if (exists) return !!available;
      if (!available) return [];
      if (available.fn) return [available.fn];

      for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
        ee[i] = available[i].fn;
      }

      return ee;
    };

    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @api public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return false;

      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;

      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments[j];
              }

              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
     * Add a listener for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn The listener function.
     * @param {Mixed} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
      var listener = new EE(fn, context || this)
        , evt = prefix ? prefix + event : event;

      if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
      else if (!this._events[evt].fn) this._events[evt].push(listener);
      else this._events[evt] = [this._events[evt], listener];

      return this;
    };

    /**
     * Add a one-time listener for a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn The listener function.
     * @param {Mixed} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.once = function once(event, fn, context) {
      var listener = new EE(fn, context || this, true)
        , evt = prefix ? prefix + event : event;

      if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
      else if (!this._events[evt].fn) this._events[evt].push(listener);
      else this._events[evt] = [this._events[evt], listener];

      return this;
    };

    /**
     * Remove the listeners of a given event.
     *
     * @param {String|Symbol} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {Mixed} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return this;
      if (!fn) {
        if (--this._eventsCount === 0) this._events = new Events();
        else delete this._events[evt];
        return this;
      }

      var listeners = this._events[evt];

      if (listeners.fn) {
        if (
          listeners.fn === fn
          && (!once || listeners.once)
          && (!context || listeners.context === context)
        ) {
          if (--this._eventsCount === 0) this._events = new Events();
          else delete this._events[evt];
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
            listeners[i].fn !== fn
            || (once && !listeners[i].once)
            || (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else if (--this._eventsCount === 0) this._events = new Events();
        else delete this._events[evt];
      }

      return this;
    };

    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {String|Symbol} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @api public
     */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;

      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) {
          if (--this._eventsCount === 0) this._events = new Events();
          else delete this._events[evt];
        }
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }

      return this;
    };

//
// Alias methods names because people roll like that.
//
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
    EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
      return this;
    };

//
// Expose the prefix.
//
    EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
    EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
    if (true) {
      module.exports = EventEmitter;
    }


    /***/ }),
  /* 5 */
  /***/ (function(module, exports) {

    /**
     * lodash 3.0.2 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    module.exports = isObject;


    /***/ }),
  /* 6 */
  /***/ (function(module, exports) {

    /**
     * lodash 4.0.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */

    /** `Object#toString` result references. */
    var stringTag = '[object String]';

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' ||
        (!isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag);
    }

    module.exports = isString;


    /***/ }),
  /* 7 */
  /***/ (function(module, exports) {

    var g;

// This works in non-strict mode
    g = (function() {
      return this;
    })();

    try {
      // This works if eval is allowed (see CSP)
      g = g || Function("return this")() || (1,eval)("this");
    } catch(e) {
      // This works if the window reference is available
      if(typeof window === "object")
        g = window;
    }

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

    module.exports = g;


    /***/ }),
  /* 8 */
  /***/ (function(module, exports) {

    module.exports =
      /******/ (function(modules) { // webpackBootstrap
      /******/ 	// The module cache
      /******/ 	var installedModules = {};

      /******/ 	// The require function
      /******/ 	function __webpack_require__(moduleId) {

        /******/ 		// Check if module is in cache
        /******/ 		if(installedModules[moduleId])
        /******/ 			return installedModules[moduleId].exports;

        /******/ 		// Create a new module (and put it into the cache)
        /******/ 		var module = installedModules[moduleId] = {
          /******/ 			exports: {},
          /******/ 			id: moduleId,
          /******/ 			loaded: false
          /******/ 		};

        /******/ 		// Execute the module function
        /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

        /******/ 		// Flag the module as loaded
        /******/ 		module.loaded = true;

        /******/ 		// Return the exports of the module
        /******/ 		return module.exports;
        /******/ 	}


      /******/ 	// expose the modules object (__webpack_modules__)
      /******/ 	__webpack_require__.m = modules;

      /******/ 	// expose the module cache
      /******/ 	__webpack_require__.c = installedModules;

      /******/ 	// __webpack_public_path__
      /******/ 	__webpack_require__.p = "";

      /******/ 	// Load entry module and return exports
      /******/ 	return __webpack_require__(0);
      /******/ })
    /************************************************************************/
    /******/ ([
      /* 0 */
      /***/ function(module, exports, __webpack_require__) {

        module.exports = __webpack_require__(1);


        /***/ },
      /* 1 */
      /***/ function(module, exports, __webpack_require__) {

        'use strict';

        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        exports.print = print;

        var _visitor = __webpack_require__(2);

        /**
         * Converts an AST into a string, using one set of reasonable
         * formatting rules.
         */
        function print(ast) {
          return (0, _visitor.visit)(ast, { leave: printDocASTReducer });
        } /**
         *  Copyright (c) 2015, Facebook, Inc.
         *  All rights reserved.
         *
         *  This source code is licensed under the BSD-style license found in the
         *  LICENSE file in the root directory of this source tree. An additional grant
         *  of patent rights can be found in the PATENTS file in the same directory.
         */

        var printDocASTReducer = {
            Name: function Name(node) {
              return node.value;
            },
            Variable: function Variable(node) {
              return '$' + node.name;
            },

            // Document

            Document: function Document(node) {
              return join(node.definitions, '\n\n') + '\n';
            },

            OperationDefinition: function OperationDefinition(node) {
              var op = node.operation;
              var name = node.name;
              var varDefs = wrap('(', join(node.variableDefinitions, ', '), ')');
              var directives = join(node.directives, ' ');
              var selectionSet = node.selectionSet;
              // Anonymous queries with no directives or variable definitions can use
              // the query short form.
              return !name && !directives && !varDefs && op === 'query' ? selectionSet : join([op, join([name, varDefs]), directives, selectionSet], ' ');
            },


            VariableDefinition: function VariableDefinition(_ref) {
              var variable = _ref.variable;
              var type = _ref.type;
              var defaultValue = _ref.defaultValue;
              return variable + ': ' + type + wrap(' = ', defaultValue);
            },

            SelectionSet: function SelectionSet(_ref2) {
              var selections = _ref2.selections;
              return block(selections);
            },

            Field: function Field(_ref3) {
              var alias = _ref3.alias;
              var name = _ref3.name;
              var args = _ref3.arguments;
              var directives = _ref3.directives;
              var selectionSet = _ref3.selectionSet;
              return join([wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'), join(directives, ' '), selectionSet], ' ');
            },

            Argument: function Argument(_ref4) {
              var name = _ref4.name;
              var value = _ref4.value;
              return name + ': ' + value;
            },

            // Fragments

            FragmentSpread: function FragmentSpread(_ref5) {
              var name = _ref5.name;
              var directives = _ref5.directives;
              return '...' + name + wrap(' ', join(directives, ' '));
            },

            InlineFragment: function InlineFragment(_ref6) {
              var typeCondition = _ref6.typeCondition;
              var directives = _ref6.directives;
              var selectionSet = _ref6.selectionSet;
              return join(['...', wrap('on ', typeCondition), join(directives, ' '), selectionSet], ' ');
            },

            FragmentDefinition: function FragmentDefinition(_ref7) {
              var name = _ref7.name;
              var typeCondition = _ref7.typeCondition;
              var directives = _ref7.directives;
              var selectionSet = _ref7.selectionSet;
              return 'fragment ' + name + ' on ' + typeCondition + ' ' + wrap('', join(directives, ' '), ' ') + selectionSet;
            },

            // Value

            IntValue: function IntValue(_ref8) {
              var value = _ref8.value;
              return value;
            },
            FloatValue: function FloatValue(_ref9) {
              var value = _ref9.value;
              return value;
            },
            StringValue: function StringValue(_ref10) {
              var value = _ref10.value;
              return JSON.stringify(value);
            },
            BooleanValue: function BooleanValue(_ref11) {
              var value = _ref11.value;
              return JSON.stringify(value);
            },
            EnumValue: function EnumValue(_ref12) {
              var value = _ref12.value;
              return value;
            },
            ListValue: function ListValue(_ref13) {
              var values = _ref13.values;
              return '[' + join(values, ', ') + ']';
            },
            ObjectValue: function ObjectValue(_ref14) {
              var fields = _ref14.fields;
              return '{' + join(fields, ', ') + '}';
            },
            ObjectField: function ObjectField(_ref15) {
              var name = _ref15.name;
              var value = _ref15.value;
              return name + ': ' + value;
            },

            // Directive

            Directive: function Directive(_ref16) {
              var name = _ref16.name;
              var args = _ref16.arguments;
              return '@' + name + wrap('(', join(args, ', '), ')');
            },

            // Type

            NamedType: function NamedType(_ref17) {
              var name = _ref17.name;
              return name;
            },
            ListType: function ListType(_ref18) {
              var type = _ref18.type;
              return '[' + type + ']';
            },
            NonNullType: function NonNullType(_ref19) {
              var type = _ref19.type;
              return type + '!';
            },

            // Type System Definitions

            SchemaDefinition: function SchemaDefinition(_ref20) {
              var directives = _ref20.directives;
              var operationTypes = _ref20.operationTypes;
              return join(['schema', join(directives, ' '), block(operationTypes)], ' ');
            },

            OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
              var operation = _ref21.operation;
              var type = _ref21.type;
              return operation + ': ' + type;
            },

            ScalarTypeDefinition: function ScalarTypeDefinition(_ref22) {
              var name = _ref22.name;
              var directives = _ref22.directives;
              return join(['scalar', name, join(directives, ' ')], ' ');
            },

            ObjectTypeDefinition: function ObjectTypeDefinition(_ref23) {
              var name = _ref23.name;
              var interfaces = _ref23.interfaces;
              var directives = _ref23.directives;
              var fields = _ref23.fields;
              return join(['type', name, wrap('implements ', join(interfaces, ', ')), join(directives, ' '), block(fields)], ' ');
            },

            FieldDefinition: function FieldDefinition(_ref24) {
              var name = _ref24.name;
              var args = _ref24.arguments;
              var type = _ref24.type;
              var directives = _ref24.directives;
              return name + wrap('(', join(args, ', '), ')') + ': ' + type + wrap(' ', join(directives, ' '));
            },

            InputValueDefinition: function InputValueDefinition(_ref25) {
              var name = _ref25.name;
              var type = _ref25.type;
              var defaultValue = _ref25.defaultValue;
              var directives = _ref25.directives;
              return join([name + ': ' + type, wrap('= ', defaultValue), join(directives, ' ')], ' ');
            },

            InterfaceTypeDefinition: function InterfaceTypeDefinition(_ref26) {
              var name = _ref26.name;
              var directives = _ref26.directives;
              var fields = _ref26.fields;
              return join(['interface', name, join(directives, ' '), block(fields)], ' ');
            },

            UnionTypeDefinition: function UnionTypeDefinition(_ref27) {
              var name = _ref27.name;
              var directives = _ref27.directives;
              var types = _ref27.types;
              return join(['union', name, join(directives, ' '), '= ' + join(types, ' | ')], ' ');
            },

            EnumTypeDefinition: function EnumTypeDefinition(_ref28) {
              var name = _ref28.name;
              var directives = _ref28.directives;
              var values = _ref28.values;
              return join(['enum', name, join(directives, ' '), block(values)], ' ');
            },

            EnumValueDefinition: function EnumValueDefinition(_ref29) {
              var name = _ref29.name;
              var directives = _ref29.directives;
              return join([name, join(directives, ' ')], ' ');
            },

            InputObjectTypeDefinition: function InputObjectTypeDefinition(_ref30) {
              var name = _ref30.name;
              var directives = _ref30.directives;
              var fields = _ref30.fields;
              return join(['input', name, join(directives, ' '), block(fields)], ' ');
            },

            TypeExtensionDefinition: function TypeExtensionDefinition(_ref31) {
              var definition = _ref31.definition;
              return 'extend ' + definition;
            },

            DirectiveDefinition: function DirectiveDefinition(_ref32) {
              var name = _ref32.name;
              var args = _ref32.arguments;
              var locations = _ref32.locations;
              return 'directive @' + name + wrap('(', join(args, ', '), ')') + ' on ' + join(locations, ' | ');
            }
          };

        /**
         * Given maybeArray, print an empty string if it is null or empty, otherwise
         * print all items together separated by separator if provided
         */
        function join(maybeArray, separator) {
          return maybeArray ? maybeArray.filter(function (x) {
              return x;
            }).join(separator || '') : '';
        }

        /**
         * Given array, print each item on its own line, wrapped in an
         * indented "{ }" block.
         */
        function block(array) {
          return array && array.length !== 0 ? indent('{\n' + join(array, '\n')) + '\n}' : '{}';
        }

        /**
         * If maybeString is not null or empty, then wrap with start and end, otherwise
         * print an empty string.
         */
        function wrap(start, maybeString, end) {
          return maybeString ? start + maybeString + (end || '') : '';
        }

        function indent(maybeString) {
          return maybeString && maybeString.replace(/\n/g, '\n  ');
        }

        /***/ },
      /* 2 */
      /***/ function(module, exports) {

        'use strict';

        Object.defineProperty(exports, "__esModule", {
          value: true
        });
        exports.visit = visit;
        exports.visitInParallel = visitInParallel;
        exports.visitWithTypeInfo = visitWithTypeInfo;
        /**
         *  Copyright (c) 2015, Facebook, Inc.
         *  All rights reserved.
         *
         *  This source code is licensed under the BSD-style license found in the
         *  LICENSE file in the root directory of this source tree. An additional grant
         *  of patent rights can be found in the PATENTS file in the same directory.
         */

        var QueryDocumentKeys = exports.QueryDocumentKeys = {
          Name: [],

          Document: ['definitions'],
          OperationDefinition: ['name', 'variableDefinitions', 'directives', 'selectionSet'],
          VariableDefinition: ['variable', 'type', 'defaultValue'],
          Variable: ['name'],
          SelectionSet: ['selections'],
          Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
          Argument: ['name', 'value'],

          FragmentSpread: ['name', 'directives'],
          InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
          FragmentDefinition: ['name', 'typeCondition', 'directives', 'selectionSet'],

          IntValue: [],
          FloatValue: [],
          StringValue: [],
          BooleanValue: [],
          EnumValue: [],
          ListValue: ['values'],
          ObjectValue: ['fields'],
          ObjectField: ['name', 'value'],

          Directive: ['name', 'arguments'],

          NamedType: ['name'],
          ListType: ['type'],
          NonNullType: ['type'],

          SchemaDefinition: ['directives', 'operationTypes'],
          OperationTypeDefinition: ['type'],

          ScalarTypeDefinition: ['name', 'directives'],
          ObjectTypeDefinition: ['name', 'interfaces', 'directives', 'fields'],
          FieldDefinition: ['name', 'arguments', 'type', 'directives'],
          InputValueDefinition: ['name', 'type', 'defaultValue', 'directives'],
          InterfaceTypeDefinition: ['name', 'directives', 'fields'],
          UnionTypeDefinition: ['name', 'directives', 'types'],
          EnumTypeDefinition: ['name', 'directives', 'values'],
          EnumValueDefinition: ['name', 'directives'],
          InputObjectTypeDefinition: ['name', 'directives', 'fields'],

          TypeExtensionDefinition: ['definition'],

          DirectiveDefinition: ['name', 'arguments', 'locations']
        };

        var BREAK = exports.BREAK = {};

        /**
         * visit() will walk through an AST using a depth first traversal, calling
         * the visitor's enter function at each node in the traversal, and calling the
         * leave function after visiting that node and all of its child nodes.
         *
         * By returning different values from the enter and leave functions, the
         * behavior of the visitor can be altered, including skipping over a sub-tree of
         * the AST (by returning false), editing the AST by returning a value or null
         * to remove the value, or to stop the whole traversal by returning BREAK.
         *
         * When using visit() to edit an AST, the original AST will not be modified, and
         * a new version of the AST with the changes applied will be returned from the
         * visit function.
         *
         *     const editedAST = visit(ast, {
	 *       enter(node, key, parent, path, ancestors) {
	 *         // @return
	 *         //   undefined: no action
	 *         //   false: skip visiting this node
	 *         //   visitor.BREAK: stop visiting altogether
	 *         //   null: delete this node
	 *         //   any value: replace this node with the returned value
	 *       },
	 *       leave(node, key, parent, path, ancestors) {
	 *         // @return
	 *         //   undefined: no action
	 *         //   false: no action
	 *         //   visitor.BREAK: stop visiting altogether
	 *         //   null: delete this node
	 *         //   any value: replace this node with the returned value
	 *       }
	 *     });
         *
         * Alternatively to providing enter() and leave() functions, a visitor can
         * instead provide functions named the same as the kinds of AST nodes, or
         * enter/leave visitors at a named key, leading to four permutations of
         * visitor API:
         *
         * 1) Named visitors triggered when entering a node a specific kind.
         *
         *     visit(ast, {
	 *       Kind(node) {
	 *         // enter the "Kind" node
	 *       }
	 *     })
         *
         * 2) Named visitors that trigger upon entering and leaving a node of
         *    a specific kind.
         *
         *     visit(ast, {
	 *       Kind: {
	 *         enter(node) {
	 *           // enter the "Kind" node
	 *         }
	 *         leave(node) {
	 *           // leave the "Kind" node
	 *         }
	 *       }
	 *     })
         *
         * 3) Generic visitors that trigger upon entering and leaving any node.
         *
         *     visit(ast, {
	 *       enter(node) {
	 *         // enter any node
	 *       },
	 *       leave(node) {
	 *         // leave any node
	 *       }
	 *     })
         *
         * 4) Parallel visitors for entering and leaving nodes of a specific kind.
         *
         *     visit(ast, {
	 *       enter: {
	 *         Kind(node) {
	 *           // enter the "Kind" node
	 *         }
	 *       },
	 *       leave: {
	 *         Kind(node) {
	 *           // leave the "Kind" node
	 *         }
	 *       }
	 *     })
         */
        function visit(root, visitor, keyMap) {
          var visitorKeys = keyMap || QueryDocumentKeys;

          var stack = void 0;
          var inArray = Array.isArray(root);
          var keys = [root];
          var index = -1;
          var edits = [];
          var parent = void 0;
          var path = [];
          var ancestors = [];
          var newRoot = root;

          do {
            index++;
            var isLeaving = index === keys.length;
            var key = void 0;
            var node = void 0;
            var isEdited = isLeaving && edits.length !== 0;
            if (isLeaving) {
              key = ancestors.length === 0 ? undefined : path.pop();
              node = parent;
              parent = ancestors.pop();
              if (isEdited) {
                if (inArray) {
                  node = node.slice();
                } else {
                  var clone = {};
                  for (var k in node) {
                    if (node.hasOwnProperty(k)) {
                      clone[k] = node[k];
                    }
                  }
                  node = clone;
                }
                var editOffset = 0;
                for (var ii = 0; ii < edits.length; ii++) {
                  var editKey = edits[ii][0];
                  var editValue = edits[ii][1];
                  if (inArray) {
                    editKey -= editOffset;
                  }
                  if (inArray && editValue === null) {
                    node.splice(editKey, 1);
                    editOffset++;
                  } else {
                    node[editKey] = editValue;
                  }
                }
              }
              index = stack.index;
              keys = stack.keys;
              edits = stack.edits;
              inArray = stack.inArray;
              stack = stack.prev;
            } else {
              key = parent ? inArray ? index : keys[index] : undefined;
              node = parent ? parent[key] : newRoot;
              if (node === null || node === undefined) {
                continue;
              }
              if (parent) {
                path.push(key);
              }
            }

            var result = void 0;
            if (!Array.isArray(node)) {
              if (!isNode(node)) {
                throw new Error('Invalid AST Node: ' + JSON.stringify(node));
              }
              var visitFn = getVisitFn(visitor, node.kind, isLeaving);
              if (visitFn) {
                result = visitFn.call(visitor, node, key, parent, path, ancestors);

                if (result === BREAK) {
                  break;
                }

                if (result === false) {
                  if (!isLeaving) {
                    path.pop();
                    continue;
                  }
                } else if (result !== undefined) {
                  edits.push([key, result]);
                  if (!isLeaving) {
                    if (isNode(result)) {
                      node = result;
                    } else {
                      path.pop();
                      continue;
                    }
                  }
                }
              }
            }

            if (result === undefined && isEdited) {
              edits.push([key, node]);
            }

            if (!isLeaving) {
              stack = { inArray: inArray, index: index, keys: keys, edits: edits, prev: stack };
              inArray = Array.isArray(node);
              keys = inArray ? node : visitorKeys[node.kind] || [];
              index = -1;
              edits = [];
              if (parent) {
                ancestors.push(parent);
              }
              parent = node;
            }
          } while (stack !== undefined);

          if (edits.length !== 0) {
            newRoot = edits[edits.length - 1][1];
          }

          return newRoot;
        }

        function isNode(maybeNode) {
          return maybeNode && typeof maybeNode.kind === 'string';
        }

        /**
         * Creates a new visitor instance which delegates to many visitors to run in
         * parallel. Each visitor will be visited for each node before moving on.
         *
         * If a prior visitor edits a node, no following visitors will see that node.
         */
        function visitInParallel(visitors) {
          var skipping = new Array(visitors.length);

          return {
            enter: function enter(node) {
              for (var i = 0; i < visitors.length; i++) {
                if (!skipping[i]) {
                  var fn = getVisitFn(visitors[i], node.kind, /* isLeaving */false);
                  if (fn) {
                    var result = fn.apply(visitors[i], arguments);
                    if (result === false) {
                      skipping[i] = node;
                    } else if (result === BREAK) {
                      skipping[i] = BREAK;
                    } else if (result !== undefined) {
                      return result;
                    }
                  }
                }
              }
            },
            leave: function leave(node) {
              for (var i = 0; i < visitors.length; i++) {
                if (!skipping[i]) {
                  var fn = getVisitFn(visitors[i], node.kind, /* isLeaving */true);
                  if (fn) {
                    var result = fn.apply(visitors[i], arguments);
                    if (result === BREAK) {
                      skipping[i] = BREAK;
                    } else if (result !== undefined && result !== false) {
                      return result;
                    }
                  }
                } else if (skipping[i] === node) {
                  skipping[i] = null;
                }
              }
            }
          };
        }

        /**
         * Creates a new visitor instance which maintains a provided TypeInfo instance
         * along with visiting visitor.
         */
        function visitWithTypeInfo(typeInfo, visitor) {
          return {
            enter: function enter(node) {
              typeInfo.enter(node);
              var fn = getVisitFn(visitor, node.kind, /* isLeaving */false);
              if (fn) {
                var result = fn.apply(visitor, arguments);
                if (result !== undefined) {
                  typeInfo.leave(node);
                  if (isNode(result)) {
                    typeInfo.enter(result);
                  }
                }
                return result;
              }
            },
            leave: function leave(node) {
              var fn = getVisitFn(visitor, node.kind, /* isLeaving */true);
              var result = void 0;
              if (fn) {
                result = fn.apply(visitor, arguments);
              }
              typeInfo.leave(node);
              return result;
            }
          };
        }

        /**
         * Given a visitor instance, if it is leaving or not, and a node kind, return
         * the function the visitor runtime should call.
         */
        function getVisitFn(visitor, kind, isLeaving) {
          var kindVisitor = visitor[kind];
          if (kindVisitor) {
            if (!isLeaving && typeof kindVisitor === 'function') {
              // { Kind() {} }
              return kindVisitor;
            }
            var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;
            if (typeof kindSpecificVisitor === 'function') {
              // { Kind: { enter() {}, leave() {} } }
              return kindSpecificVisitor;
            }
          } else {
            var specificVisitor = isLeaving ? visitor.leave : visitor.enter;
            if (specificVisitor) {
              if (typeof specificVisitor === 'function') {
                // { enter() {}, leave() {} }
                return specificVisitor;
              }
              var specificKindVisitor = specificVisitor[kind];
              if (typeof specificKindVisitor === 'function') {
                // { enter: { Kind() {} }, leave: { Kind() {} } }
                return specificKindVisitor;
              }
            }
          }
        }

        /***/ }
      /******/ ]);

    /***/ }),
  /* 9 */
  /***/ (function(module, exports, __webpack_require__) {

    "use strict";
    /* WEBPACK VAR INJECTION */(function(global) {
      function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
      }
      var Backoff = __webpack_require__(3);
      var eventemitter3_1 = __webpack_require__(4);
      var _global = typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {});
      var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;
      var messageTypes_1 = __webpack_require__(1);
      var protocols_1 = __webpack_require__(2);
      var isString = __webpack_require__(6);
      var isObject = __webpack_require__(5);
      __export(__webpack_require__(0));
      var DEFAULT_SUBSCRIPTION_TIMEOUT = 5000;
      var SubscriptionClient = (function () {
        function SubscriptionClient(url, options, webSocketImpl) {
          var _a = (options || {}), _b = _a.connectionCallback, connectionCallback = _b === void 0 ? undefined : _b, _c = _a.connectionParams, connectionParams = _c === void 0 ? {} : _c, _d = _a.timeout, timeout = _d === void 0 ? DEFAULT_SUBSCRIPTION_TIMEOUT : _d, _e = _a.reconnect, reconnect = _e === void 0 ? false : _e, _f = _a.reconnectionAttempts, reconnectionAttempts = _f === void 0 ? Infinity : _f;
          this.wsImpl = webSocketImpl || NativeWebSocket;
          if (!this.wsImpl) {
            throw new Error('Unable to find native implementation, or alternative implementation for WebSocket!');
          }
          this.connectionParams = connectionParams;
          this.connectionCallback = connectionCallback;
          this.url = url;
          this.subscriptions = {};
          this.maxId = 0;
          this.subscriptionTimeout = timeout;
          this.waitingSubscriptions = {};
          this.unsentMessagesQueue = [];
          this.reconnect = reconnect;
          this.reconnectSubscriptions = {};
          this.reconnecting = false;
          this.reconnectionAttempts = reconnectionAttempts;
          this.backoff = new Backoff({ jitter: 0.5 });
          this.eventEmitter = new eventemitter3_1.EventEmitter();
          this.connect();
        }
        Object.defineProperty(SubscriptionClient.prototype, "status", {
          get: function () {
            return this.client.readyState;
          },
          enumerable: true,
          configurable: true
        });
        SubscriptionClient.prototype.close = function () {
          this.client.close();
        };
        SubscriptionClient.prototype.subscribe = function (options, handler) {
          var _this = this;
          var query = options.query, variables = options.variables, operationName = options.operationName, context = options.context;
          if (!query) {
            throw new Error('Must provide `query` to subscribe.');
          }
          if (!handler) {
            throw new Error('Must provide `handler` to subscribe.');
          }
          if (!isString(query) ||
            (operationName && !isString(operationName)) ||
            (variables && !isObject(variables))) {
            throw new Error('Incorrect option types to subscribe. `subscription` must be a string,' +
              '`operationName` must be a string, and `variables` must be an object.');
          }
          var subId = this.generateSubscriptionId();
          var message = Object.assign(options, { type: messageTypes_1.SUBSCRIPTION_START, id: subId });
          this.sendMessage(message);
          this.subscriptions[subId] = { options: options, handler: handler };
          this.waitingSubscriptions[subId] = true;
          setTimeout(function () {
            if (_this.waitingSubscriptions[subId]) {
              handler([new Error('Subscription timed out - no response from server')]);
              _this.unsubscribe(subId);
            }
          }, this.subscriptionTimeout);
          return subId;
        };
        SubscriptionClient.prototype.on = function (eventName, callback, context) {
          var handler = this.eventEmitter.on(eventName, callback, context);
          return function () {
            handler.off(eventName, callback, context);
          };
        };
        SubscriptionClient.prototype.onConnect = function (callback, context) {
          return this.on('connect', callback, context);
        };
        SubscriptionClient.prototype.onDisconnect = function (callback, context) {
          return this.on('disconnect', callback, context);
        };
        SubscriptionClient.prototype.onReconnect = function (callback, context) {
          return this.on('reconnect', callback, context);
        };
        SubscriptionClient.prototype.unsubscribe = function (id) {
          delete this.subscriptions[id];
          delete this.waitingSubscriptions[id];
          var message = { id: id, type: messageTypes_1.SUBSCRIPTION_END };
          this.sendMessage(message);
        };
        SubscriptionClient.prototype.unsubscribeAll = function () {
          var _this = this;
          Object.keys(this.subscriptions).forEach(function (subId) {
            _this.unsubscribe(parseInt(subId));
          });
        };
        SubscriptionClient.prototype.sendMessage = function (message) {
          switch (this.client.readyState) {
            case this.client.OPEN:
              this.client.send(JSON.stringify(message));
              break;
            case this.client.CONNECTING:
              this.unsentMessagesQueue.push(message);
              break;
            case this.client.CLOSING:
            case this.client.CLOSED:
            default:
              if (!this.reconnecting) {
                throw new Error('Client is not connected to a websocket.');
              }
          }
        };
        SubscriptionClient.prototype.generateSubscriptionId = function () {
          var id = this.maxId;
          this.maxId += 1;
          return id;
        };
        SubscriptionClient.prototype.formatErrors = function (errors) {
          if (Array.isArray(errors)) {
            return errors;
          }
          if (errors && errors.message) {
            return [errors];
          }
          return [{ message: 'Unknown error' }];
        };
        SubscriptionClient.prototype.tryReconnect = function () {
          var _this = this;
          if (!this.reconnect) {
            return;
          }
          if (this.backoff.attempts > this.reconnectionAttempts) {
            return;
          }
          if (!this.reconnecting) {
            this.reconnectSubscriptions = this.subscriptions;
            this.subscriptions = {};
            this.waitingSubscriptions = {};
            this.reconnecting = true;
          }
          var delay = this.backoff.duration();
          setTimeout(function () {
            _this.connect(true);
          }, delay);
        };
        SubscriptionClient.prototype.connect = function (isReconnect) {
          var _this = this;
          if (isReconnect === void 0) { isReconnect = false; }
          this.client = new this.wsImpl(this.url, protocols_1.GRAPHQL_SUBSCRIPTIONS);
          this.client.onopen = function () {
            _this.eventEmitter.emit(isReconnect ? 'reconnect' : 'connect');
            _this.reconnecting = false;
            _this.backoff.reset();
            Object.keys(_this.reconnectSubscriptions).forEach(function (key) {
              var _a = _this.reconnectSubscriptions[key], options = _a.options, handler = _a.handler;
              _this.subscribe(options, handler);
            });
            _this.unsentMessagesQueue.forEach(function (message) {
              _this.client.send(JSON.stringify(message));
            });
            _this.unsentMessagesQueue = [];
            _this.sendMessage({ type: messageTypes_1.INIT, payload: _this.connectionParams });
          };
          this.client.onclose = function () {
            _this.eventEmitter.emit('disconnect');
            _this.tryReconnect();
          };
          this.client.onerror = function () {
          };
          this.client.onmessage = function (_a) {
            var data = _a.data;
            var parsedMessage;
            try {
              parsedMessage = JSON.parse(data);
            }
            catch (e) {
              throw new Error("Message must be JSON-parseable. Got: " + data);
            }
            var subId = parsedMessage.id;
            if ([messageTypes_1.KEEPALIVE, messageTypes_1.INIT_SUCCESS, messageTypes_1.INIT_FAIL].indexOf(parsedMessage.type) === -1 && !_this.subscriptions[subId]) {
              _this.unsubscribe(subId);
              return;
            }
            switch (parsedMessage.type) {
              case messageTypes_1.INIT_FAIL:
                if (_this.connectionCallback) {
                  _this.connectionCallback(parsedMessage.payload.error);
                }
                break;
              case messageTypes_1.INIT_SUCCESS:
                if (_this.connectionCallback) {
                  _this.connectionCallback();
                }
                break;
              case messageTypes_1.SUBSCRIPTION_SUCCESS:
                delete _this.waitingSubscriptions[subId];
                break;
              case messageTypes_1.SUBSCRIPTION_FAIL:
                _this.subscriptions[subId].handler(_this.formatErrors(parsedMessage.payload.errors), null);
                delete _this.subscriptions[subId];
                delete _this.waitingSubscriptions[subId];
                break;
              case messageTypes_1.SUBSCRIPTION_DATA:
                if (parsedMessage.payload.data && !parsedMessage.payload.errors) {
                  _this.subscriptions[subId].handler(null, parsedMessage.payload.data);
                }
                else {
                  _this.subscriptions[subId].handler(_this.formatErrors(parsedMessage.payload.errors), null);
                }
                break;
              case messageTypes_1.KEEPALIVE:
                break;
              default:
                throw new Error('Invalid message type!');
            }
          };
        };
        return SubscriptionClient;
      }());
      exports.SubscriptionClient = SubscriptionClient;
//# sourceMappingURL=client.js.map
      /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

    /***/ })
  /******/ ]);