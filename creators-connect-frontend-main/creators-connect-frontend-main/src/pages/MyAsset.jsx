import { useEffect, useState } from "react";
import { getMyAssets } from "../api/assetApi";

const MyAssets = () => {

    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const data = await getMyAssets({ page: 1 });
            setAssets(data.assets || []);
        } catch (error) {
            console.error("Error fetching assets:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold mb-6 text-[#E5E7EB]">
                My Assets
            </h2>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-[#9CA3AF]">Loading...</p>
                </div>
            ) : assets.length === 0 ? (
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
                                    className="h-48 w-full object-cover"
                                    alt={asset.title}
                                />
                            ) : (
                                <video
                                    className="h-48 w-full object-cover"
                                    controls
                                    autoPlay
                                    muted
                                >
                                    <source src={asset.url} type="video/mp4" />
                                </video>
                            )}

                            <div className="p-4">
                                <h3 className="font-semibold text-[#E5E7EB]">
                                    {asset.title}
                                </h3>

                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${asset.visibility === "public"
                                        ? "bg-[#10B981]/20 text-[#10B981]"
                                        : "bg-[#374151] text-[#E5E7EB]"
                                        }`}
                                >
                                    {asset.visibility}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default MyAssets;
