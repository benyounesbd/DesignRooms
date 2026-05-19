import { useEffect, useRef } from "react";
import { initDevice, configureCanvas } from "../utils/main";

function View3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function setup() {
      if (!canvasRef.current) return;

      await initDevice();

      configureCanvas(canvasRef.current);

      console.log("3D canvas ready");
    }

    setup();
  }, []);

  return (
    <>
      <canvas ref={canvasRef} width="450" height="225" />
    </>
  );
}

export default View3D;
