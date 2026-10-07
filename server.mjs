import http from 'node:http';import {readFile} from 'node:fs/promises';
http.createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const file=path==='/'||path==='/index.html'?'index.html':/^\/motion-[a-z-]+\.gif$/.test(path)?path.slice(1):null;
 if(!file){res.writeHead(404);res.end();return;}
 try{const data=await readFile(new URL(file,import.meta.url));res.setHeader('Content-Type',file.endsWith('.gif')?'image/gif':'text/html; charset=utf-8');res.end(data);}catch{res.writeHead(404);res.end();}
}).listen(3000,'0.0.0.0');
