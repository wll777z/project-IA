import sharp from "sharp";
import { HttpError } from "@/lib/http";
export const MAX_UPLOAD = 4 * 1024 * 1024;
export async function processImage(
  input: Buffer,
  mime: string,
  kind: "avatar" | "background",
) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime))
    throw new HttpError(
      415,
      "Envie PNG, JPG ou WebP. SVG e GIF não são aceitos.",
    );
  if (!input.length || input.length > MAX_UPLOAD)
    throw new HttpError(413, "Use uma imagem de até 4 MB.");
  try {
    const image = sharp(input, {
      limitInputPixels: 16000000,
      animated: false,
      failOn: "warning",
    });
    const meta = await image.metadata();
    const expected = {
      "image/png": "png",
      "image/jpeg": "jpeg",
      "image/webp": "webp",
    }[mime];
    if (
      meta.format !== expected ||
      (meta.pages ?? 1) > 1 ||
      !meta.width ||
      !meta.height
    )
      throw new Error("Formato inválido");
    const { data, info } = await image
      .rotate()
      .resize(kind === "avatar" ? 512 : 1600, kind === "avatar" ? 512 : 900, {
        fit: kind === "avatar" ? "cover" : "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    if (data.length > 1024 * 1024)
      throw new HttpError(413, "Imagem muito complexa. Escolha outra menor.");
    return {
      content: data,
      mimeType: "image/webp",
      width: info.width,
      height: info.height,
    };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(
      400,
      "Não foi possível ler essa imagem. Use um PNG, JPG ou WebP válido.",
    );
  }
}
