import {mkdir,copyFile,readdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
for(const file of await readdir('.')) if(/^motion-[a-z-]+\.gif$/.test(file)) await copyFile(file,`dist/${file}`);
console.log('Built app and original GIF motion assets');
