import View2D from "./components/View2D";
import View3D from "./components/View3D";
import Settings from "./components/Settings";

import { useEffect, useState } from "react";
import { initDevice } from "./utils/main";

function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initDevice().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="bg-black text-white w-full h-screen flex items-center justify-center">
        Loading WebGPU...
      </div>
    );
  }

  return (
    <div className="bg-black text-white w-full h-screen grid grid-cols-3 grid-rows-[auto_1fr_1fr] gap-4 p-4">
      <h1 className="col-span-3">Design rooms</h1>

      <div className="col-span-2 row-span-2">
        <View3D />
      </div>

      <div className="col-span-1">
        <View2D />
      </div>

      <div className="col-span-1 ">
        <Settings />
      </div>
    </div>
  );
}

export default App;
