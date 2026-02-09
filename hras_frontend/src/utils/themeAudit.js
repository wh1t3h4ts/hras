/**
 * HRAS Theme Audit Utility
 * Detects leftover dark theme classes in light-themed content areas
 * 
 * Usage: Add to App.jsx:
 * 
 * import { auditThemeClasses, checkContrast } from './utils/themeAudit';
 * 
 * useEffect(() => {
 *   if (process.env.NODE_ENV === 'development') {
 *     setTimeout(() => {
 *       auditThemeClasses();
 *       checkContrast();
 *     }, 2000);
 *   }
 * }, []);
 * 
 * Remove this file before production deployment
 */

export const auditThemeClasses = () => {
  const darkClasses = [
    'bg-slate-800', 'bg-slate-900', 'bg-slate-950',
    'text-slate-100', 'text-slate-200', 'text-slate-300', 'text-slate-400',
    'border-slate-700', 'border-slate-800', 'border-slate-600',
    'hover:bg-slate-800', 'hover:bg-slate-700',
    'placeholder-slate-400'
  ];

  const issues = [];

  // Get all elements except sidebar/navbar
  const allElements = document.querySelectorAll('*:not(.sidebar):not(.sidebar *)');

  allElements.forEach(el => {
    const classList = Array.from(el.classList);
    
    darkClasses.forEach(darkClass => {
      if (classList.some(c => c.includes(darkClass.replace(':', '')))) {
        // Skip if element is inside sidebar
        if (!el.closest('aside') && !el.closest('[class*="sidebar"]')) {
          issues.push({
            element: el.tagName,
            class: darkClass,
            text: el.textContent?.substring(0, 30) || '',
            path: getElementPath(el)
          });
        }
      }
    });
  });

  if (issues.length > 0) {
    console.group('🎨 Theme Audit: Found ' + issues.length + ' potential issues');
    issues.forEach(issue => {
      console.warn(`${issue.element} → ${issue.class}`, issue.path);
    });
    console.groupEnd();
  } else {
    console.log('✅ Theme Audit: No dark classes found in light content areas');
  }

  return issues;
};

// Helper to get element path
const getElementPath = (el) => {
  const path = [];
  let current = el;
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) selector += `#${current.id}`;
    if (current.className) {
      const classes = current.className.split(' ').slice(0, 2).join('.');
      if (classes) selector += `.${classes}`;
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
};

// Contrast checker
export const checkContrast = () => {
  const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button, a');
  const lowContrast = [];

  textElements.forEach(el => {
    const style = window.getComputedStyle(el);
    const color = style.color;
    const bgColor = style.backgroundColor;
    
    if (color && bgColor && !bgColor.includes('rgba(0, 0, 0, 0)')) {
      const contrast = getContrastRatio(color, bgColor);
      if (contrast < 4.5) {
        lowContrast.push({
          element: el.tagName,
          text: el.textContent?.substring(0, 30),
          contrast: contrast.toFixed(2)
        });
      }
    }
  });

  if (lowContrast.length > 0) {
    console.group('⚠️ Contrast Issues: ' + lowContrast.length + ' elements');
    lowContrast.slice(0, 10).forEach(item => {
      console.warn(`${item.element}: ${item.text} (${item.contrast}:1)`);
    });
    console.groupEnd();
  }

  return lowContrast;
};

const getContrastRatio = (color1, color2) => {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

const getLuminance = (color) => {
  const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
  const [r, g, b] = rgb.map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
