export enum ImageSize {
  Full = "full",
  Thumbnail = "thumbnail",
}

// Publicly hosted on GCP Cloud Storage under Breakdown's GCP project
export const getRepImage = (repId: string, size: ImageSize) => {
  return size === ImageSize.Full
    ? `https://storage.googleapis.com/rep_images_full/${repId}.jpg`
    : `https://storage.googleapis.com/rep_images_small/${repId}.jpg`;
};
