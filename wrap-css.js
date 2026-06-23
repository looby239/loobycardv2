const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\looby\\Desktop\\loobywedding\\Mau-thiep\\Thiep-cuoi';
const destDir = path.join(__dirname, 'src', 'styles', 'templates');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const templates = Array.from({ length: 10 }, (_, i) => 10 + i);

// Helper function to extract blocks starting with target keywords (e.g., @keyframes, @font-face)
function extractGlobalBlocks(cssText, keyword) {
  let index = 0;
  const blocks = [];
  let remainingCss = '';
  let lastMatchIndex = 0;

  while (true) {
    const startIdx = cssText.indexOf(keyword, index);
    if (startIdx === -1) {
      remainingCss += cssText.substring(lastMatchIndex);
      break;
    }

    // Add CSS before the block
    remainingCss += cssText.substring(lastMatchIndex, startIdx);

    // Find the opening brace
    const braceIdx = cssText.indexOf('{', startIdx);
    if (braceIdx === -1) {
      index = startIdx + keyword.length;
      lastMatchIndex = startIdx;
      continue;
    }

    // Match balanced braces to find the end of the block
    let braceCount = 1;
    let currentIdx = braceIdx + 1;
    while (braceCount > 0 && currentIdx < cssText.length) {
      if (cssText[currentIdx] === '{') braceCount++;
      if (cssText[currentIdx] === '}') braceCount--;
      currentIdx++;
    }

    // Extracted block
    const blockContent = cssText.substring(startIdx, currentIdx);
    blocks.push(blockContent);

    index = currentIdx;
    lastMatchIndex = currentIdx;
  }

  return { blocks, remainingCss };
}

templates.forEach((tId) => {
  const templateDir = path.join(srcDir, `template-${tId}`);
  const cssFile = path.join(templateDir, 'style.css');

  if (fs.existsSync(cssFile)) {
    let cssContent = fs.readFileSync(cssFile, 'utf8');

    // Remove @import statements
    cssContent = cssContent.replace(/@import url\('[^']+'\);/g, '');

    // Map background image and music assets
    cssContent = cssContent.replace(/url\(['"]?assets\/(.*?)['"]?\)/g, `url('/templates/template-${tId}/assets/$1')`);
    cssContent = cssContent.replace(/url\(['"]?\.\.\/\.\.\/\.\.\/assets\/(.*?)['"]?\)/g, `url('/assets/$1')`);

    // Extract @font-face
    const fontFaceResult = extractGlobalBlocks(cssContent, '@font-face');
    const fontFaces = fontFaceResult.blocks;
    cssContent = fontFaceResult.remainingCss;

    // Extract @keyframes
    const keyframesResult = extractGlobalBlocks(cssContent, '@keyframes');
    const keyframes = keyframesResult.blocks;
    cssContent = keyframesResult.remainingCss;

    // Extract webkit-keyframes
    const webkitKeyframesResult = extractGlobalBlocks(cssContent, '@-webkit-keyframes');
    const webkitKeyframes = webkitKeyframesResult.blocks;
    cssContent = webkitKeyframesResult.remainingCss;

    // Replace root selectors (body, html, :root) with native self-reference & to apply styles directly to .tXX-wrapper.
    // Use negative lookbehind to ensure we only replace standalone element selectors, NOT classes, ids, or custom variables like var(--font-body).
    cssContent = cssContent.replace(/(?<![-_a-zA-Z0-9.#])body\b/g, '&');
    cssContent = cssContent.replace(/(?<![-_a-zA-Z0-9.#])html\b/g, '&');
    cssContent = cssContent.replace(/(?<![-_a-zA-Z0-9.#]):root\b/g, '&');

    // Combine extracted blocks
    const globalBlocks = [...fontFaces, ...keyframes, ...webkitKeyframes].join('\n\n');

    // Wrap the nested styles
    const wrappedCss = `${globalBlocks}\n\n.t${tId}-wrapper {\n${cssContent}\n}`;
    fs.writeFileSync(path.join(destDir, `template-${tId}.css`), wrappedCss, 'utf8');
    console.log(`Successfully processed template-${tId}.css`);
  } else {
    console.warn(`CSS file not found for template-${tId}`);
  }
});
