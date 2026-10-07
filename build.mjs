import {mkdir,copyFile,readdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await copyFile('index.html','dist/index.html');
for(const file of await readdir('.')) if(/^motion-[a-z-]+\.webp$/.test(file)) await copyFile(file,`dist/${file}`);
console.log('Built app and local motion assets');
