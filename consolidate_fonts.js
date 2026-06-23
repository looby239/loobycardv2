const fs = require('fs');
const globalsPath = 'src/app/globals.css';
let globalsContent = fs.readFileSync(globalsPath, 'utf8');

// The fonts we generated from fix_fonts.js
const allImports = [
  '@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Quicksand:wght@300;400;500;600;700&display=swap");',
  '@import url("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap");',
  '@import url("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap");',
  '@import url("https://fonts.googleapis.com/css2?family=Alex+Brush&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap");',
  '@import url("https://fonts.googleapis.com/css2?family=Pattaya&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap");',
  '@import url("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Pattaya&display=swap");',
  '@import url("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Montserrat:wght@300;400;500;600;700&family=Pattaya&display=swap");',
  '@import url("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap");'
];

const uniqueImports = [...new Set(allImports)];

// remove any existing google font imports from globals.css
globalsContent = globalsContent.replace(/@import url\("https:\/\/fonts\.googleapis\.com[^"]+"\);\n?/g, '');

// Prepend to top
globalsContent = uniqueImports.join('\n') + '\n' + globalsContent;
fs.writeFileSync(globalsPath, globalsContent, 'utf8');

// remove from all templates
for (let i = 10; i <= 19; i++) {
  const cssPath = `src/styles/templates/template-${i}.css`;
  try {
    let content = fs.readFileSync(cssPath, 'utf8');
    content = content.replace(/@import url\("https:\/\/fonts\.googleapis\.com[^"]+"\);\n?/g, '');
    fs.writeFileSync(cssPath, content, 'utf8');
  } catch(e) {}
}

console.log('Successfully consolidated fonts to globals.css');
