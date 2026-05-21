export let device: GPUDevice;

export async function initDevice() {
  if (device) return device;

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("No GPU adapter");

  device = await adapter.requestDevice();
  return device;
}

export function getDevice() {
  if (!device) throw new Error("Device not initialized");
  return device;
}

export function configureCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("webgpu") as GPUCanvasContext;

  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });

  return { context, format };
}

export const GRID_CONFIG = {
  COLUMNS: 16,
  ROWS: 8,
};

export const cellStates = new Int32Array(
  GRID_CONFIG.COLUMNS * GRID_CONFIG.ROWS,
);
