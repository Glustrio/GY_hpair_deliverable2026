import { doc, setDoc, Bytes } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MAX_CV_BYTES, CV_CONTENT_TYPE } from '../validation/applicationSchema';

// The PDF lives in its own collection rather than inside the submission. A
// submission document is read every time the "Your applications" list renders, and
// nobody wants to download fifty CVs to show fifty reference numbers.
const COLLECTION_NAME = 'cvFiles';

// Firestore stores a bytes field at its real size. Base64 would have added a third
// on top, against a hard 1 MiB ceiling for the whole document.
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

// The document id carries the owner's uid, so the security rule on submissions can
// check that an applicant is attaching their own CV without reading another document.
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
