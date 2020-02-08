const http = require('http');
const fs = require('fs').promises;

const server = http.createServer(async (req, res) => {
	res.statusCode = 200;
	if (req.url === '/') {
		res.setHeader('Content-Type', 'text/html');
		const data = await fs.readFile('render.html');
		res.end(data);
		return;
	}

	if (req.url === '/favicon.ico') {
		res.end();
	}

	if (req.url === '/lib/nbv.js') {
		res.setHeader('Content-Type', 'application/javascript');
		const data = await fs.readFile('../lib/nbv.js');
		res.end(data);
		return;
	}
	
	// TODO: route to show all the notebooks
	// TODO: route to return a single notebook
});

const hostname = 'localhost';
const port = 3000;

server.listen(port, hostname, () => {
	console.log(`Testing instance is running at http://${hostname}:${port}`);
});
