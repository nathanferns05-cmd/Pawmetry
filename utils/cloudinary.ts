import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

const CLOUDINARY_CLOUD_NAME = "wygpj7zg";
const CLOUDINARY_UPLOAD_PRESET = "pawmetry_gallery";

export async function uploadImageToCloudinary(uri: string) {
  const file = new File(uri);

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  console.log("Cloudinary status:", response.status);
  console.log("Cloudinary response:", data);

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Cloudinary upload failed."
    );
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}