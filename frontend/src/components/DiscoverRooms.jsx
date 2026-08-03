import { useState } from "react";
import { Users, MessageCircle, Clock, Flame, ArrowLeft } from "lucide-react";
import { timeAgo } from "../utils/time";

export default function DiscoverRooms({ rooms = [], onJoin = () => {}, onCreate, onBack }) {
  const [newRoom, setNewRoom] = useState("");

  const cleanName = newRoom.trim().toLowerCase().replace(/\s+/g, "");
  const canCreate = cleanName.length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    if (onCreate) {
      onCreate(cleanName);
    } else {
      onJoin(cleanName);
    }
    setNewRoom("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreate();
  };

  return (
    <div className="min-h-dvh bg-[#0d0d0d] flex justify-center p-5">
      <div className="w-full max-w-md">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#777] hover:text-white transition mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3">
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#333",
              }}
            >
              ✦ LOGAN
            </span>
          </div>

          <h1
            style={{ fontFamily: "'Syne', sans-serif" }}
            className="text-3xl font-bold text-white"
          >
            Discover Rooms
          </h1>

          <p className="text-[#555] mt-2">
            Find where everyone is chatting.
          </p>
        </div>

        {/* Featured */}
        {rooms.length > 0 && (
          <div className="rounded-2xl border border-[#333] bg-[#171717] p-5 mb-6">

            <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold mb-4">
              <Flame size={16} />
              FEATURED
            </div>

            <h2 className="text-2xl font-bold text-white">
              #{rooms[0].id}
            </h2>

            <div className="flex gap-5 mt-4 text-sm text-[#888]">
              <span className="flex items-center gap-1">
                <Users size={15} />
                {rooms[0].online}
              </span>

              <span className="flex items-center gap-1">
                <MessageCircle size={15} />
                {rooms[0].messages}
              </span>

              <span className="flex items-center gap-1">
                <Clock size={15} />
                {timeAgo(rooms[0].last_activity)}
              </span>
            </div>

            <button
              onClick={() => onJoin(rooms[0].id)}
              className="w-full mt-5 rounded-lg bg-white text-black font-semibold py-2.5 transition hover:bg-[#e5e5e5] active:scale-[0.98]"
            >
              Join Room
            </button>
          </div>
        )}

        {/* Trending */}
        {rooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2a2a2a] p-8 text-center">
            <p className="text-[#555] text-sm">
              No rooms yet. Create one below to get things started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {rooms.slice(1).map((room) => (
              <div
                key={room.id}
                className="rounded-xl border border-[#2a2a2a] bg-[#171717] p-4 transition hover:border-[#555]"
              >
                <div className="flex justify-between items-start">

                  <div>

                    <h3 className="text-lg font-semibold text-white">
                      #{room.id}
                    </h3>

                    <div className="flex gap-4 mt-3 text-sm text-[#777]">

                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {room.online}
                      </span>

                      <span className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        {room.messages}
                      </span>

                    </div>

                    <p className="text-xs text-[#555] mt-2">
                      {timeAgo(room.last_activity)}
                    </p>

                  </div>

                  <button
                    onClick={() => onJoin(room.id)}
                    className="text-sm text-white border border-[#444] rounded-lg px-3 py-1.5 transition hover:bg-white hover:text-black"
                  >
                    Join
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}

        {/* Create Room */}
        <div className="mt-8">

          <p className="text-xs uppercase tracking-widest text-[#555] mb-3">
            Create Room
          </p>

          <input
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="onepiece"
            className="w-full rounded-lg bg-[#171717] border border-[#2a2a2a] text-white placeholder-[#555] px-3 py-2.5 outline-none focus:border-[#555] transition"
          />

          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="w-full mt-3 rounded-lg bg-white text-black font-semibold py-2.5 transition hover:bg-[#e5e5e5] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            Create & Join
          </button>

        </div>

      </div>
    </div>
  );
}