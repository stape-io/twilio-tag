const sendHttpRequest = require('sendHttpRequest');
const encodeUriComponent = require('encodeUriComponent');
const toBase64 = require('toBase64');
const JSON = require('JSON');
const getRequestHeader = require('getRequestHeader');
const logToConsole = require('logToConsole');
const getContainerVersion = require('getContainerVersion');
const containerVersion = getContainerVersion();
const isDebug = containerVersion.debugMode;
const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');

const requestUrl = 'https://api.twilio.com/2010-04-01/Accounts/'+encodeUriComponent(data.accountSID)+'/Messages.json';
const postBody = 'From='+enc(data.from)+'&To='+enc(data.to)+'&Body='+enc(data.text);

if (isLoggingEnabled) {
    logToConsole(JSON.stringify({
        'Name': 'Twilio',
        'Type': 'Request',
        'TraceId': traceId,
        'EventName': 'SMS',
        'RequestMethod': 'POST',
        'RequestUrl': requestUrl,
        'RequestBody': postBody,
    }));
}

sendHttpRequest(requestUrl, (statusCode, headers, body) => {
    if (isLoggingEnabled) {
        logToConsole(JSON.stringify({
            'Name': 'Twilio',
            'Type': 'Response',
            'TraceId': traceId,
            'EventName': 'SMS',
            'ResponseStatusCode': statusCode,
            'ResponseHeaders': headers,
            'ResponseBody': body,
        }));
    }

    if (statusCode >= 200 && statusCode < 300) {
        data.gtmOnSuccess();
    } else {
        data.gtmOnFailure();
    }
}, {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic '+toBase64(data.accountSID+':'+data.authToken)}}, postBody);


function enc(data) {
    data = data || '';
    return encodeUriComponent(data);
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
