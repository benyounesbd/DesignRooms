import { useEffect, useRef } from "react";
import { initDevice, configureCanvas } from "../utils/main";

function View2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function setup() {
      if (!canvasRef.current) return;

      await initDevice();

      configureCanvas(canvasRef.current);

      console.log("2D canvas ready");
    }

    setup();
  }, []);

  return (
    <>
      <canvas ref={canvasRef} width="900" height="450" />
    </>
  );
}

export default View2D;
