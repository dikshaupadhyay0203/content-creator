import { useEffect, useState } from "react";
import { getPublicAssets } from "../api/assetApi";

const Dashboard = () => {

  const [assets, setAssets] = useState([]);

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

  return (
    <>
      <h2 className="text-3xl font-bold mb-6">
        Explore Public Assets
      </h2>

      {assets.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No assets found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {assets.map(asset => (
            <div
              key={asset._id}
              className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition"
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
                <h3 className="font-semibold text-lg">
                  {asset.title}
                </h3>
                <p className="text-sm text-gray-500">
                  By {asset.owner?.name || "Unknown"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Dashboard;
