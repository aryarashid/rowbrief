import {PANELS} from './panels.js';
const panel=PANELS.find(p=>p.id===new URLSearchParams(location.search).get('panel'))??PANELS[0];
document.body.dataset.panel=panel.id;document.getElementById('title').textContent=panel.title;document.getElementById('description').textContent=panel.description;
for(const image of panel.images){const img=document.createElement('img');img.src='../docs/screenshots/'+image.file;img.alt=image.alt;document.getElementById('screens').append(img);}
