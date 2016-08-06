### client side rendering of jupyter notebooks

I often read through my Jupyter notebooks, but I rarely have my Jupyter instances running in the right folders. I can't quite use the online nbviewer, because I don't have a public URL for these, so I resort to running dummy Jupyter instances or uploading my file as a one-time gist on Github (one I have to delete thereafter). One last possibility is nbconvert in the command line.

I thought it could be easier and more lightweight. So I hacked together this client side rendering of Jupyter notebooks. All you need is a browser that renders an HTML file (dependent some JavaScript and CSS, both of which can be inlined). You simply drag and drop an `.ipynb` file and it renders. It's rather fast and it supports most notebook features. I tried supporting the previous version (v3), since there are tons of examples in this version out there.

[Try a live demo](https://kokes.github.io/nbviewer.js/viewer.html)

#### Use

There are two ways one can use this. You can use [the demo](https://kokes.github.io/nbviewer.js/viewer.html), which is just a simple wrapper of the library, with dropzones and other basic features. There is no data being transferred anywhere, so feel free to bookmark it and use it.

Or you can use the library itself, there is just a single public method, you call `nbv.render(data, target)`, where `data` is the JSON representation of your Jupyter notebook and `target` is the node where the notebook is to be rendered.

#### Contact

Drop me an email (ondrej.kokes@gmail.com) if you have any questions or suggestions. Contributions welcome.

