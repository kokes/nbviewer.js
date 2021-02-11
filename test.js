// TODO:
// rename tests to test_cases?
// pin marked, katex, prism to the same versions as those CDNed
// clean up the constructor in nbv.js
// make the HTML version into a working one
// set up CI, add more examples etc.?
// throw exceptions instead of console.errors
// do not style the main div
// upload more test cases here
// walk directory with test cases to test them all

const fs = require("fs");

const marked = require("marked");
const katex = require("katex");
const prism = require("prismjs");

const { JSDOM } = require("jsdom");
const document = (new JSDOM("")).window.document;
const nbv = require("./lib/nbv.js").nbv(document, marked, prism, katex);

const tg = document.createElement("div");
const nb = JSON.parse(fs.readFileSync("./tests/repro-pr46.ipynb"));

nbv.render(nb, tg);

// huzzah, our first test
console.log(tg.innerHTML)
// we can compare this to a snapshot
