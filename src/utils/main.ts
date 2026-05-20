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

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.4, a: 1 }, // New line
        storeOp: "store",
      },
    ],
  });

  pass.end();
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
  device.queue.submit([encoder.finish()]);

  return { context, format };
}
