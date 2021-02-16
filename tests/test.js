const fs = require("fs");
const path = require("path");
const process = require("process");

const marked = require("marked");
const katex = require("katex");
const prism = require("prismjs");

const { JSDOM } = require("jsdom");
const { exception } = require("console");
const document = (new JSDOM("")).window.document;
const nbv = require("../lib/nbv.js").nbv_constructor(document, {marked, prism, katex});

const target = document.createElement("div");

const nbdir = process.argv[2];
const listing = fs.readdirSync(nbdir)

for (const filename of listing) {
    if (!filename.endsWith(".ipynb")) {
        console.log("skipping " + filename);
        continue
    }
    const fullPath = path.join(nbdir, filename);
    console.log(fullPath)
    const nb = JSON.parse(fs.readFileSync(fullPath));
    nbv.render(nb, target);

    const htmlPath = fullPath.replace(".ipynb", ".html");
    const htmlOriginal = fs.readFileSync(htmlPath);

    if (target.innerHTML != htmlOriginal) {
        fs.writeFileSync(htmlPath.replace(".html", "_test.html"), target.innerHTML);
        throw new Error(`rendering of ${filename} did not result in the HTML format expected`);
    }

    // useful for testing new files:
    // try {
    //     nbv.render(nb, target);
    // } catch(e) {
    //     console.log(e)
    //     continue
    // }
    // fs.rmSync(fullPath)

    // huzzah, our first test
    // console.log(tg.innerHTML)
    // we can compare this to a snapshot

}
