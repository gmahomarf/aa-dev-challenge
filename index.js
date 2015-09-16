"use strict";

var request = require("request");
var UUID = require("uuid");
var Promise = require("Bluebird");
var exit = require("exit"); //stupid windows not fluching buffers...

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

if (argv.hack) {
    var uuids = [];
    var promises = [];
    for (var c = 0; c < limit; c++) {
        uuids.push(UUID.v4());
    }

    uuids.forEach(function(u) {
        promises.push(
            new Promise(function(resolve, reject) {
                request({
                    url: baseUrl + "/values/" + u,
                    headers: {
                        Accept: "application/json"
                    },
                    json: true
                }, function(err, response, body) {
                    if (err) {
                        console.log(err);
                        return reject(err);
                    }

                    if (response.statusCode !== 200) {
                        console.log("GET /values/%s got status code %s", u, response.statusCode);
                        return reject(body);
                    }

                    request({
                        url: baseUrl + "/encoded/" + u + "/" + body.algorithm,
                        headers: {
                            Accept: "application/json"
                        },
                        json: true
                    }, function(err, response, encodedResult) {
                        if (err) {
                            console.log(err);
                            return reject(err);
                        }

                        if (response.statusCode !== 200) {
                            console.log("GET /encoded/%s got status code %s", u, response.statusCode);
                            return reject(encodedResult);
                        }

                        resolve({
                            u: u,
                            encoded: encodedResult.encoded,
                            algorithm: body.algorithm
                        });
                    });
                });
            })
        );
    });

    Promise.all(promises).then(function(results) {
        console.log(JSON.stringify(results, null, 4));
        var morePromises = [];
        results.forEach(
            function(r) {
                morePromises.push(
                    new Promise(function(resolve, reject) {
                        var postData = utils.postTemplate(r.encoded);
                        request({
                            method: "POST",
                            uri: baseUrl + "/values/" + r.u + "/" + r.algorithm,
                            headers: {
                                Accept: "application/json",
                                "Content-Type": "application/json"
                            },
                            body: postData,
                            json: true
                        }, function(err, response, result) {
                            if (err) {
                                console.log(err);
                                return reject(err);
                            }

                            if (response.statusCode !== 200) {
                                console.log("POST /values/%s got status code %s", r.u, response.statusCode);
                                return reject(result);
                            }

                            resolve(result);
                        });
                    })
                );
            }
        );
        Promise.all(morePromises).then(function(postResults) {
            console.log(JSON.stringify(postResults, null, 4));
            myExit();
        }).catch(function(err) {
            console.error("ERROR: %s", util.inspect(err));
            myExit(1);
        });
    }).catch(function(err) {
        console.error("ERROR: %s", util.inspect(err));
        myExit(1);
    });
} else {
    var uuids = [];
    var getValuesPromises = [];
    for (var c = 0; c < limit; c++) {
        uuids.push(UUID.v4());
    }

    uuids.forEach(
        function(u) {
            getValuesPromises.push(
                new Promise(
                    function(resolve, reject) {
                        request({
                            url: baseUrl + "/values/" + u,
                            headers: {
                                Accept: "application/json"
                            },
                            json: true
                        }, function(err, response, body) {
                            if (err) {
                                console.log(err);
                                return reject(err);
                            } else if (response.statusCode !== 200) {
                                console.log("%s %s", response.request.method, response.request.uri.href);
                                console.log("Status: %s", response.statusCode);
                                return reject(body);
                            }
                            console.log("%s %s", response.request.method, response.request.uri.href);
                            var r = body;
                            r.uuid = u;

                            resolve(r);
                        });
                    }
                )
            );
        }
    );
    var algorithmTimes = [];
    Promise.all(getValuesPromises).then(function(results) {
        var promises = [];

        results.forEach(function(r) {
            promises.push(
                new Promise(
                    function(resolve, reject) {
                        var concatenatedString;
                        var start = new Date();
                        try {
                            concatenatedString = utils.algorithms[r.algorithm](r);
                        } catch (e) {
                            return reject([e, e.stack]);
                        }

                        var base64Encoded = utils.toBase64(concatenatedString);

                        algorithmTimes.push({algorithm: r.algorithm, time: new Date() - start});
                        if (verifyOnly) {
                            request({
                                url: baseUrl + "/encoded/" + r.uuid + "/" + r.algorithm,
                                headers: {
                                    Accept: "application/json"
                                },
                                json: true
                            }, function(err, response, body) {
                                if (err) {
                                    console.log(err);
                                    return reject(err);
                                } else if (response.statusCode !== 200) {
                                    console.log("%s %s", response.request.method, response.request.uri.href);
                                    console.log("Status: %s", response.statusCode);
                                    return reject(body);
                                }
                                console.log("%s %s", response.request.method, response.request.uri.href);
                                console.log(base64Encoded === body.encoded || ("" + base64Encoded + "\n" + body.encoded + "\n"));
                                resolve();
                            });
                        } else {
                            var postData = utils.postTemplate(base64Encoded);
                            request({
                                method: "POST",
                                uri: baseUrl + "/values/" + r.uuid + "/" + r.algorithm,
                                headers: {
                                    Accept: "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: postData,
                                json: true
                            }, function(err, response, result) {
                                if (err) {
                                    console.log(err);
                                    return reject(err);
                                } else if (response.statusCode !== 200) {
                                    console.log("%s %s", response.request.method, response.request.uri.href);
                                    console.log("Status: %s", response.statusCode);
                                    return reject(result);
                                }
                                console.log("%s %s", response.request.method, response.request.uri.href);

                                resolve(result);
                            });
                        }
                    }
                )
            );
        });

        Promise.all(promises).then(function(results) {
            console.log(JSON.stringify(results, null, 4));
            console.dir(algorithmTimes);
            console.log("Total: %sms", algorithmTimes.reduce(function(a, b) { return a + b.time;}, 0));
            myExit();
        }).catch(function(err) {
            console.error("ERROR: %s", util.inspect(err));
            myExit(1);
        });

    }).catch(function(err) {
        console.error("ERROR: %s", util.inspect(err));
        myExit(1);
    });
}