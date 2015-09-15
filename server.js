var Hapi = require("hapi");

var localMongoUrl = "mongodb://localhost:27017/secretsdb";

var server = new Hapi.Server();

var htmlTemplate = '<!DOCTYPE html> \
<html lang="en"> \
<head> \
    <meta charset="UTF-8"> \
    <title>AA Dev Challenge</title> \
</head> \
<body> \
    <h2>Email: gmahomarf@gmail.com</h2> \
    <table border="1"> \
        <caption>Secrets</caption> \
        <thead> \
            <tr> \
                <th>Time Received</th> \
                <th>Secret</th> \
            </tr> \
        </thead> \
        <tbody> \
            {{secrets}} \
        </tbody> \
    </table> \
</body> \
</html>';

server.connection({
    host: process.env.HOST || "0.0.0.0",
    port: process.env.PORT || 3000,
    routes: {
        cors: true
    }
});

server.route([
    {
        method: "GET",
        path: "/",
        handler: function(req, reply) {
            var MongoClient = require('mongodb').MongoClient;
            var mongoUrl = process.env.MONGOLAB_URI || localMongoUrl;
            MongoClient.connect(mongoUrl, function(err, db) {
                if (err) {
                    console.error(err);
                    return reply(err);
                }

                var collection = db.collection("secrets");

                collection.find({}).toArray(function(err, docs) {
                    var data = "";
                    docs.forEach(function(d) {
                        data += "<tr><td>" + d.timestamp.toString() + "</td><td>" + d.secret + "</td></tr>";
                    });
                    reply(htmlTemplate.replace("{{secrets}}", data));
                });
            });
        }
    },
    {
        method: "GET",
        path: "/v2",
        handler: function(req, reply) {
            var MongoClient = require('mongodb').MongoClient;
            var mongoUrl = process.env.MONGOLAB_URI || localMongoUrl;
            MongoClient.connect(mongoUrl, function(err, db) {
                if (err) {
                    console.error(err);
                    return reply(err);
                }

                var collection = db.collection("secretsv2");

                collection.find({}).toArray(function(err, docs) {
                    var data = "";
                    docs.forEach(function(d) {
                        data += "<tr><td>" + d.timestamp.toString() + "</td><td>" + d.secret + "</td></tr>";
                    });
                    reply(htmlTemplate.replace("{{secrets}}", data));
                });
            });
        }
    },
    {
        method: "POST",
        path: "/webhook",
        handler: function(req, reply) {
            var secret = req.payload.secret;
            if (secret) {
                var MongoClient = require('mongodb').MongoClient;
                var mongoUrl = process.env.MONGOLAB_URI || localMongoUrl;
                MongoClient.connect(mongoUrl, function(err, db) {
                    if (err) {
                        console.error(err);
                        return reply(err);
                    }

                    var collection = db.collection("secrets");

                    collection.insert({
                        timestamp: new Date(),
                        secret: secret
                    }, function(err, result) {
                        if (err) {
                            console.error(err);
                            return reply();
                        }

                        db.close();

                        reply();
                    });


                });
            }
        }
    },
    {
        method: "POST",
        path: "/webhookv2",
        handler: function(req, reply) {
            var secret = req.payload.secret;
            if (secret) {
                var MongoClient = require('mongodb').MongoClient;
                var mongoUrl = process.env.MONGOLAB_URI || localMongoUrl;
                MongoClient.connect(mongoUrl, function(err, db) {
                    if (err) {
                        console.error(err);
                        return reply(err);
                    }

                    var collection = db.collection("secretsv2");

                    collection.insert({
                        timestamp: new Date(),
                        secret: secret
                    }, function(err, result) {
                        if (err) {
                            console.error(err);
                            return reply();
                        }

                        db.close();

                        reply();
                    });


                });
            }
        }
    }
]);

server.start(function(err) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("Server started. Listening on %s", server.info.uri);
});