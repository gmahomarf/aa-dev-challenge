var request = require("request");
var uuid = require("uuid");

var utils = require("./utils");

var baseUrl = "http://internal-comfybuffalo-1-dev.apphb.com";

var lists = [];

var limit = process.argv[2] && parseInt(process.argv[2]) || 20;

for (var times = 0; times < limit; times++) {
    var uid = uuid.v4();
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

            // request({
            //     url: baseUrl + "/encoded/" + u,
            //     headers: {
            //         Accept: "application/json"
            //     }
            // }, function(err, response, body) {
            //     body = JSON.parse(body);
            //     console.log(base64Encoded == body.encoded || ("" + base64Encoded + "\n" + body.encoded + "\n"));
            //     // process.exit();
            // });

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
        });
    })(uid);
}