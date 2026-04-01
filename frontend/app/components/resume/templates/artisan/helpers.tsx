export const hasContent = (data: any): boolean => {
  if (!data) return false;
  if (typeof data === 'string') return data.trim() !== '';
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    return data.some(item => hasContent(item));
  }
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).some(([key, value]) => {
      // Exclude specific keys from the check if necessary
      if (key === 'hideReferences') return false;
      return hasContent(value);
    });
  }
  return false;
};
