"use strict";

var utils = module.exports = {};

utils.postTemplate = function(value) {
    return {
        "encodedValue": value,
        "emailAddress": "gmahomarf@gmail.com",
        "name": "Gazy Mahomar",
        "webhookUrl": "https://aa-dev-challenge.herokuapp.com/webhookv2",
        "repoUrl": "https://github.com/gmahomarf/aa-dev-challenge"
    };
};

var debug = function() {
    var args = [].slice.call(arguments, 0);
    if(process.env.AADEBUG === "y") {
        console.log.apply(console, args);
    }
};

var utils = module.exports = {};

utils.postTemplate = function(value) {
    return {
        "encodedValue": value,
        "emailAddress": "gmahomarf@gmail.com",
        "name": "Gazy Mahomar",
        "webhookUrl": "https://aa-dev-challenge.herokuapp.com/webhookv2",
        "repoUrl": "https://github.com/gmahomarf/aa-dev-challenge"
    };
};

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

var isLower = function(c) {
    return c >= "a" && c <= "z";
};

var isUpper = function(c) {
    return c >= "A" && c <= "Z";
};

var isDigit = function(c) {
    return c >= "0" && c <= "9";
};

var isConsonant = function(c) {
    return "bcdfghjklmnpqrstvwxz".indexOf(c.toLowerCase()) !== -1;
};

var isVowel = function(c) {
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
                newWords.push(words[n].slice(s, i));
                s = i;
            }
        }
        if (s < w.length) {
            newWords.push(words[n].slice(s));
        }
    });
    return newWords;
};

utils.shiftVowelsRight = function(words) {
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

utils.alternateConsonantCase = function(words) {
    var toUpper = isUpper(words[0][0]) || isDigit(words[0][0]);
    var r = [];
    words.forEach(function(w) {
        w = w.split("");
        for (var i = 0; i < w.length; i++) {
            if (isConsonant(w[i])){
            //if (!isDigit(w[i])) {
                w[i] = toUpper && w[i].toUpperCase() || w[i].toLowerCase();
                toUpper = !toUpper;
            }
        }
        r.push(w.join(""));
    });

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
            if (isVowel(w[i])) {
                w[i] = c;
                c = fibo.next();
            }
        }
        r.push(w.join(""));
    });

    return r;
};

utils.concatWithAsciiCodeDelimiter = function(words) {
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

utils.concatWithAsteriskDelimiter = function(words) {
    return words.join("*");
};

utils.sortAlphabeticEnglishCulture = function(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();

    return a < b ? -1 : (a > b ? 1: 0);
};

utils.sortAlphabeticCaseSensitiveEnglishCulture = function(a, b) {
    //According to tests, order in C# is: numbers, lowercase, uppercase
    for (var i = 0; i < a.length && i < b.length; i++) {
        var ai = a[i];
        var bi = b[i];

        if (isDigit(ai)) {
            if (isDigit(bi)) {
                return ai < bi ? -1 : (ai > bi ? 1 : 0);
            } else {
                return -1;
            }
        } else if (isLower(ai)) {
            if (isDigit(bi)) {
                return 1;
            } else if (isLower(bi)) {
                return ai < bi ? -1 : (ai > bi ? 1 : 0);
            } else {
                return -1;
            }
        } else { // isUpper(ai)
            if (isUpper(bi)) {
                return ai < bi ? -1 : (ai > bi ? 1 : 0);
            } else {
                return 1;
            }
        }
    }
    return a.length - b.length;
};

utils.sortReverseAlphabeticEnglishCulture = function(a, b) {
    return -utils.sortAlphabeticEnglishCulture(a,b);
};

utils.sortReverseAlphabeticCaseSensitiveEnglishCulture = function(a, b) {
    //According to tests, order in C# is: uppercase, lowercase, numbers
    for (var i = 0; i < a.length && i < b.length; i++) {
        var ai = a[i];
        var bi = b[i];

        if (isDigit(ai)) {
            if (isDigit(bi)) {
                return ai < bi ? 1 : (ai > bi ? -1 : 0);
            } else {
                return 1;
            }
        } else if (isLower(ai)) {
            if (isDigit(bi)) {
                return -1;
            } else if (isLower(bi)) {
                return ai < bi ? 1 : (ai > bi ? -1 : 0);
            } else {
                return 1;
            }
        } else { // isUpper(ai)
            if (isUpper(bi)) {
                return ai < bi ? 1 : (ai > bi ? -1 : 0);
            } else {
                return -1;
            }
        }
    }
    return a.length - b.length;
};

utils.algorithms = {
    IronMan: function(data) {
        var words = data.words;
        debug("%s starts with %s", "ironMan", words);

        var sortedWords = words.sort(utils.sortAlphabeticEnglishCulture);
        debug("%s returns %s", "sortedWords", sortedWords);

        var shiftedVowelWords = utils.shiftVowelsRight(sortedWords);
        debug("%s returns %s", "shiftedVowelWords", shiftedVowelWords);

        var concatenated = utils.concatWithAsciiCodeDelimiter(shiftedVowelWords);
        debug("%s returns %s", "concatenated", concatenated);

        return concatenated;
    },
    TheIncredibleHulk: function(data) {
        var words = data.words;
        debug("%s starts with %s", "ironMan", words);

        var shiftedVowelWords = utils.shiftVowelsRight(words);
        debug("%s returns %s", "shiftedVowelWords", shiftedVowelWords);

        var reverseSortedWords = shiftedVowelWords.sort(utils.sortReverseAlphabeticEnglishCulture);
        debug("%s returns %s", "reverseSortedWords", reverseSortedWords);

        var concatenated = utils.concatWithAsteriskDelimiter(reverseSortedWords);
        debug("%s returns %s", "concatenated", concatenated);

        return concatenated;
    },
    Thor: function(data) {
        var words = data.words;
        var startingFibonacciNumber = data.startingFibonacciNumber;
        debug("%s starts with %s and %s", "thor", words, startingFibonacciNumber);

        var splitEnglishWords = utils.splitEnglishWords(words);
        debug("%s returns %s", "splitEnglishWords", splitEnglishWords);

        var sortedWords = splitEnglishWords.sort(utils.sortAlphabeticEnglishCulture);
        debug("%s returns %s", "sortedWords", sortedWords);

        var alternatingConsonantCaseWords = utils.alternateConsonantCase(sortedWords);
        debug("%s returns %s", "alternatingConsonantCaseWords", alternatingConsonantCaseWords);

        var fibonacciReplacedVowelsWords = utils.replaceVowelsWithFibonacci(alternatingConsonantCaseWords, startingFibonacciNumber);
        debug("%s returns %s", "fibonacciReplacedVowelsWords", fibonacciReplacedVowelsWords);

        var concatenated = utils.concatWithAsteriskDelimiter(fibonacciReplacedVowelsWords);
        debug("%s returns %s", "concatenated", concatenated);

        return concatenated;
    },
    CaptainAmerica: function(data) {
        var words = data.words;
        var startingFibonacciNumber = data.startingFibonacciNumber;
        debug("%s starts with %s and %s", "captainAmerica", words, startingFibonacciNumber);

        var shiftedVowelWords = utils.shiftVowelsRight(words);
        debug("%s returns %s", "shiftedVowelWords", shiftedVowelWords);

        var reverseSortedWords = shiftedVowelWords.sort(utils.sortReverseAlphabeticEnglishCulture);
        debug("%s returns %s", "reverseSortedWords", reverseSortedWords);

        var fibonacciReplacedVowelsWords = utils.replaceVowelsWithFibonacci(reverseSortedWords, startingFibonacciNumber);
        debug("%s returns %s", "fibonacciReplacedVowelsWords", fibonacciReplacedVowelsWords);

        var concatenated = utils.concatWithAsciiCodeDelimiter(fibonacciReplacedVowelsWords);
        debug("%s returns %s", "concatenated", concatenated);

        return concatenated;
    }
};

utils.toBase64 = function(s) {
    var base64Encoded = new Buffer(s, "utf-8").toString("base64");

    return base64Encoded;
};

utils.v1Algorithm = function(data) {
    var words = data.words;
    var startingFibonacciNumber = data.startingFibonacciNumber;
    debug("%s starts with %s and %s", "v1Algorithm", words, startingFibonacciNumber);

    var splitEnglishWords = utils.splitEnglishWords(words);
    debug("%s returns %s", "splitEnglishWords", splitEnglishWords);

    var sortedWords = splitEnglishWords.sort(utils.sortAlphabeticEnglishCulture);
    debug("%s returns %s", "sortedWords", sortedWords);

    var shiftedVowelWords = utils.shiftVowelsRight(sortedWords);
    debug("%s returns %s", "shiftedVowelWords", shiftedVowelWords);

    var alternatingConsonantCaseWords = utils.alternateConsonantCase(shiftedVowelWords);
    debug("%s returns %s", "alternatingConsonantCaseWords", alternatingConsonantCaseWords);

    var fibonacciReplacedVowelsWords = utils.replaceVowelsWithFibonacci(alternatingConsonantCaseWords, startingFibonacciNumber);
    debug("%s returns %s", "fibonacciReplacedVowelsWords", fibonacciReplacedVowelsWords);

    var reverseSortedWords = fibonacciReplacedVowelsWords.sort(utils.sortReverseAlphabeticEnglishCulture);
    debug("%s returns %s", "reverseSortedWords", reverseSortedWords);

    var concatenated = utils.concatWithAsciiCodeDelimiter(reverseSortedWords);
    debug("%s returns %s", "concatenated", concatenated);

    return concatenated;
};
