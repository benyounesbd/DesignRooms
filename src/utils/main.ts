export let device: GPUDevice;

export async function initDevice() {
  if (device) return device;

  const adapter = await navigator.gpu.requestAdapter();

  if (!adapter) {
    throw new Error("WebGPU not supported");
  }

  device = await adapter.requestDevice();

  return device;
}

export function configureCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("webgpu") as GPUCanvasContext;

  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
  });

  return { context, format };
}
