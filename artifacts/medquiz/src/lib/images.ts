function drawToJpeg(
  image: HTMLImageElement,
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  paint(ctx, canvas);
  return canvas.toDataURL('image/jpeg', 0.74);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Rasm ochilmadi'));
    image.src = src;
  });
}

export async function fileToImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Faqat rasm fayli');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Fayl o‘qilmadi'));
    reader.readAsDataURL(file);
  });
  const image = await loadImage(dataUrl);
  const max = 720;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  return drawToJpeg(image, width, height, (ctx) => ctx.drawImage(image, 0, 0, width, height));
}

export async function rotateImage(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl);
  return drawToJpeg(image, image.height, image.width, (ctx, canvas) => {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
  });
}
