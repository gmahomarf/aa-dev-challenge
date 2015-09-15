var request = require("request");
var UUID = require("uuid");
var Promise = require("Bluebird");

var utils = require("./utils");

var baseUrl = "http://internal-devchallenge-2-dev.apphb.com";

var lists = [];

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
    process.exit(1);
} else if (!argv.hack && !argv.v && !argv.p) {
    console.error("ERROR: Must verify or post. Choose one\n");
    console.error(usage);
    process.exit(1);
} else if (argv.h) {
    console.log(usage);
    process.exit();
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
                        return reject(err);
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
                            return reject();
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
                                return reject();
                            }

                            if (response.statusCode !== 200) {
                                console.log("POST /values/%s got status code %s", r.u, response.statusCode);
                                return reject(err);
                            }

                            resolve(result);
                        });
                    })
                );
            }
        );
        Promise.all(morePromises).then(function(postResults) {
            console.log(JSON.stringify(postResults, null, 4));
            process.exit();
        }).catch(function(err) {
            console.error("ERROR: %s", err);
            process.exit(1);
        });
    }).catch(function(err) {
        console.error("ERROR: %s", err);
        process.exit(1);
    });
} else {
    for (var times = 0; times < limit; times++) {
        var uid = UUID.v4();
        (function(u) {
            request({
                url: baseUrl + "/values/" + u,
                headers: {
                    Accept: "application/json"
                },
                json: true
            }, function(err, response, body) {
                console.log("GET %s", response.request.uri.href);
                if (err) {
                    console.log(err);
                    return;
                } else if (response.statusCode !== 200) {
                    console.log("Status: %s", response.statusCode);
                    return;
                }
                // var r = JSON.parse(body);
                var r = body;
                r.uuid = u;
                lists.push(r);

                var base64Encoded = utils.getBase64Data(r);

                if (verifyOnly) {
                    request({
                        url: baseUrl + "/encoded/" + u,
                        headers: {
                            Accept: "application/json"
                        },
                        json: true
                    }, function(err, response, body) {
                        //body = JSON.parse(body);
                        //console.log(base64Encoded == body.encoded || ("" + base64Encoded + "\n" + body.encoded + "\n"));
                        console.log(body);
                    });
                } else {
                    (function(id, b64) {
                        var postData = utils.postTemplate(b64);
                        //console.log(JSON.stringify(postData, null, 4));
                        request({
                            method: "POST",
                            uri: baseUrl + "/values/" + id,
                            headers: {
                                Accept: "application/json",
                                "Content-Type": "application/json"
                            },
                            body: postData,
                            json: true
                        }, function(err, response, result) {
                            console.log("POST %s", baseUrl + "/values/" + id);
                            if (err) {
                                console.log(err);
                                return;
                            }
                            result = result;
                            if (response.statusCode === 200) {
                                console.log(result.message);
                            } else {
                                console.log("Status: %s", response.statusCode);
                                console.log(r);
                            }
                        });
                    })(u, base64Encoded);
                }
            });
        })(uid);
    }
}