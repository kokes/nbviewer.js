var nbv = (function() {
    "use strict";

    var d = document;
    var st = {}; // settings

    function render_ipynb(obj, target, settings) {
        if (!window.marked || !window.Prism) {
            console.error('expecting libraries marked.js and Prism.js to be present');
            return;
        }
        st = settings || {};

        st.nbformat = obj.nbformat;
        if (st.nbformat < 3) {
            console.error('Format of the notebook too old');
            return;
        }

        if (st.nbformat > 3)
            st.lang = obj.metadata.kernelspec.language;

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
                    dm = handle_mdown(tc);
                    break;

                default:
                    console.error('Unsupported cell type: ' + tc.cell_type);
            }
            cell.appendChild(dm);
            t.appendChild(cell);
        }

        // if (st.toc)
        //     render_toc()
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

        // no need to join on '\n' - newlines are in the code already
        // .source for v4, .input for v3
        code.textContent = (cell.source || cell.input).join('');

        pre.appendChild(code);
        el.appendChild(pre);
        Prism.highlightElement(code);

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
                    console.error('Not supported output_type: ' +
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

        // individual outputs
        var fmts = Object.keys(dt.data);
        for (var j=0; j < fmts.length; j++) {
            var fmt = fmts[j];
            var dm = d.createElement('div');
            switch (fmt) {
                case 'text/plain':
                    // text/plain might be just a fallback here
                    // fixed #10
                    if (fmts.includes('text/html')) continue;

                    dm = d.createElement('pre');
                    dm.style.margin = 0;
                    dm.textContent = dt.data[fmt].join('');
                    break;

                case 'text/html':
                    dm.innerHTML = dt.data[fmt].join('');

                    // we may have generated some HTML tables we need to style
                    var dfs = dm.getElementsByClassName('dataframe');
                    for (var k=0; k < dfs.length; k++) {
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
                    dm.innerHTML = dt.data[fmt].join('');
                    break;

                default:
                    if (fmt.startsWith('image/')) {
                        dm = d.createElement('img');
                        dm.setAttribute('src', 'data:' + fmt + ';base64,' + 
                            ((typeof dt.data[fmt]) == 'string' ? dt.data[fmt] : dt.data[fmt].join('')));
                        break;
                    }
                    console.error('unexpected format: ' + fmt);
            }
            el.appendChild(dm);

        }

        return el;
    }

    function handle_error_cell(dt) {
        var cn = d.createElement('pre');
        var txt = dt.traceback.join('\n');
        // stripping ANSI colours for now https://github.com/chalk/ansi-regex/blob/master/index.js#L3
        // could use a full library at some point https://github.com/drudru/ansi_up
        txt = txt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        cn.textContent = txt;

        return cn;
    }

    function handle_stream_output(dt) {
        // name in v4, stream in v3
        var outt = dt.name || dt.stream; // v4 || v3; contains 'stdout' or 'stderr'

        if (!dt.hasOwnProperty('text'))
            console.error('data for stream missing');

        var cn = d.createElement('pre');
        // stderr red background, stdout is plain white
        if (outt === 'stderr') {
            cn.setAttribute('style', 'background-color: #fdd; padding: .5em');
        }
        cn.textContent = dt.text.join('');

        return cn;
    }

    function handle_mdown(cell) {
        var el = d.createElement('div');
        el.innerHTML = marked(cell.source.join(''));

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
            if (['output_type', 'prompt_number'].indexOf(k) > -1)
                return;
            var p = d.createElement('span'); // if errs
            switch (k) {
                case 'text':
                    p = d.createElement('pre');
                    p.style.margin = 0;
                    p.textContent = cell[k].join('');
                    break;
                case 'html':
                    p = d.createElement('div');
                    // guessing here, haven't seen a v3 HTML element
                    p.innerHTML = cell[k].join('');
                    break;
                case 'png':
                case 'jpeg':
                    p = d.createElement('img');
                    p.setAttribute('src', 'data:' + k + ';base64,' + cell[k]);

                    break;

                default:
                    console.error('unsupported pyout format: ' + k);
            }
            el.appendChild(p);
        });

        return el;
    }

    function sanitise(el) {
        return el.toLowerCase().replace(/\W+/g, '-');
    }

    return {
        render: render_ipynb
    };

})();
