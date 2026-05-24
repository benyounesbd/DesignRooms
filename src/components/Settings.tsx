import { useState } from "react";
import { ROOMS, updateCellStates } from "../utils/main";

function Settings() {
  const [selectedRoom, setSelectedRoom] = useState("room1");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const roomKey = event.target.value as keyof typeof ROOMS;
    setSelectedRoom(roomKey);

    updateCellStates(ROOMS[roomKey]);
  };
  return (
    <>
      <h1 className="text-3xl font-bold underline">Settings</h1>
      <div className="flex flex-col gap-2">
        <label htmlFor="rooms" className="text-sm font-semibold">
          Choose a room configuration:
        </label>

        <select
          name="rooms"
          id="rooms"
          value={selectedRoom}
          onChange={handleChange}
          className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          <option value="clear">Clear</option>
          <option value="room1">Room 1</option>
          <option value="room2">Room 2</option>
        </select>
      </div>
    </>
  );
}

export default Settings;
