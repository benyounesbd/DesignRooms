import View2D from "./components/View2D";
import View3D from "./components/View3D";
import Settings from "./components/Settings";

function App() {
  return (
    <>
      <div className="bg-black text-white w-full h-full flex p-10">
        <div>
          <h1>Design rooms</h1>
          <View2D />
        </div>
        <div className=" m-10">
          <View3D />
          <Settings />
        </div>
      </div>
    </>
  );
}

export default App;
