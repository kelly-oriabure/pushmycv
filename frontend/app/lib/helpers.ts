export const hasContent = (data: unknown): boolean => {
  if (!data) return false;
  if (typeof data === 'string') return data.trim() !== '';
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    // Check if at least one item in the array has content.
    return data.some(item => hasContent(item));
  }
  if (typeof data === 'object' && data !== null) {
    // Check if at least one value in the object has content.
    return Object.entries(data).some(([key, value]) => {
        // Exclude keys that are flags or settings, not user content.
        if (key === 'hideReferences' || key === 'isNewUser') return false; 
        return hasContent(value);
    });
  }
  // For other types like numbers or booleans, if they exist, they are content.
  return true;
};
