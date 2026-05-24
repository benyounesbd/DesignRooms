import { useEffect, useRef } from "react";
import {
  configureCanvas,
  getDevice,
  GRID_CONFIG,
  cellStates,
} from "../utils/main";

function View3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const device = getDevice();

    const { context, format } = configureCanvas(canvasRef.current);

    console.log("3D canvas ready");

    const { COLUMNS, ROWS } = GRID_CONFIG;

    const uniformArray = new Float32Array([COLUMNS, ROWS]);

    const uniformBuffer = device.createBuffer({
      label: "Grid Uniforms 3D",
      size: uniformArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

    const storageBuffer = device.createBuffer({
      label: "Cell States Storage 3D",
      size: cellStates.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(storageBuffer, 0, cellStates);

    const vertices = new Float32Array([
      //   X,    Y,
      -0.9, -0.9, 0.9, -0.9, 0.9, 0.9,

      -0.9, -0.9, 0.9, 0.9, -0.9, 0.9,
    ]);

    const vertexBuffer = device.createBuffer({
      label: "Cell vertices 3D",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 8,
      attributes: [
        {
          format: "float32x2",
          offset: 0,
          shaderLocation: 0,
        },
      ],
    };

    const cellShaderModule = device.createShaderModule({
      label: "Cell shader",
      code: `
        @group(0) @binding(0) var<uniform> grid: vec2f;
        @group(0) @binding(1) var<storage, read> cellStates: array<i32>;

        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0)  @interpolate(flat) cellState: i32,
        }

        @vertex
        fn vertexMain(@location(0) pos: vec2f,
                      @builtin(instance_index) instance: u32) -> VertexOutput {

          let i = f32(instance);
          
          let cols = grid.x;
          let rows = grid.y;

          let col = i % cols;
          let row = floor(i / cols);

          let cellSize = vec2f(
            (2.0 / cols) , 
            2.0 / cols
          );

          let normalizedPos = (pos / 2.0) + 2.5;

          let scaledPos = normalizedPos * cellSize;

          let cellOrigin = vec2f(-1.0, -1.0) + vec2f(col * cellSize.x, row * cellSize.y) ;

          let currentPos = cellOrigin + scaledPos;

          let s45 = 0.70710678;
          let rotatedX = currentPos.x * s45 + currentPos.y * s45; //rotacion
          let rotatedY = (-currentPos.x  * s45 + currentPos.y * s45) * 0.5; //inclinacion perspectiva + rotacion


          let viewScale = 0.9; //Hacerlo dinamico

          var output: VertexOutput;
          output.position = vec4f(rotatedX * viewScale, (rotatedY * viewScale) + 0.2, 0.0, 1.0);
          output.cellState = cellStates[instance];
          return output;
        }

        @fragment
        fn fragmentMain(@location(0) @interpolate(flat) cellState: i32) -> @location(0) vec4f {
          var color = vec3f(0.0, 0.0, 0.0);

          if (cellState == 1) {
            color = vec3f(1.0, 1.0, 1.0);
          }

          return vec4f(color, 1.0);
        }
      `,
    });

    const pipeline = device.createRenderPipeline({
      label: "Cell pipeline",
      layout: "auto",
      vertex: {
        module: cellShaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: cellShaderModule,
        entryPoint: "fragmentMain",
        targets: [
          {
            format: format,
          },
        ],
      },
    });

    const bindGroup = device.createBindGroup({
      label: "3D bind group",
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: storageBuffer },
        },
      ],
    });

    let animationId: number;

    function frame() {
      if (!context) return;
      device.queue.writeBuffer(storageBuffer, 0, cellStates);

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
      pass.setVertexBuffer(0, vertexBuffer);
      pass.setBindGroup(0, bindGroup);
      pass.draw(vertices.length / 2, COLUMNS * ROWS);
      pass.end();

      device.queue.submit([encoder.finish()]);
      animationId = requestAnimationFrame(frame);
    }
    animationId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} width={900} height={450} />;
}

export default View3D;
