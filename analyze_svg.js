const fs = require('fs');
const svg = fs.readFileSync('divulga_novo/MAIND favicon.svg', 'utf8');
const colors = new Set();
const counts = {};
const regex = /fill="([^"]+)"/gi;
let match;
while (match = regex.exec(svg)) {
    const color = match[1].toUpperCase();
    colors.add(color);
    counts[color] = (counts[color] || 0) + 1;
}
console.log(counts);
