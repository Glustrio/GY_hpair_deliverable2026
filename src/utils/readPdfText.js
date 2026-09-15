// Imported on demand, so the 1.3 MB PDF library is never downloaded by someone who
// does not upload a CV. The worker is served from public/ rather than a CDN so the
// feature does not depend on a third party staying up.
export const readPdfText = async (file) => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;

  // Two pages is plenty. Contact details live at the top, and a long CV would
  // otherwise add seconds for nothing.
  const pages = Math.min(doc.numPages, 2);
  const texts = [];
  for (let page = 1; page <= pages; page += 1) {
    // Sequential on purpose: pdf.js shares one worker, so parallel pages queue anyway.
    // eslint-disable-next-line no-await-in-loop
    const content = await (await doc.getPage(page)).getTextContent();
    texts.push(content.items.map((item) => item.str).join('\n'));
  }
  return texts.join('\n');
};
