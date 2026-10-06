import http from 'node:http';import {readFile} from 'node:fs/promises';
http.createServer(async(req,res)=>{if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);res.end();return}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(new URL('./index.html',import.meta.url)))}).listen(3000,'0.0.0.0');
