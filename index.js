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
    console.log("Took %s ms", new Date() - startTime);
    exit(n);
};

//var baseUrl = "http://localhost:6656";
var baseUrl = "http://internal-devchallenge-2-dev.apphb.com";

var usage =
    "node index <-v|-p> [-c count] \n\
    -v          Verify results only \n\
    -p          Post results \n\
    -c COUNT    Number of codes to generate (default:20)\n\
    -h          You're lookin' at it\n";

var argv = require("minimist")(process.argv.slice(2));

if (argv.h) {
    console.log(usage);
    exit();
} else if (argv.v && argv.p) {
    console.error("ERROR: Can't verify and post. Choose one\n");
    console.error(usage);
    exit(1);
} else if (!argv.v && !argv.p) {
    console.error("ERROR: Must verify or post. Choose one\n");
    console.error(usage);
    exit(1);
}

var limit = argv.c || 20;

var verifyOnly = argv.v;

var algorithmTimes = [];

var createCode = function(value) {
    var start = process.hrtime();

    var concatenatedString = utils.algorithms[value.algorithm](value);

    value.base64Encoded = utils.toBase64(concatenatedString);

    var timeTaken = process.hrtime(start); //Result of this is an array of [seconds, nanoseconds] since the argument;

    algorithmTimes.push({
        algorithm: value.algorithm,
        time: timeTaken[0] * 1e9 + timeTaken[1] //Hence the multiplication of seconds by 1e9 to make it all nanoseconds
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
                        algorithm: value.algorithm,
                        words: value.words,
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

var getHumanReadableTime = function(time) {
    var totalNs;
    if (Array.isArray(time)) {
        totalNs = time.reduce(function(a, b) {
            return a + b.time;
        }, 0);
    } else {
        totalNs = time;
    }

    var getRoundedNumber = function(number, decimalPlaces) {
        var numberString = number.toString();
        return numberString.slice(0, numberString.indexOf(".") + decimalPlaces + 1);
    };

    //'s', 'ms', 'μs', 'ns'
    if (totalNs >= 1e9) {
        return getRoundedNumber(totalNs / 1e9, 3) + " s";
    } else if (totalNs >= 1e6) {
        return getRoundedNumber(totalNs / 1e6, 3) + " ms";
    } else if (totalNs >= 1e3) {
        return getRoundedNumber(totalNs / 1e3, 3) + " μs";
    } else {
        return getRoundedNumber(totalNs, 3) + " ns";
    }
};

Promise.map(uuids, go).then(function successHandler(results) {
    console.log("Results:");
    console.dir(results);
    console.log("Algorithm times (in ns):");
    console.dir(algorithmTimes.map(function(t) {
        var r = {
            algorithm: t.algorithm,
            time: getHumanReadableTime(t.time)
        };
        return r;
    }));
    console.log("Total algorithm time: %s", getHumanReadableTime(algorithmTimes));
    myExit();
});