export async function downloadMedia(url, filename = "media") {
  try {
    // Add fl_attachment to Cloudinary URL to force download
    let downloadUrl = url;
    if (url.includes("cloudinary.com")) {
      downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
    }

    const response = await fetch(downloadUrl);
    const blob     = await response.blob();
    const blobUrl  = URL.createObjectURL(blob);

    const link    = document.createElement("a");
    link.href     = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download error:", error);
    window.open(url, "_blank");
  }
}