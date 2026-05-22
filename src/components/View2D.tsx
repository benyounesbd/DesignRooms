import { useEffect, useRef } from "react";
import {
  configureCanvas,
  getDevice,
  GRID_CONFIG,
  cellStates,
} from "../utils/main";

function View2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const device = getDevice();

    const { context, format } = configureCanvas(canvasRef.current);

    console.log("2D canvas ready");

    const { COLUMNS, ROWS } = GRID_CONFIG;
    const totalCells = GRID_CONFIG.COLUMNS * GRID_CONFIG.ROWS;

    // Enviamos los 4 datos empaquetados en un vec4f (16 bytes)
    const uniformArray = new Float32Array([COLUMNS, ROWS]);

    const uniformBuffer = device.createBuffer({
      label: "Grid Uniforms",
      size: uniformArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

    const storageBuffer = device.createBuffer({
      label: "Cell States Storage 2D",
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
      label: "Cell vertices",
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
            2.0 / rows
          );

          let normalizedPos = (pos + 1.0) / 2.0;

          let scaledPos = normalizedPos * cellSize;

          let cellOrigin = vec2f(-1.0, -1.0) + vec2f(col * cellSize.x, row * cellSize.y) ;

          // let finalPos = cellOrigin + scaledPos;

          var output: VertexOutput;
          output.position = vec4f(cellOrigin + scaledPos, 0.0, 1.0);
          output.cellState = cellStates[instance];
          return output;
        }

        @fragment
        fn fragmentMain(@location(0) @interpolate(flat) cellState: i32) -> @location(0) vec4f {
          if (cellState == 1) {
            return vec4f(1.0, 0.0, 0.0, 1.0); // Cuadrado vacío -> Rojo
          }
            return vec4f(1.0, 1.0, 1.0, 1.0); // Cuadrado activo -> Blanco
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
      label: "Cell renderer bind group",
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

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      const col = Math.floor((clickX / rect.width) * COLUMNS);
      const row = Math.floor(((rect.height - clickY) / rect.height) * ROWS);

      if (col >= 0 && col < COLUMNS && row >= 0 && row < ROWS) {
        const index = row * COLUMNS + col;

        cellStates[index] = cellStates[index] === 0 ? 1 : 0;
        console.log(
          `Celda [Fila: ${row}, Columna: ${col}] -> Estado actual: ${cellStates[index]} (Índice array: ${index})`,
        );

        device.queue.writeBuffer(storageBuffer, 0, cellStates);
      }
    };

    canvas.addEventListener("click", handleCanvasClick);

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
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, []);

  return <canvas ref={canvasRef} width={900} height={450} />;
}

export default View2D;
