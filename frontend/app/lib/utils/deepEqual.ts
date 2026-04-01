/**
 * Deep equality check utility to replace JSON.stringify comparisons
 * Optimized for resume data structures
 */

type Primitive = string | number | boolean | null | undefined;

function isPrimitive(value: any): value is Primitive {
  return value === null || value === undefined || typeof value !== 'object';
}

function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Performs deep equality comparison between two values
 * More efficient than JSON.stringify for object comparison
 */
export function deepEqual(a: any, b: any): boolean {
  // Reference equality check (fastest)
  if (a === b) return true;

  // Handle null/undefined cases
  if (a == null || b == null) return a === b;

  // Type check
  if (typeof a !== typeof b) return false;

  // Primitive types
  if (isPrimitive(a) || isPrimitive(b)) {
    return a === b;
  }

  // Array comparison
  if (isArray(a) && isArray(b)) {
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // One is array, other is not
  if (isArray(a) || isArray(b)) return false;

  // Object comparison
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Shallow equality check for simple objects
 * Faster than deep equality when only top-level properties matter
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}

/**
 * Optimized equality check for resume form data
 * Uses heuristics to choose between shallow and deep comparison
 */
export function resumeDataEqual(a: any, b: any): boolean {
  // For arrays or complex nested structures, use deep equality
  if (Array.isArray(a) || Array.isArray(b)) {
    return deepEqual(a, b);
  }

  // For simple objects, use shallow equality first
  if (typeof a === 'object' && typeof b === 'object' && a != null && b != null) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    // If objects have many properties, likely need deep comparison
    if (keysA.length > 5) {
      return deepEqual(a, b);
    }
    
    // Otherwise use shallow comparison
    return shallowEqual(a, b);
  }

  return a === b;
}