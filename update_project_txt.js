const fs = require('fs');
const path = require('path');

const root = process.cwd();
const files = [
    'divulga_novo/backend/.env',
    'divulga_novo/backend/.env.example',
    'divulga_novo/backend/.gitignore',
    'divulga_novo/backend/package.json',
    'divulga_novo/backend/README.md',
    'divulga_novo/backend/src/auth.js',
    'divulga_novo/backend/src/db.js',
    'divulga_novo/backend/src/server.js',
    'divulga_novo/index.html',
    'divulga_novo/script.js',
    'divulga_novo/styles.css',
    'divulga_novo/MAIND favicon.svg',
    'divulga_novo/Menu digital/menu.html',
    'divulga_novo/Menu digital/menu-app.js',
    'divulga_novo/Menu digital/menu-data.js',
    'divulga_novo/Menu digital/styles.css',
    'netlify.toml',
    'redirect.html'
];

let output = '';

files.forEach(file => {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        output += `=== ${fullPath} ===\n${content}\n\n\n`;
    }
});

fs.writeFileSync('projeto_completo.txt', output);
console.log('projeto_completo.txt updated with all requested files.');
