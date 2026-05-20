import { useEffect, useRef } from "react";
import { configureCanvas, getDevice } from "../utils/main";

function View2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const device = getDevice();

    const { context, format } = configureCanvas(canvasRef.current);

    console.log("2D canvas ready");

    const shader = device.createShaderModule({
      code: `
        @vertex
        fn vs(@builtin(vertex_index) i : u32)
          -> @builtin(position) vec4f {

          var pos = array<vec2f, 6>(
            vec2f(-0.5, -0.5),
            vec2f( 0.5, -0.5),
            vec2f(-0.5,  0.5),

            vec2f(-0.5,  0.5),
            vec2f( 0.5, -0.5),
            vec2f( 0.5,  0.5)
          );

          return vec4f(pos[i], 0.0, 1.0);
        }

        @fragment
        fn fs() -> @location(0) vec4f {
          return vec4f(1.0, 0.0, 0.0, 1.0);
        }
      `,
    });

    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: shader, entryPoint: "vs" },
      fragment: { module: shader, entryPoint: "fs", targets: [{ format }] },
      primitive: { topology: "triangle-list" },
    });

    let animationId: number;

    function frame() {
      const encoder = device.createCommandEncoder();

      const view = context.getCurrentTexture().createView();

      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view,
            loadOp: "clear",
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            storeOp: "store",
          },
        ],
      });

      pass.setPipeline(pipeline);
      pass.draw(6);
      pass.end();

      device.queue.submit([encoder.finish()]);
      animationId = requestAnimationFrame(frame);
    }
    animationId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} width={900} height={450} />;
}

export default View2D;
