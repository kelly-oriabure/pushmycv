/**
 * Utility function to convert common Tailwind classes to inline styles
 * This helps with PDF generation where Tailwind CSS may not be properly loaded
 */

interface StyleMap {
  [key: string]: string | React.CSSProperties;
}

// Common Tailwind to CSS mappings
const tailwindToCssMap: StyleMap = {
  // Background colors
  'bg-white': { backgroundColor: '#ffffff' },
  'bg-black': { backgroundColor: '#000000' },
  'bg-gray-50': { backgroundColor: '#f9fafb' },
  'bg-gray-100': { backgroundColor: '#f3f4f6' },
  'bg-gray-200': { backgroundColor: '#e5e7eb' },
  'bg-gray-300': { backgroundColor: '#d1d5db' },
  'bg-gray-400': { backgroundColor: '#9ca3af' },
  'bg-gray-500': { backgroundColor: '#6b7280' },
  'bg-gray-600': { backgroundColor: '#4b5563' },
  'bg-gray-700': { backgroundColor: '#374151' },
  'bg-gray-800': { backgroundColor: '#1f2937' },
  'bg-gray-900': { backgroundColor: '#111827' },
  'bg-red-500': { backgroundColor: '#ef4444' },
  'bg-blue-500': { backgroundColor: '#3b82f6' },
  'bg-green-500': { backgroundColor: '#10b981' },
  'bg-yellow-500': { backgroundColor: '#eab308' },
  'bg-indigo-500': { backgroundColor: '#6366f1' },
  'bg-purple-500': { backgroundColor: '#a855f7' },
  'bg-pink-500': { backgroundColor: '#ec4899' },
  
  // Text colors
  'text-white': { color: '#ffffff' },
  'text-black': { color: '#000000' },
  'text-gray-50': { color: '#f9fafb' },
  'text-gray-100': { color: '#f3f4f6' },
  'text-gray-200': { color: '#e5e7eb' },
  'text-gray-300': { color: '#d1d5db' },
  'text-gray-400': { color: '#9ca3af' },
  'text-gray-500': { color: '#6b7280' },
  'text-gray-600': { color: '#4b5563' },
  'text-gray-700': { color: '#374151' },
  'text-gray-800': { color: '#1f2937' },
  'text-gray-900': { color: '#111827' },
  'text-red-500': { color: '#ef4444' },
  'text-blue-500': { color: '#3b82f6' },
  'text-green-500': { color: '#10b981' },
  'text-yellow-500': { color: '#eab308' },
  'text-indigo-500': { color: '#6366f1' },
  'text-purple-500': { color: '#a855f7' },
  'text-pink-500': { color: '#ec4899' },
  
  // Font weights
  'font-thin': { fontWeight: '100' },
  'font-extralight': { fontWeight: '200' },
  'font-light': { fontWeight: '300' },
  'font-normal': { fontWeight: '400' },
  'font-medium': { fontWeight: '500' },
  'font-semibold': { fontWeight: '600' },
  'font-bold': { fontWeight: '700' },
  'font-extrabold': { fontWeight: '800' },
  'font-black': { fontWeight: '900' },
  
  // Text alignment
  'text-left': { textAlign: 'left' },
  'text-center': { textAlign: 'center' },
  'text-right': { textAlign: 'right' },
  'text-justify': { textAlign: 'justify' },
  
  // Padding
  'p-0': { padding: '0px' },
  'p-1': { padding: '0.25rem' },
  'p-2': { padding: '0.5rem' },
  'p-3': { padding: '0.75rem' },
  'p-4': { padding: '1rem' },
  'p-5': { padding: '1.25rem' },
  'p-6': { padding: '1.5rem' },
  'p-8': { padding: '2rem' },
  'p-10': { padding: '2.5rem' },
  'p-12': { padding: '3rem' },
  'p-16': { padding: '4rem' },
  'p-20': { padding: '5rem' },
  'p-24': { padding: '6rem' },
  'p-32': { padding: '8rem' },
  'p-40': { padding: '10rem' },
  'p-48': { padding: '12rem' },
  'p-56': { padding: '14rem' },
  'p-64': { padding: '16rem' },
  
  // Margin
  'm-0': { margin: '0px' },
  'm-1': { margin: '0.25rem' },
  'm-2': { margin: '0.5rem' },
  'm-3': { margin: '0.75rem' },
  'm-4': { margin: '1rem' },
  'm-5': { margin: '1.25rem' },
  'm-6': { margin: '1.5rem' },
  'm-8': { margin: '2rem' },
  'm-10': { margin: '2.5rem' },
  'm-12': { margin: '3rem' },
  'm-16': { margin: '4rem' },
  'm-20': { margin: '5rem' },
  'm-24': { margin: '6rem' },
  'm-32': { margin: '8rem' },
  'm-40': { margin: '10rem' },
  'm-48': { margin: '12rem' },
  'm-56': { margin: '14rem' },
  'm-64': { margin: '16rem' },
  
  // Width
  'w-full': { width: '100%' },
  'w-1/2': { width: '50%' },
  'w-1/3': { width: '33.333333%' },
  'w-2/3': { width: '66.666667%' },
  'w-1/4': { width: '25%' },
  'w-3/4': { width: '75%' },
  
  // Display
  'block': { display: 'block' },
  'inline': { display: 'inline' },
  'inline-block': { display: 'inline-block' },
  'flex': { display: 'flex' },
  'hidden': { display: 'none' },

  // Flexbox
  'flex-row': { flexDirection: 'row' },
  'flex-col': { flexDirection: 'column' },
  'justify-start': { justifyContent: 'flex-start' },
  'justify-end': { justifyContent: 'flex-end' },
  'justify-center': { justifyContent: 'center' },
  'justify-between': { justifyContent: 'space-between' },
  'justify-around': { justifyContent: 'space-around' },
  'items-start': { alignItems: 'flex-start' },
  'items-end': { alignItems: 'flex-end' },
  'items-center': { alignItems: 'center' },
  'items-baseline': { alignItems: 'baseline' },
  'items-stretch': { alignItems: 'stretch' },
  'gap-1': { gap: '0.25rem' },
  'gap-2': { gap: '0.5rem' },
  'gap-4': { gap: '1rem' },
  'gap-5': { gap: '1.25rem' },
  'gap-6': { gap: '1.5rem' },
  'gap-8': { gap: '2rem' },
  'flex-grow': { flexGrow: '1' },

  // Sizing
  'w-1/5': { width: '20%' },
  'w-2/5': { width: '40%' },
  'w-3/5': { width: '60%' },
  'w-4/5': { width: '80%' },

  // Positioning
  'relative': { position: 'relative' },
  'absolute': { position: 'absolute' },

  // Border Radius
  'rounded-none': { borderRadius: '0px' },
  'rounded-sm': { borderRadius: '0.125rem' },
  'rounded': { borderRadius: '0.25rem' },
  'rounded-md': { borderRadius: '0.375rem' },
  'rounded-lg': { borderRadius: '0.5rem' },
  'rounded-xl': { borderRadius: '0.75rem' },
  'rounded-2xl': { borderRadius: '1rem' },
  'rounded-3xl': { borderRadius: '1.5rem' },
  'rounded-full': { borderRadius: '9999px' },

  // Sizing (continued)
  'w-16': { width: '4rem' },
  'h-16': { height: '4rem' },
  'w-20': { width: '5rem' },
  'h-20': { height: '5rem' },
  'w-24': { width: '6rem' },
  'h-24': { height: '6rem' },

  // Object Fit
  'object-cover': { objectFit: 'cover' },

  // Borders
  'border-2': { borderWidth: '2px' },
  'border-white': { borderColor: '#ffffff' },
};

/**
 * Converts Tailwind classes to inline styles
 * @param element - The HTML element to process
 */
export function convertTailwindToInlineStyles(element: HTMLElement) {
  // Process the element itself
  convertElementClasses(element);
  
  // Process all child elements
  const allElements = element.querySelectorAll('*');
  allElements.forEach(convertElementClasses);
}

/**
 * Converts Tailwind classes to inline styles for a single element
 * @param element - The HTML element to process
 */
function convertElementClasses(element: Element) {
  if (!(element instanceof HTMLElement)) return;
  
  const classes = element.className.split(' ').filter(Boolean);
  const stylesToAdd: React.CSSProperties = {};
  
  // Check each class against our mapping
  classes.forEach(className => {
    if (tailwindToCssMap[className]) {
      Object.assign(stylesToAdd, tailwindToCssMap[className]);
    }
  });
  
  // Apply the styles
  Object.entries(stylesToAdd).forEach(([property, value]) => {
    // Convert camelCase to kebab-case for CSS properties
    const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    element.style.setProperty(cssProperty, value as string);
  });
  
  // Remove processed Tailwind classes (optional)
  // const remainingClasses = classes.filter(className => !tailwindToCssMap[className]);
  // element.className = remainingClasses.join(' ');
}

/**
 * Creates a deep clone of an element with Tailwind classes converted to inline styles
 * @param element - The HTML element to clone and process
 * @returns A new HTML element with inline styles
 */
export function cloneWithInlineStyles(element: HTMLElement): HTMLElement {
  // Clone the element deeply
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Convert Tailwind classes to inline styles in the clone
  convertTailwindToInlineStyles(clone);
  
  return clone;
}