const fs = require("fs");
const path = require("path");

const marked = require("marked");
const katex = require("katex");
const prism = require("prismjs");

const { JSDOM } = require("jsdom");
const document = (new JSDOM("")).window.document;
const nbv = require("../lib/nbv.js").nbv_constructor(document, {marked, prism, katex});

const target = document.createElement("div");

const nbdir = "notebooks";
const listing = fs.readdirSync(nbdir)

for (const filename of listing) {
    const fullPath = path.join(nbdir, filename);
    const nb = JSON.parse(fs.readFileSync(fullPath));
    console.log(fullPath)
    nbv.render(nb, target);
    // huzzah, our first test
    // console.log(tg.innerHTML)
    // we can compare this to a snapshot

}
