import { useEffect, useRef } from "react";
import { mat4, vec3 } from "gl-matrix";
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

    const projectionMatrix = mat4.create();
    const orthoSize = 2.0;
    const aspect = canvas.width / canvas.height;

    mat4.ortho(
      projectionMatrix,
      -orthoSize * aspect,
      orthoSize * aspect,
      orthoSize,
      -orthoSize,
      -100.0,
      100.0,
    );

    const viewMatrix = mat4.create();
    mat4.lookAt(
      viewMatrix,
      vec3.fromValues(3.0, 3.0, 3.0),
      vec3.fromValues(0.0, 0.0, 0.0),
      vec3.fromValues(0.0, 1.0, 0.0),
    );

    const viewProjArray = new Float32Array(32);
    viewProjArray.set(projectionMatrix, 0);
    viewProjArray.set(viewMatrix, 16);

    const gridUniformsArray = new Float32Array([COLUMNS, ROWS, 0.0, 0.0]);

    const uniformArray = new Float32Array(
      viewProjArray.length + gridUniformsArray.length,
    );

    uniformArray.set(viewProjArray, 0);
    uniformArray.set(gridUniformsArray, viewProjArray.length);

    const uniformBuffer = device.createBuffer({
      label: "3D Camera Uniforms",
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
      // XYZ
      // Frente
      -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.5, 0.5,
      0.5, 0.0, 0.0, 1.0, -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0,
      0.0, 1.0, -0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
      // Atrás
      -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 0.5,
      -0.5, -0.5, 0.0, 0.0, -1.0, -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, -0.5, 0.5,
      -0.5, 0.0, 0.0, -1.0, 0.5, 0.5, -0.5, 0.0, 0.0, -1.0,
      // Techo
      -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.5, 0.5,
      -0.5, 0.0, 1.0, 0.0, -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, -0.5, 0.5, 0.5, 0.0,
      1.0, 0.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0,
      // Suelo
      -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.5,
      -0.5, 0.5, 0.0, -1.0, 0.0, -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.5, -0.5,
      0.5, 0.0, -1.0, 0.0, -0.5, -0.5, 0.5, 0.0, -1.0, 0.0,
      // Derecha
      0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 0.5, -0.5,
      0.5, 1.0, 0.0, 0.0, 0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.5, 0.5, -0.5, 1.0,
      0.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.0, 0.0,
      // Izquierda
      -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, -0.5, -0.5, 0.5, -1.0, 0.0, 0.0, -0.5,
      0.5, 0.5, -1.0, 0.0, 0.0, -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, -0.5, 0.5,
      0.5, -1.0, 0.0, 0.0, -0.5, 0.5, -0.5, -1.0, 0.0, 0.0,
    ]);

    const vertexBuffer = device.createBuffer({
      label: "Cell vertices 3D",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 24,
      attributes: [
        { format: "float32x3", offset: 0, shaderLocation: 0 },
        { format: "float32x3", offset: 12, shaderLocation: 1 }, // Normal
      ],
    };

    const cellShaderModule = device.createShaderModule({
      label: "Cell shader",
      code: `
        struct Uniforms {
          projection: mat4x4f,
          view: mat4x4f,
        }

        @group(0) @binding(0) var<uniform> uniforms: Uniforms;

        struct VertexOutput {
          @builtin(position) position: vec4f,
        }

        @vertex
        fn vertexMain(@location(0) pos: vec3f, @location(1) normal: vec3f) -> VertexOutput {
          var out: VertexOutput;
          // Aplicamos las matrices al cubo
          out.position = uniforms.projection * uniforms.view * vec4f(pos, 1.0);
          return out;
        }

        @fragment
        fn fragmentMain() -> @location(0) vec4f {
          // Color básico azul sin depender de datos de entrada
          return vec4f(0.0, 0.6, 1.0, 1.0); 
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

      pass.draw(36, 1);
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
