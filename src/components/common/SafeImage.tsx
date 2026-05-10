import Image, { ImageProps } from "next/image";

const allowedHosts = [
  "lh3.googleusercontent.com",
  "yt3.googleusercontent.com",
  "yt3.ggpht.com",
  "i.ytimg.com",
  "music.youtube.com",
  "images.unsplash.com",
];

function isAllowedImage(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/") || src.startsWith("data:")) return true; // Relative paths and base64 sources are allowed
  try {
    const url = new URL(src);
    return allowedHosts.includes(url.hostname);
  } catch {
    return true; // Fallback to Next.js image for invalid URLs to let Next.js handle it
  }
}

export function SafeImage(props: ImageProps) {
  const src = String(props.src || "");

  if (!isAllowedImage(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={props.alt ?? ""}
        className={props.className}
        width={typeof props.width === "number" ? props.width : undefined}
        height={typeof props.height === "number" ? props.height : undefined}
        style={props.style}
        loading={props.loading}
      />
    );
  }

  return <Image {...props} />;}
