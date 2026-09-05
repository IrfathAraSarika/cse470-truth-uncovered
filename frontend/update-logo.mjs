import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/Shaik/Desktop/TU/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const newLogoHtml = `<Link to="/" className="flex items-center gap-3">
            <LogoIcon />
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </Link>`;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Case 1: LandingPage.tsx
  if (file === 'LandingPage.tsx') {
    const landingOldLogo = `<div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#ff5634]/40 bg-[#ff5634]/10">
              <span className="absolute w-5 h-5 rounded-full border border-[#ff5634] animate-ping opacity-45" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5634]" />
            </div>
            <span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>
          </div>`;
    
    if (content.includes(landingOldLogo)) {
      content = content.replace(landingOldLogo, newLogoHtml);
      if (!content.includes('LogoIcon')) {
        content = `import { LogoIcon } from '../components/AppIcons';\n` + content;
      }
      changed = true;
    }
  } 
  // Case 2: Other pages with standard logo
  else {
    const standardLogoRegex = /<Link to="\/" className="flex items-center gap-3">\s*<LogoIcon \/>\s*<span className="font-sora font-bold">Truth Uncovered<\/span>\s*<\/Link>/g;
    
    if (standardLogoRegex.test(content)) {
      content = content.replace(standardLogoRegex, newLogoHtml);
      changed = true;
    }
    
    // Login and Signup pages might have a slightly different one
    const loginSignupRegex = /<span className="font-sora font-bold text-lg tracking-tight">Truth Uncovered<\/span>/g;
    if (loginSignupRegex.test(content)) {
      content = content.replace(loginSignupRegex, `<span className="font-['Sora'] font-bold text-lg tracking-tight text-white">
              Truth <span className="text-[#ffb4a4]">Uncovered</span>
            </span>`);
      changed = true;
    }
    const myReportsRegex = /<span className="font-sora font-bold text-white">Truth Uncovered<\/span>/g;
    if (myReportsRegex.test(content)) {
      content = content.replace(myReportsRegex, `<span className="font-['Sora'] font-bold text-lg tracking-tight text-white">Truth <span className="text-[#ffb4a4]">Uncovered</span></span>`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
}
