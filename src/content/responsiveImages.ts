type ImageLayout = "hero" | "guidance";

type ResponsiveImageProps = {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
};

export const LIGHT_HOME_HERO_SRC = "/assets/home-light-hero-beach-sunrise.jpg";

const photographs = new Map([
  [LIGHT_HOME_HERO_SRC, { name: "home-beach", width: 4032, height: 3024, widths: [480, 960, 1440, 1920] }],
  ["/assets/live/philly-skyline-from-camden-city-camden-jpg.webp", { name: "home-skyline", width: 1500, height: 1125, widths: [480, 960, 1500] }],
  ["/assets/live/pitman-gloucester-jpg.webp", { name: "home-pitman", width: 1280, height: 750, widths: [480, 960, 1280] }],
]);

export function getResponsiveImageProps(src: string, layout: ImageLayout): ResponsiveImageProps {
  const image = photographs.get(src);
  if (!image) return { src };
  const variant = (width: number) => `/assets/responsive/${image.name}-${width}.webp`;
  return {
    src: variant(960),
    srcSet: image.widths.map((width) => `${variant(width)} ${width}w`).join(", "),
    sizes: layout === "hero" ? "(max-width: 900px) 100vw, 50vw" : "(max-width: 900px) 100vw, 40vw",
    width: image.width,
    height: image.height,
  };
}

export function buildHomeHeroPreloadScript({ lightSrc, darkSrc }: { lightSrc: string; darkSrc?: string }): string {
  const choices = {
    light: getResponsiveImageProps(lightSrc, "hero"),
    dark: darkSrc ? getResponsiveImageProps(darkSrc, "hero") : null,
  };
  const serialized = JSON.stringify(choices).replaceAll("<", "\\u003c");
  return `(() => {
    if (!window.matchMedia("(min-width: 901px)").matches) return;
    let theme = "light";
    try { if (window.localStorage.getItem("site-theme") === "dark") theme = "dark"; } catch {}
    const image = ${serialized}[theme];
    if (!image) return;
    const link = document.createElement("link");
    link.setAttribute("rel", "preload");
    link.setAttribute("as", "image");
    link.setAttribute("href", image.src);
    link.setAttribute("media", "(min-width: 901px)");
    link.setAttribute("fetchpriority", "high");
    if (image.srcSet) link.setAttribute("imagesrcset", image.srcSet);
    if (image.sizes) link.setAttribute("imagesizes", image.sizes);
    document.head.appendChild(link);
  })();`;
}
