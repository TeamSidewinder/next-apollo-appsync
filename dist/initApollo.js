"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

exports.default = initApollo;

var _awsAppsync = require("aws-appsync");

var _nodeFetch = require("node-fetch");

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var apolloClient = null;

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = _nodeFetch2.default;
}

function create(initialState, appsyncConfig, options) {
  var client = new _awsAppsync.AWSAppSyncClient((0, _extends3.default)({}, appsyncConfig, {
    disableOffline: true
  }), options || {
    ssrMode: true
  });

  if (initialState) {
    client.cache.restore(initialState);
  }

  return client;
}

function initApollo(initialState, appsyncConfig) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(initialState, appsyncConfig);
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState, appsyncConfig);
  }

  return apolloClient;
}