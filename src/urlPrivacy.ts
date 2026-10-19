const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const containsPotentialPersonalData = (value: string) => {
  const decoded = safeDecode(value).trim();
  if (!decoded) return false;
  if (/\b(?:mailto|tel):/i.test(decoded) || emailPattern.test(decoded)) return true;

  const digits = decoded.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

// Accept an already-decoded ID; DOM existence is checked by the browser caller.
export const isPublicFragmentId = (fragmentId: string) => /^[a-z0-9][a-z0-9_-]{0,159}$/i.test(fragmentId)
  && !containsPotentialPersonalData(fragmentId);
