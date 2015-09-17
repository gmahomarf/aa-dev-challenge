"use strict";

var request = require("request");
var UUID = require("uuid");
var Promise = require("Bluebird");
Promise.promisifyAll(request);
var exit = require("exit"); //stupid windows not flushing buffers...

var util = require("util");

var utils = require("./utils");

var startTime = new Date();
var myExit = function(n) {
    console.log("Took %sms", new Date() - startTime);
    exit(n);
};

var baseUrl = "http://internal-devchallenge-2-dev.apphb.com";

var usage =
    "node index <-v|-p> [-c count] \n\
    -v          Verify Only \n\
    -p          Post results \n\
    -c COUNT    Number of codes to generate (default:20)\n\
    -h          You're lookin' at it\n";

var argv = require("minimist")(process.argv.slice(2));

if (!argv.hack && argv.v && argv.p) {
    console.error("ERROR: Can't verify and post. Choose one\n");
    console.error(usage);
    myExit(1);
} else if (!argv.hack && !argv.v && !argv.p) {
    console.error("ERROR: Must verify or post. Choose one\n");
    console.error(usage);
    myExit(1);
} else if (argv.h) {
    console.log(usage);
    myExit();
}

var limit = argv.c || 20;

var verifyOnly = argv.v;

var algorithmTimes = [];

var createCode = function(value) {
    var start = new Date();

    var concatenatedString = utils.algorithms[value.algorithm](value);

    value.base64Encoded = utils.toBase64(concatenatedString);

    algorithmTimes.push({
        algorithm: value.algorithm,
        time: new Date() - start
    });

    return Promise.resolve(value);
};

var getValueAsync = function(uuid) {
    return request.getAsync({
        url: baseUrl + "/values/" + uuid,
        headers: {
            Accept: "application/json"
        },
        json: true
    }).spread(function(response, body) {
        if (response.statusCode === 200) {
            body.uuid = uuid;
            return Promise.resolve(body);
        } else {
            throw {
                response: response,
                body: body
            };
        }
    });
};

var verifyResults = function(value) {
    return request.getAsync({
            url: baseUrl + "/encoded/" + value.uuid + "/" + value.algorithm,
            headers: {
                Accept: "application/json"
            },
            json: true
        })
        .spread(function(response, body) {
            if (response.statusCode === 200) {
                if (value.base64Encoded === body.encoded) {
                    return Promise.resolve({
                        success: true
                    });
                } else {
                    return Promise.resolve({
                        success: false,
                        calculatedCode: value.base64Encoded,
                        correctCode: body.encoded
                    });
                }
            } else {
                throw {
                    response: response,
                    body: body
                };
            }
        });
};

var postResults = function(value) {
    var postData = utils.postTemplate(value.base64Encoded);
    return request.postAsync({
        uri: baseUrl + "/values/" + value.uuid + "/" + value.algorithm,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: postData,
        json: true
    }).spread(function(response, body) {
        if (response.statusCode === 200) {
            return Promise.resolve(body);
        } else {
            throw {
                response: response,
                body: body
            };
        }
    });
};

var verifyOrPostResult = function(value) {
    if (verifyOnly) {
        return verifyResults(value);
    } else {
        return postResults(value);
    }
};

var uuids = [];
for (var c = 0; c < limit; c++) {
    uuids.push(UUID.v4());
}

var go = function(uuid) {
    return getValueAsync(uuid)
        .then(createCode)
        .then(verifyOrPostResult)
        .catch(function errorHandler(err) {
            var response = err.response;
            if (response) {
                console.log("%s %s", response.request.method, response.request.uri.href);
                console.log("Status: %s", response.statusCode);
                console.log("Response: %s", err.body);
            } else {
                console.error("ERROR: %s", util.inspect(err));
            }
            myExit(1);
        });
};

Promise.map(uuids, go).then(function successHandler(results) {
    console.log("Results:");
    console.dir(results);
    console.log("Algorithm times:");
    console.dir(algorithmTimes);
    console.log("Total algorithm time: %dms", algorithmTimes.reduce(function(a, b) {
        return a + b.time;
    }, 0));
    myExit();
});
