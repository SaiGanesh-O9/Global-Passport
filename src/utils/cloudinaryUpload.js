export async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_PRESET;

  // Safe fallback if Cloudinary settings are missing or blank
  if (!cloudName || !preset || cloudName.includes("your_") || preset.includes("your_")) {
    console.warn("Cloudinary configuration missing. Simulating mock file upload...");
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a local mock URL
    let mockUrl = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=800";
    try {
      mockUrl = URL.createObjectURL(file);
    } catch (err) {
      console.warn("URL createObjectURL failed:", err.message);
    }

    return {
      url: mockUrl,
      public_id: `mock_cloudinary_id_${Date.now()}`,
    };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!data.secure_url) {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    return {
      url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (err) {
    console.warn("Cloudinary direct upload failed, falling back to mock upload:", err);
    let mockUrl = "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=800";
    try {
      mockUrl = URL.createObjectURL(file);
    } catch (err) {
      console.warn("URL createObjectURL failed:", err.message);
    }
    return {
      url: mockUrl,
      public_id: `mock_cloudinary_id_${Date.now()}`,
    };
  }
}
