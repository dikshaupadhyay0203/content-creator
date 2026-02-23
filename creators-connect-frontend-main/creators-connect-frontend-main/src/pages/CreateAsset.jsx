import { useState } from "react";
import { createAsset } from "../api/assetApi";
import { successToast, errorToast } from "../utils/toast";
import Button from "../components/Button";

const CreateAsset = () => {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  /* =========================
     HANDLE FILE SELECT
  ========================= */

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    if (
      !selectedFile.type.startsWith("image/") &&
      !selectedFile.type.startsWith("video/")
    ) {
      errorToast("Only image or video files allowed");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  /* =========================
     HANDLE DROP
  ========================= */

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  /* =========================
     HANDLE SUBMIT
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // prevent re-click

    if (!file) {
      errorToast("Please select a file");
      return;
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("visibility", visibility);
    formData.append("file", file);

    // Simulated progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      console.log("formadata", formData)
      await createAsset(formData);

      setProgress(100);

      successToast("Asset uploaded successfully!");

      // Reset
      setTitle("");
      setDescription("");
      setFile(null);
      setPreview(null);
      setVisibility("public");

    } catch (error) {
      errorToast(error.response?.data?.message);
    } finally {
      clearInterval(interval);

      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <>

      {/* 🔥 LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md text-center">

            <p className="text-lg font-semibold mb-4">
              Uploading Asset...
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-sm text-gray-500 mt-2">
              {progress}%
            </p>

          </div>
        </div>
      )}

      {/* MAIN FORM */}
      <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8">

        <h2 className="text-3xl font-bold mb-6">
          Upload New Asset
        </h2>

        <form
          onSubmit={handleSubmit}
          className={`space-y-6 ${loading ? "pointer-events-none opacity-60" : ""}`}
        >

          {/* Title */}
          <div>
            <label className="block mb-1 font-medium">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-4">
            <label className="font-medium">
              Visibility:
            </label>

            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="border rounded-lg px-3 py-1"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Drag & Drop */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
          >
            <p className="text-gray-500">
              Drag & Drop image or video here
            </p>

            <p className="text-sm text-gray-400 mt-2">
              or
            </p>

            <label className="text-blue-600 font-medium cursor-pointer">
              Browse Files
              <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mt-4">
              <p className="font-medium mb-2">Preview:</p>

              {file.type.startsWith("image/") ? (
                <img
                  src={preview}
                  alt="preview"
                  className="rounded-lg max-h-60 object-contain"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="rounded-lg max-h-60"
                />
              )}

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="text-red-500 text-sm mt-2"
              >
                Remove File
              </button>
            </div>
          )}

          {/* Submit */}
          <Button type="submit" loading={loading}>
            Upload Asset
          </Button>

        </form>
      </div>
    </>
  );
};

export default CreateAsset;
