// View3D.tsx
import { useEffect, useRef } from "react";
import { getDevice, configureCanvas } from "../utils/main";

function View3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const device = getDevice();
    const { context } = configureCanvas(canvasRef.current);

    let animationId: number;

    function frame() {
      if (!context) return;

      const encoder = device.createCommandEncoder();
      const view = context.getCurrentTexture().createView();

      // Aquí solo limpiamos la pantalla, no vinculamos ningún pipeline de cuadrado rojo
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view,
            loadOp: "clear",
            clearValue: { r: 0.0, g: 0.0, b: 0, a: 1 }, // Fondo Azul
            storeOp: "store",
          },
        ],
      });
      pass.end();

      device.queue.submit([encoder.finish()]);
      animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={450}
      height={225}
      className="w-full h-full"
    />
  );
}

export default View3D;
