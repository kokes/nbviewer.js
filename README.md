### client side rendering of jupyter notebooks

*tl;dr: Render Jupyter notebooks straight in the browser, without a back end converter. Can be used as a library. Or if you're on macOS, you can even fire it up in Quick Look, see [ipynb-quicklook](https://github.com/tuxu/ipynb-quicklook).*

I often want to read through my Jupyter notebooks, but I rarely have my Jupyter instances running in the right folders. I can't quite use the [online nbviewer](http://nbviewer.jupyter.org/), because I don't have a public URL for these, so I resort to running dummy Jupyter instances or uploading my file as a one-time gist on Github (one I have to delete thereafter). One last possibility is `nbconvert` in the command line.

I thought it could be easier and more lightweight. So I hacked together this client side rendering of Jupyter notebooks. All you need is a browser that renders an HTML file (dependent on some JavaScript and CSS, both of which can be inlined). You simply drag and drop an `.ipynb` file and it renders. It's rather fast and it supports most notebook features. I tried supporting the previous version (v3), since there are tons of examples in this version out there.

[**Try a live demo**](https://kokes.github.io/nbviewer.js/viewer.html)

#### NEW: Rendering Github notebooks

You can now render notebooks hosted on Github. You can copy and paste their URL in the viewer, linked above, or you can save this following link as a bookmark:

```
javascript:(function(){location.href="https://kokes.github.io/nbviewer.js/viewer.html#"+btoa(location.href);})();
```

Clicking this while on Github, looking at a notebook, will launch our nbviewer with this notebook rendered here instead. You'll also get a permanent link for you to share.

#### Usage

There are two ways one can use this. You can use the library itself, there is just a single public method, you call `nbv.render(data, target)`, where `data` is the JSON representation of your Jupyter notebook and `target` is the node where the notebook is to be rendered.

Or you can use [the demo](https://kokes.github.io/nbviewer.js/viewer.html) (or a local copy), which is just a simple wrapper of the library, with dropzones and other basic features. There is no data being transferred anywhere, so feel free to bookmark it and use it.

### Tech details
It's rather simple at this point, all the DOM manipulation is written in vanilla JavaScript, Markdown rendering goes through [marked.js](https://github.com/chjj/marked), syntax highlighting is administered by [Prism.js](http://prismjs.com/). The example implementation leverages a few goodies from modern web design, like File API or drag&drops, so a fairly modern browser is necessary.

#### Showcase

![screencast](https://raw.githubusercontent.com/kokes/nbviewer.js/master/preview.gif)


#### Contact

Drop me an email (ondrej.kokes@gmail.com) or tweet at me ([@pndrej](https://twitter.com/pndrej)) if you have any questions or suggestions. Contributions welcome.
