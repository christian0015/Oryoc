// lib/cloudinary-folders.ts

export const CLOUDINARY_FOLDERS = {
  listingPhotos: "oryoc/listings/photos",
  listingVideos: "oryoc/listings/videos",
  panoramaScenes: "oryoc/listings/panoramas",
  eventPhotos: "oryoc/events/photos",
  avatars: "oryoc/users/avatars",
  certificationDocs: "oryoc/users/certification", // private, never rendered publicly
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];
