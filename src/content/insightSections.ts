/** Keep published guide anchors stable, including headings without ASCII letters. */
export const insightSectionId = (heading: string, index: number) => {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `section-${index + 1}`;
};
