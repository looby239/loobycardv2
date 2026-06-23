const fs = require('fs');
const cssPath = 'public/templates/template-16/style.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

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
    remainingCss += cssText.substring(lastMatchIndex, startIdx);
    const braceIdx = cssText.indexOf('{', startIdx);
    if (braceIdx === -1) {
      index = startIdx + keyword.length;
      lastMatchIndex = startIdx;
      continue;
    }
    let braceCount = 1;
    let currentIdx = braceIdx + 1;
    while (braceCount > 0 && currentIdx < cssText.length) {
      if (cssText[currentIdx] === '{') braceCount++;
      if (cssText[currentIdx] === '}') braceCount--;
      currentIdx++;
    }
    const blockContent = cssText.substring(startIdx, currentIdx);
    blocks.push(blockContent);
    index = currentIdx;
    lastMatchIndex = currentIdx;
  }
  return { blocks, remainingCss };
}

// Remove @import statements
cssContent = cssContent.replace(/@import url\('[^']+'\);/g, '');

// Map background image and music assets
cssContent = cssContent.replace(/url\(['"]?assets\/(.*?)['"]?\)/g, 'url(\'/templates/template-16/assets/$1\')');
cssContent = cssContent.replace(/url\(['"]?\.\.\/\.\.\/\.\.\/assets\/(.*?)['"]?\)/g, 'url(\'/assets/$1\')');

const fontFaceResult = extractGlobalBlocks(cssContent, '@font-face');
const fontFaces = fontFaceResult.blocks;
cssContent = fontFaceResult.remainingCss;

const keyframesResult = extractGlobalBlocks(cssContent, '@keyframes');
const keyframes = keyframesResult.blocks;
cssContent = keyframesResult.remainingCss;

const webkitKeyframesResult = extractGlobalBlocks(cssContent, '@-webkit-keyframes');
const webkitKeyframes = webkitKeyframesResult.blocks;
cssContent = webkitKeyframesResult.remainingCss;

cssContent = cssContent.replace(/(?<![-_a-zA-Z0-9.#])body\b/g, '&');
cssContent = cssContent.replace(/(?<![-_a-zA-Z0-9.#])html\b/g, '&');
cssContent = cssContent.replace(/(?<![-_a-zA-Z0-9.#]):root\b/g, '&');

const globalBlocks = [...fontFaces, ...keyframes, ...webkitKeyframes].join('\n\n');

const wrappedCss = `/* === AUTO CENTER FIX === */
.t16-wrapper { text-align: center; }
.template-container { margin-left: auto !important; margin-right: auto !important; width: 100% !important; }
.t16-wrapper .rsvp-form, .t16-wrapper .wish-form, .t16-wrapper .form-group, .t16-wrapper .timeline-box, .t16-wrapper .guestbook-list, .t16-wrapper .wish-item { text-align: left; }
/* === END AUTO CENTER FIX === */

${globalBlocks}

.t16-wrapper {
${cssContent}
}`;

fs.writeFileSync('src/styles/templates/template-16.css', wrappedCss, 'utf8');
console.log('Fixed template-16.css scoping');
