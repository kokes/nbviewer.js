const nbv_constructor = (function(document, deps) {
    "use strict";

    var d = document;
    var st = {}; // settings

    function render_ipynb(obj, target, settings) {
        st = settings || {};

        st.nbformat = obj.nbformat;
        if (st.nbformat < 3) {
            throw new Error('Format of the notebook too old');
        }

        if (st.nbformat > 3) {
            st.lang = (obj.metadata.kernelspec || {'language': null}).language;
        }

        // wipe all inner elements of our target
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }
        var t = d.createElement('div');
        t.setAttribute('style', [
            'max-width: 960px',
            'border: 1px solid #ccc',
            'margin: 1em auto',
            'padding: 1.5em 1.5em 1.5em 7em',
            'background-color: white',
            'box-shadow: 0 0 10px #ccc'
            ].join(';'));
        target.appendChild(t);
        st.target = t;

        // v4 has cells directly in the object, v3 had a list of
        // worksheets, each with a list of cells
        var cells = obj.cells || function() {
            var ret = [];
            for (var j=0; j < obj.worksheets.length; j++) {
                ret = ret.concat(obj.worksheets[j].cells);
            }
            return ret;
        }();

        for (var j=0; j < cells.length; j++) {
            var tc = cells[j];

            var cell = d.createElement('div');
            cell.setAttribute('style', 'padding-bottom: .5em;');

            var dm = d.createElement('div'); // empty div as a fallback

            switch (tc.cell_type) {
                case 'code':
                    dm = handle_code(tc);
                    break;
                case 'markdown':
                    dm = handle_mdown(tc.source);
                    break;
                // TODO: is this v3 only or not?
                case 'heading':
                    let md = "#".repeat(tc.level);
                    md += " " + handle_multiline_strings(tc.source);
                    dm = handle_mdown(md);
                    break;
                case 'raw':
                    dm.appendChild(document.createTextNode(handle_multiline_strings(tc.source)));
                    break;
                default:
                    throw new Error('Unsupported cell type: ' + tc.cell_type);
            }
            cell.appendChild(dm);
            t.appendChild(cell);
        }

        // style all dataframes
        // hint: https://davidwalsh.name/add-rules-stylesheets
        var sheet = (function() {
            var style = document.createElement('style');
            document.head.appendChild(style);
            return style.sheet;
        })();
        sheet.insertRule('table.dataframe { border-collapse: collapse; }')
        sheet.insertRule('table.dataframe, table.dataframe td, table.dataframe th { border: none; }')
        sheet.insertRule('table.dataframe th { font-weight: bold; }')
        sheet.insertRule('table.dataframe th, table.dataframe td { padding: .4em .5em; }')
        sheet.insertRule('table.dataframe tbody { border-top: 1px solid #4c4c4c; }')
        sheet.insertRule('table.dataframe tbody th { text-align: right; }')
        sheet.insertRule('table.dataframe tbody tr:nth-child(odd) { background-color: #f5f5f5; }')
    }

    function excount(cell, tin) {
        var cc = d.createElement('span');
        cc.setAttribute('style', [
            'display: block',
            'position: absolute',
            'top: ' + (tin ? '5px' : '0 !important'),
            'left: -7.5em',
            'width: 7em',
            'font-family: monospace',
            'text-align: right',
            'color: ' + (tin ? '#303fba' : '#de4815')
            ].join(';'));
        cc.textContent = (tin ? 'In': 'Out') + ' [' +
            ((!cell.execution_count && !cell.prompt_number) ? ' ' :
                (cell.execution_count || cell.prompt_number)) + ']:';
        return cc;
    }

    // receives cell, outputs DOM
    function handle_code(cell) {
        var el = d.createElement('div'); // container for it all
        el.style.position = 'relative'; // for excount positioning

        el.appendChild(excount(cell, true));

        var pre = d.createElement('pre');
        // because code may also be within markdown:
        pre.setAttribute('style', [
            'background: #f7f7f7',
            'border: 1px solid #cfcfcf',
            'padding: .4em',
            'margin-bottom: 0',
            'margin-top: 0',
            'border-radius: 2px',
            'min-height: .85em'
            ].join(';'));
        var code = d.createElement('code');

        // if (st.hasOwnProperty('lang'))
        code.setAttribute('class', 'language-' + st.lang || cell.language);

        // no need to join on '\n' - newlines are in the code already (but let's be cautious)
        // .source for v4, .input for v3
        var raw_source = (cell.source || cell.input);
        code.textContent = handle_multiline_strings(raw_source);

        pre.appendChild(code);
        el.appendChild(pre);
        deps.prism.highlightElement(code);

        // outputs now
        var outp = d.createElement('div');
        outp.style.margin = '1em 0 .5em 0';

        for (var j=0; j < cell.outputs.length; j++) {
            var dm = d.createElement('div'); // wrapper
            dm.style.position = 'relative'; // for excount positioning
            var dt = cell.outputs[j];
            if (dt.output_type == 'execute_result')
                dm.appendChild(excount(dt, false));

            switch (dt.output_type) {
                case 'execute_result':
                    dm.appendChild(handle_cell_output(dt));
                    break;
                case 'stream':
                    dm.appendChild(handle_stream_output(dt));
                    break;
                case 'pyerr': // v3
                case 'error': // v4
                    dm.appendChild(handle_error_cell(dt));
                    break;
                case 'display_data':
                    if (st.nbformat > 3) {
                        dm.appendChild(handle_cell_output(dt));
                        break;
                    }
                    // if 3, fall through to pyout
                case 'pyout':
                    // legacy (v3)
                    dm.appendChild(handle_pyout(dt));
                    break;
                default:
                    throw new Error('Not supported output_type: ' +
                        cell.outputs[j].output_type);
            }

            outp.appendChild(dm);
        }
        el.appendChild(outp);

        return el;
    }

    function handle_cell_output(dt) {
        var el = d.createElement('div');
        el.style.minHeight = '1em';

        // taken from https://github.com/jupyter/nbconvert/blob/master/nbconvert/utils/base.py
        // var format_priority = ['text/html', 'application/pdf', 'text/latex', 'image/svg+xml', 'image/png', 'image/jpeg', 'text/markdown', 'text/plain'];
        // filtering only those that are currently supported (excluding pdf, latex, markdown)
        var format_priority = ['text/html', 'image/svg+xml', 'image/png', 'image/jpeg', 'text/plain'];

        var fmt = null;
        for (var tfmt of format_priority) {
            if (dt.data.hasOwnProperty(tfmt)) {
                fmt = tfmt;
                break;
            }
        }
        if (!fmt) {
            // TODO: migrate to exceptions? Or is this not a hard fail?
            // throw new Error('No valid data format: ' + Object.keys(dt.data))
            console.error('No valid data format: ' + Object.keys(dt.data));
            return d.createElement('div'); // empty div, just so that it can be appended
        }

        var dm = d.createElement('div');
        var source = handle_multiline_strings(dt.data[fmt]);
        switch (fmt) {
            case 'text/plain':
                dm = d.createElement('pre');
                dm.style.margin = 0;
                dm.style.whiteSpace = 'pre-wrap';
                dm.textContent = source;
                break;

            case 'text/html':
                dm.innerHTML = source;

                // we may have generated some HTML tables we need to style
                var dfs = dm.getElementsByClassName('dataframe');
                for (var k = 0; k < dfs.length; k++) {
                    if (dfs[k].classList.contains('dataframe')) {
                        continue; // we style dataframes separately
                    }
                    dfs[k].setAttribute('style', [
                        'border-collapse: collapse',
                        'text-align: left'
                        // 'margin-top: 1em'
                    ].join(';'));

                    // let's style individual cells as well
                    var cl = dfs[k].querySelectorAll('td, th');
                    for (var l=0; l < cl.length; l++) {
                        cl[l].style.padding = '3px';
                    }

                }
                break;

            case 'image/svg+xml':
                dm.innerHTML = source;
                break;

            default:
                if (fmt.startsWith('image/')) {
                    dm = d.createElement('img');
                    dm.setAttribute('src', 'data:' + fmt + ';base64,' + source);
                    dm.setAttribute('style', 'max-width: 100%'); // avoid overflow
                    // use width and height attributes supplied in metadata
                    if (fmt in (dt.metadata || {})) {
                        var metadata = dt.metadata[fmt];
                        if ('width' in metadata) {
                            dm.setAttribute('width', metadata.width);
                        }
                        if ('height' in metadata) {
                            dm.setAttribute('height', metadata.height);
                        }
                    }
                    break;
                }
                throw new Error('Valid, but unsupported format: ' + fmt);
        }
        el.appendChild(dm);

        return el;
    }

    function handle_error_cell(dt) {
        var cn = d.createElement('pre');
        var txt = handle_multiline_strings(dt.traceback);
        // stripping ANSI colours for now https://github.com/chalk/ansi-regex/blob/master/index.js#L3
        // could use a full library at some point https://github.com/drudru/ansi_up
        txt = txt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        cn.textContent = txt;

        return cn;
    }

    // inspired by Microsoft's fork:
    // https://github.com/Azure/ipynb-renderer/blob/82806a1ec5a19aefae9d1c8f3a87496cb0574e81/scripts/nbv.js#L316-L330
    function handle_multiline_strings(dt) {
        if (dt === undefined || dt === null) {
            return "";
        }
        if (Array.isArray(dt)) {
            return dt.join("");
        }
        if (typeof dt === "string") {
            return dt;
        }
        console.log(dt)

        return dt.toString();
    }

    function handle_stream_output(dt) {
        // name in v4, stream in v3
        var outt = dt.name || dt.stream; // v4 || v3; contains 'stdout' or 'stderr'

        if (!dt.hasOwnProperty('text'))
            throw new Error('data for stream missing');

        var cn = d.createElement('pre');
        // stderr red background, stdout is plain white
        if (outt === 'stderr') {
            cn.setAttribute('style', 'background-color: #fdd; padding: .5em; white-space: pre-wrap');
        }
        cn.textContent = handle_multiline_strings(dt.text);

        return cn;
    }

    function latexer(isDisplayMode) {
        return function replacer(match, m1, offset, string) {
            return deps.katex.renderToString(m1, {
                displayMode: isDisplayMode,
                throwOnError: false, // we do not want to stop rendering because of bad LaTeX
            });
        }
    }

    function handle_mdown(source) {
        var el = d.createElement('div');
        var source = handle_multiline_strings(source);
        var latexed = source.replace(/\$\$([\s\S]+?)\$\$/g, latexer(true)); // block-based math
        latexed = latexed.replace(/\$(.+?)\$/g, latexer(false)); // inline math
        el.innerHTML = deps.marked(latexed);

        return el;
    }

    // handling legacy notebooks (v3)
    function handle_pyout(cell) {
        var el = d.createElement('div');

        if (cell.hasOwnProperty('prompt_number'))
            el.appendChild(excount(cell, false));

        // var ks = Object.keys(cell)
        // text, png, jpeg, html -- supported
        // svg, latex, javascript, json, pdf, metadata -- not yet
        Object.keys(cell).forEach(function(k) {
            // TODO: are metadata in any way useful?
            if (['output_type', 'prompt_number', 'metadata'].indexOf(k) > -1)
                return;
            var p = d.createElement('span'); // if errs
            switch (k) {
                case 'text':
                    p = d.createElement('pre');
                    p.style.margin = 0;
                    p.textContent = handle_multiline_strings(cell[k]);
                    break;
                case 'html':
                case 'svg':
                    p = d.createElement('div');
                    // guessing here, haven't seen a v3 HTML element (TODO: remove it and test against our big dataset)
                    p.innerHTML = handle_multiline_strings(cell[k]);
                    break;
                case 'png':
                case 'jpeg':
                    p = d.createElement('img');
                    p.setAttribute('src', 'data:' + k + ';base64,' + cell[k]);
                    p.setAttribute('style', 'max-width: 100%'); // avoid overflow

                    break;

                default:
                    throw new Error('unsupported pyout format: ' + k);
            }
            el.appendChild(p);
        });

        return el;
    }

    return {
        render: render_ipynb
    };

});

if (typeof module !== "undefined") {
    module.exports = {
        nbv_constructor: nbv_constructor,
    }
}
