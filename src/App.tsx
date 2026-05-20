import View2D from "./components/View2D";
import View3D from "./components/View3D";
import Settings from "./components/Settings";

function App() {
  return (
    <div className="bg-black text-white w-full h-screen grid grid-cols-3 grid-rows-[auto_1fr_1fr] gap-4 p-4">
      {/* NAME (full top row) */}
      <h1 className="col-span-3">Design rooms</h1>

      {/* TEST (big left block: 2 rows, 2 cols) */}
      <div className="col-span-2 row-span-2">
        <View2D />
      </div>

      {/* GG (top-right of middle area) */}
      <div className="col-span-1">
        <View3D />
      </div>

      {/* SET (bottom-right) */}
      <div className="col-span-1 ">
        <Settings />
      </div>
    </div>
  );
}

export default App;
