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
            }
        }, function(err, response, body) {
            console.log("GET %s", response.request.uri.href)
            var r = JSON.parse(body);
            r.uuid = u;
            lists.push(r);

            var base64Encoded = utils.getBase64Data(r);

            console.log(baseUrl + "/encoded/" + u);
            request({
                url: baseUrl + "/encoded/" + u,
                headers: {
                    Accept: "application/json"
                }
            }, function(err, response, body) {
                console.log(base64Encoded);
                console.dir(body);
                // process.exit();
            });

            (function(id, b64) {
                var postData = utils.postTemplate(b64);
                console.log("POST %s", baseUrl + "/values/" + id);
                //console.log(JSON.stringify(postData, null, 4));
                request({
                    method: "POST",
                    uri: baseUrl + "/values/" + id,
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    json: true,
                    body: postData
                }, function(err, response, body) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(response.request.payload);
                    if (response.statusCode === 200) {
                        console.dir(body);
                    } else {
                        console.log("Status: %s", response.statusCode);
                        console.log(body);
                    }
                });
            })(u, base64Encoded);
        });
    })(uid);
}