/// <reference path="./server-gtm-sandboxed-apis.d.ts" />

const encodeUriComponent = require('encodeUriComponent');
const getContainerVersion = require('getContainerVersion');
const getRequestHeader = require('getRequestHeader');
const getAllEventData = require('getAllEventData');
const getType = require('getType');
const makeString = require('makeString');
const JSON = require('JSON');
const logToConsole = require('logToConsole');
const sendHttpRequest = require('sendHttpRequest');
const toBase64 = require('toBase64');

/*==============================================================================
==============================================================================*/

const eventData = getAllEventData();

if (!isConsentGivenOrNotRequired(data, eventData)) {
  return data.gtmOnSuccess();
}

const containerVersion = getContainerVersion();
const isDebug = containerVersion.debugMode;
const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');

const requestUrl =
  'https://api.twilio.com/2010-04-01/Accounts/' +
  encodeUriComponent(data.accountSID) +
  '/Messages.json';
const postBody = 'From=' + enc(data.from) + '&To=' + enc(data.to) + '&Body=' + enc(data.text);

if (isLoggingEnabled) {
  logToConsole(
    JSON.stringify({
      Name: 'Twilio',
      Type: 'Request',
      TraceId: traceId,
      EventName: 'SMS',
      RequestMethod: 'POST',
      RequestUrl: requestUrl,
      RequestBody: postBody
    })
  );
}

sendHttpRequest(
  requestUrl,
  (statusCode, headers, body) => {
    if (isLoggingEnabled) {
      logToConsole(
        JSON.stringify({
          Name: 'Twilio',
          Type: 'Response',
          TraceId: traceId,
          EventName: 'SMS',
          ResponseStatusCode: statusCode,
          ResponseHeaders: headers,
          ResponseBody: body
        })
      );
    }

    if (statusCode >= 200 && statusCode < 300) {
      data.gtmOnSuccess();
    } else {
      data.gtmOnFailure();
    }
  },
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + toBase64(data.accountSID + ':' + data.authToken)
    }
  },
  postBody
);

/*==============================================================================
  Helpers
==============================================================================*/

function enc(data) {
  if (['null', 'undefined'].indexOf(getType(data)) !== -1) data = '';
  return encodeUriComponent(makeString(data));
}

function isConsentGivenOrNotRequired(data, eventData) {
  if (data.adStorageConsent !== 'required') return true;
  if (eventData.consent_state) return !!eventData.consent_state.ad_storage;
  const xGaGcs = eventData['x-ga-gcs'] || ''; // x-ga-gcs is a string like "G110"
  return xGaGcs[2] === '1';
}

function determinateIsLoggingEnabled() {
  if (!data.logType) {
    return isDebug;
  }

  if (data.logType === 'no') {
    return false;
  }

  if (data.logType === 'debug') {
    return isDebug;
  }

  return data.logType === 'always';
}
