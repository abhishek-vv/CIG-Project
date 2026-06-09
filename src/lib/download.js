export async function downloadMedia(url, filename = "media", clubName = "", eventName = "") {
  try {
    let downloadUrl = url;

    if (url.includes("cloudinary.com") && !url.includes("video")) {
      const watermarkText = [clubName, eventName, "MediaHub"]
        .filter(Boolean)
        .join(" | ");

      const encodedText = encodeURIComponent(watermarkText);

      downloadUrl = url.replace(
        "/upload/",
        `/upload/l_text:Arial_18_bold:${encodedText},co_white,o_70,g_south_east,x_10,y_10/`
      );
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