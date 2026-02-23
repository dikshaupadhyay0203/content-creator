import { useEffect, useState } from "react";
import { getPublicAssets } from "../api/assetApi";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const { user } = useAuth();
  const { socket, startDirectMessage } = useSocket();
  const navigate = useNavigate();
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const data = await getPublicAssets({ page: 1 });
      setAssets(data.assets || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  const handleChatClick = (asset) => {
    if (asset.owner?._id && currentUserId && asset.owner?._id !== currentUserId) {
      const roomId = [currentUserId, asset.owner._id].sort().join("_dm_");

      console.log("Starting DM with:", asset.owner.name, "roomId:", roomId);

      // Call startDirectMessage to create the DM room on the server
      if (socket) {
        let hasNavigated = false;

        startDirectMessage({ id: asset.owner._id, name: asset.owner.name });

        // Listen for the room creation response
        socket.once("directMessageRoomCreated", (data) => {
          hasNavigated = true;
          console.log("DM Room created, navigating:", data);
          navigate("/chat", {
            state: {
              directMessage: true,
              roomId: data.roomId,
              recipientId: asset.owner._id,
              recipientName: asset.owner.name
            }
          });
        });

        // Fallback: navigate after a short delay if no response
        setTimeout(() => {
          if (hasNavigated) return;
          navigate("/chat", {
            state: {
              directMessage: true,
              roomId: roomId,
              recipientId: asset.owner._id,
              recipientName: asset.owner.name
            }
          });
        }, 500);
      } else {
        // If socket not available, navigate anyway
        navigate("/chat", {
          state: {
            directMessage: true,
            roomId: roomId,
            recipientId: asset.owner._id,
            recipientName: asset.owner.name
          }
        });
      }
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-[#E5E7EB]">
        Explore Public Assets
      </h2>

      {assets.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-[#9CA3AF]">No assets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {assets.map(asset => (
            <div
              key={asset._id}
              className="bg-[#1F2937] rounded-xl shadow-md overflow-hidden h-full flex flex-col hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out"
            >
              {asset.type === "image" ? (
                <img
                  src={asset.url}
                  alt={asset.title}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <video
                  src={asset.url}
                  className="h-48 w-full object-cover"
                  controls
                />
              )}

              <div className="p-4">
                <h3 className="font-semibold text-lg text-[#E5E7EB]">
                  {asset.title}
                </h3>
                <p className="text-sm text-[#9CA3AF] mb-3">
                  By {asset.owner?.name || "Unknown"}
                </p>

                {asset.owner?._id !== currentUserId && (
                  <div className="mt-2 pt-2 border-t border-[#374151] flex items-center justify-between">
                    <span className="text-xs text-[#9CA3AF]">
                      {asset.owner?.name || "Owner"}
                    </span>
                    <button
                      onClick={() => handleChatClick(asset)}
                      className="flex items-center gap-1 text-[#10B981] hover:text-[#059669] text-sm font-medium transition-all duration-300 ease-in-out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Chat
                    </button>
                  </div>
                )}

                {asset.owner?._id === currentUserId && (
                  <p className="text-xs text-[#9CA3AF] mt-2 pt-2 border-t border-[#374151]">
                    Your asset
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Dashboard;
