import { PROFILE_IMAGE_MAX_BYTES } from "@/lib/profile-images";

export const PROFILE_IMAGE_SOURCE_MAX_BYTES = 20 * 1024 * 1024;

const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.82;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image"));
    };
    image.src = objectUrl;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== "image/webp") {
          reject(new Error("WebP encoding is not supported"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      AVATAR_QUALITY
    );
  });
}

export async function prepareProfileImage(file: File): Promise<File> {
  const image = await loadImage(file);
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;
  const outputSize = Math.min(AVATAR_SIZE, sourceSize);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize
  );

  const blob = await canvasToWebp(canvas);
  if (blob.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error("Compressed image is too large");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "profile";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}
