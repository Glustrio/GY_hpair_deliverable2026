// Saves the CV. Firebase Cloud Storage needs a billing account since February 2026,
// so the PDF goes into Firestore as a bytes field instead.

import { doc, setDoc, Bytes } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MAX_CV_BYTES, CV_CONTENT_TYPE } from '../validation/applicationSchema';

// Its own collection, so listing submissions does not download every CV.
const COLLECTION_NAME = 'cvFiles';

// Bytes, not base64: base64 would add a third against a 1 MiB document ceiling.
const readAsBytes = (file, onProgress) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    reader.onerror = () => reject(new Error('That file could not be read. Try selecting it again.'));
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.readAsArrayBuffer(file);
  });

export const rejectionReason = (file) => {
  if (!file) return 'Choose a file to upload.';
  if (file.type !== CV_CONTENT_TYPE) return 'Your CV must be a PDF.';
  if (file.size === 0) return 'That file is empty. Check it and upload it again.';
  if (file.size > MAX_CV_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That file is ${mb} MB. The limit is ${MAX_CV_BYTES / 1024} KB. Exporting as a PDF usually shrinks it.`;
  }
  return null;
};

// The uid prefix lets firestore.rules verify ownership without a second read.
export const uploadCv = async (file, userId, onProgress) => {
  const cvDocId = `${userId}_${crypto.randomUUID()}`;
  const bytes = await readAsBytes(file, onProgress);

  await setDoc(doc(db, COLLECTION_NAME, cvDocId), {
    ownerId: userId,
    fileName: file.name,
    sizeBytes: file.size,
    contentType: CV_CONTENT_TYPE,
    data: Bytes.fromUint8Array(bytes),
  });

  return { cvDocId, fileName: file.name, sizeBytes: file.size, contentType: CV_CONTENT_TYPE };
};
