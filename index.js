var request = require("request");
var uuid = require("uuid");

var baseUrl = "http://internal-comfybuffalo-1-dev.apphb.com";
var englishWords = [
    "drool",
    "cats",
    "clean",
    "code",
    "dogs",
    "materials",
    "needed",
    "this",
    "is",
    "hard",
    "what",
    "are",
    "you",
    "smoking",
    "shot",
    "gun",
    "down",
    "river",
    "super",
    "man",
    "rule",
    "acklen",
    "developers",
    "are",
    "amazing"
];

var lists = [];

var isLower = function(c) {
    return c >= "a" && c <= "z";
};

var isUpper = function(c) {
    return c >= "A" && c <= "Z";
};

var isConsonant = function(c) {
    return "bcdfghjklmnpqrstvwxyz".indexOf(c.toLowerCase()) !== -1;
};

var isVowel = function(c) {
    return "aeiou".indexOf(c.toLowerCase()) !== -1;
};

var Fibo = function () {
    var x = 0;
    var y = 1;

    this.next = function() {
        y += x;
        x = y - x;
        return x;
    };
};

var splitEnglishWords = function(words) {
    var newWords = [];
    words.forEach(function(w) {
        var s = 0;
        for (var i = 0; i <= w.length; i++) {
            var slice = w.slice(s,i);
            if (englishWords.indexOf(slice) !== -1) {
                newWords.push(slice);
                s = i;
            }
        }
        if (s < w.length) {
            newWords.push(w.slice(s));
        }
    });
    return newWords;
};

var shiftVowels = function(words) {
    var r = [];
    words.forEach(function(w) {
        w = w.split("");
        for (var i = 0; i < w.length; i++) {
            if (isVowel(w[i])) {
                if (i === w.length - 1) {
                    w.unshift(w.pop());
                } else {
                    var t = w[i];
                    w[i] = w[i + 1];
                    w[i + 1] = t;
                }
                ++i;
            }
        }
        r.push(w.join(""));
    });
    return r;
};

var alternateConsonantCase = function(words) {
    var toUpper = null;
    var r = [];
    words.forEach(function(w) {
        w = w.split("");
        for (var i = 0; i < w.length; i++) {
            if (isConsonant(w[i])) {
                if (toUpper === null) {
                    toUpper = isLower(w[i]);
                    continue;
                }
                w[i] = toUpper && w[i].toUpperCase() || w[i].toLowerCase();
                toUpper = !toUpper;
            }
        }
        r.push(w.join(""));
    });

    return r;
};

var replaceVowelsWithFibonacci = function(words, f) {
    var r = [];
    var fibo = new Fibo();
    var c;
    do {
        c = fibo.next();
    } while (c !== f);
    words.forEach(function(w) {
        w = w.split("");
        for (var i = 0; i < w.length; i++) {
            if (isVowel(w[i])) {
                w[i] = c;
                c = fibo.next();
            }
        }
        r.push(w.join(""));
    });

    return r;
};

var concatWithAsciiDelim = function(words) {
    var r = "";
    words.forEach(function(w, i) {
        var c;
        if (i === 0) {
            c = words[words.length - 1].charCodeAt(0);
        } else {
            c = words[i - 1].charCodeAt(0);
        }
        r += w + c.toString();
    });
    return r;
};

var postTemplate = {
  "encodedValue": "SoMeThInG-eNcOdEd",
  "emailAddress": "gmahomarf@gmail.com",
  "name": "Gazy Mahomar",
  "webhookUrl": "http://your-server.com",
  "repoUrl": "https://github.com/gmahomarf/aa-dev-challenge"
};

var u = uuid.v4();
request(baseUrl + "/values/" + u, function(err, response, body) {
    var r = body;
    r.uuid = u;
    lists.push(r);
    var newWords = splitEnglishWords(r.words);
    var sortedWords = newWords.sort(function(a, b) {
        var la = a.toLowerCase();
        var lb = b.toLowerCase();

        return a < b ? -1 : (a > b ? 1 : 0);
    });
    var shiftedVowelWords = shiftVowels(sortedWords);
    var alternatedConsonantWords = alternateConsonantCase(shiftedVowelWords);
    var fiboReplaced = replaceVowelsWithFibonacci(alternatedConsonantWords, r.startingFibonacciNumber);
    var resorted = fiboReplaced.sort(function(a, b) {
        var la = a.toLowerCase();
        var lb = b.toLowerCase();

        return a < b ? 1 : (a > b ? -1 : 0);
    });

    var concated = concatWithAsciiDelim(resorted);

    var base64Encoded = new Buffer(concated, "utf-8").toString("base64");
});

