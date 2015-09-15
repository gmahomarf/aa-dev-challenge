var utils = module.exports = {};

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

utils.isLower = function(c) {
    return c >= "a" && c <= "z";
};

utils.isUpper = function(c) {
    return c >= "A" && c <= "Z";
};

utils.isConsonant = function(c) {
    return "bcdfghjklmnpqrstvwxz".indexOf(c.toLowerCase()) !== -1;
};

utils.isVowel = function(c) {
    return "aeiouy".indexOf(c.toLowerCase()) !== -1;
};

var Fibo = function() {
    var x = 0;
    var y = 1;

    this.next = function() {
        y += x;
        x = y - x;
        return x;
    };
};

utils.splitEnglishWords = function(words) {
    var lowerWords = words.map(function(w) {
        return w.toLowerCase();
    });
    var newWords = [];
    lowerWords.forEach(function(w, n) {
        var s = 0;
        for (var i = 0; i <= w.length; i++) {
            var slice = w.slice(s, i);
            if (englishWords.indexOf(slice) !== -1) {
                newWords.push(words[n].slice(s,i));
                s = i;
            }
        }
        if (s < w.length) {
            newWords.push(words[n].slice(s));
        }
    });
    process.env.AADEBUG === "y" && console.log("%s returns %s", "splitEnglishWords", newWords);
    return newWords;
};

utils.shiftVowels = function(words) {
    var r = [];
    words.forEach(function(w) {
        w = w.split("");
        for (var i = 0; i < w.length; i++) {
            if (utils.isVowel(w[i])) {
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
    process.env.AADEBUG === "y" && console.log("%s returns %s", "shiftVowels", r);
    return r;
};

utils.alternateConsonantCase = function(words) {
    var toUpper = utils.isUpper(words[0][0]);
    var r = [];
    words.forEach(function(w) {
        w = w.split("");
        for (var i = 0; i < w.length; i++) {
            if (utils.isConsonant(w[i])) {
                w[i] = toUpper && w[i].toUpperCase() || w[i].toLowerCase();
                toUpper = !toUpper;
            }
        }
        r.push(w.join(""));
    });

    process.env.AADEBUG === "y" && console.log("%s returns %s", "alternateConsonantCase", r);
    return r;
};

utils.replaceVowelsWithFibonacci = function(words, f) {
    var r = [];
    var fibo = new Fibo();
    var c;
    do {
        c = fibo.next();
    } while (c !== f);
    words.forEach(function(w) {
        w = w.split("");
        for (var i = 0; i < w.length; i++) {
            if (utils.isVowel(w[i])) {
                w[i] = c;
                c = fibo.next();
            }
        }
        r.push(w.join(""));
    });

    process.env.AADEBUG === "y" && console.log("%s returns %s", "replaceVowelsWithFibonacci", r);
    return r;
};

utils.concatWithAsciiDelim = function(words) {
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
    process.env.AADEBUG === "y" && console.log("%s returns %s", "concatWithAsciiDelim", r);
    return r;
};

utils.postTemplate = function(value) {
    return {
        "encodedValue": value,
        "emailAddress": "gmahomarf@gmail.com",
        "name": "Gazy Mahomar",
        "webhookUrl": "https://aa-dev-challenge.herokuapp.com/webhook",
        "repoUrl": "https://github.com/gmahomarf/aa-dev-challenge"
    };
};

utils.getBase64Data = function(r) {
    process.env.AADEBUG === "y" && console.log(r);
    var newWords = utils.splitEnglishWords(r.words);
    var sortedWords = newWords.sort(function(a, b) {
        var la = a.toLowerCase();
        var lb = b.toLowerCase();

        return la < lb ? -1 : (la > lb ? 1 : 0);
    });

    process.env.AADEBUG === "y" && console.log("%s returns %s", "sortedWords", sortedWords);
    var shiftedVowelWords = utils.shiftVowels(sortedWords);
    var alternatedConsonantWords = utils.alternateConsonantCase(shiftedVowelWords);
    var fiboReplaced = utils.replaceVowelsWithFibonacci(alternatedConsonantWords, r.startingFibonacciNumber);
    var resorted = fiboReplaced.sort(function(a, b) {
        var la = a.toLowerCase();
        var lb = b.toLowerCase();

        return la < lb ? 1 : (la > lb ? -1 : 0);
    });
    process.env.AADEBUG === "y" && console.log("%s returns %s", "resorted" , resorted);

    var concated = utils.concatWithAsciiDelim(resorted);

    var base64Encoded = new Buffer(concated, "utf-8").toString("base64");

    return base64Encoded;
};
