export const cleanSourceHref = (href?: string) => {
  if (!href) return "";
  try {
    const url = new URL(href);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
};
