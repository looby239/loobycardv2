const fs = require('fs');

const templates = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

for (const t of templates) {
    const htmlPath = `public/templates/template-${t}/index.html`;
    const cssPath = `src/styles/templates/template-${t}.css`;
    let htmlContent = '';
    
    try {
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
    } catch (e) {
        // fallback
        if (t === 10) {
            htmlContent = fs.readFileSync(`public/templates/template-${t}/style.css`, 'utf8');
        }
    }

    const match = htmlContent.match(/href="(https:\/\/fonts\.googleapis\.com\/css2\?family=[^"]+display=swap)"/) || htmlContent.match(/@import url\('(https:\/\/fonts\.googleapis\.com\/css2\?family=[^']+display=swap)'\)/);
    
    if (match) {
        let url = match[1].replace(/&amp;/g, '&');
        const importRule = `@import url("${url}");\n`;
        
        let cssContent = '';
        try {
            cssContent = fs.readFileSync(cssPath, 'utf16le');
            if (cssContent.includes('\0')) {
                // Was utf16
            } else {
                cssContent = fs.readFileSync(cssPath, 'utf8');
            }
        } catch (e) {
            cssContent = fs.readFileSync(cssPath, 'utf8');
        }

        // Remove old incorrect imports
        cssContent = cssContent.replace(/@import url\(".*?"\);\r?\n?/g, '');
        cssContent = cssContent.replace(/@import url\('.*?'\);\r?\n?/g, '');
        // Clean bom if exists
        if (cssContent.charCodeAt(0) === 0xFEFF) {
            cssContent = cssContent.slice(1);
        }
        
        const newCss = importRule + cssContent;
        fs.writeFileSync(cssPath, newCss, 'utf8');
        console.log(`Updated template-${t}.css with URL: ${url}`);
    } else {
        console.log(`No font URL found for template-${t}`);
    }
}
