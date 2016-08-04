### client side rendering of jupyter notebooks

I often read through my Jupyter notebooks, but I rarely have my Jupyter instances running in the right folders. I can't quite use the online nbviewer, because I don't have a public URL for these, so I resort to running dummy Jupyter instances or uploading my file as a one-time gist on Github (one I have to delete thereafter). One last possibility is nbconvert in the command line.

I thought it could be easier and more lightweight. So I hacked together this client side rendering of Jupyter notebooks. All you need is a browser that renders an HTML file (dependent some JavaScript and CSS, both of which can be inlined). You simply drag and drop an `.ipynb` file and it renders. It's rather fast and it supports most notebook features. I tried supporting the previous version (v3), since there are tons of examples in this version out there.


- [x] have a minimum viable version
- [ ] fully adhere to specs - handle collapsed, scrolled, error, mime types, ...
- [ ] ajax straight from github
- [ ] have a preview version on kokes.github.io/...
- [ ] drop zone for the drag&drop
- [ ] multiple files -> tabs
- [ ] mobile CSS
- [ ] LaTeX support - might not be possible with marked.js
- [ ] search github (bigquery) to get what languages (and ipy versions) are used in jupyter notebooks, adjust Prism.js accordingly