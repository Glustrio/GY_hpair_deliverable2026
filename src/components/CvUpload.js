// The CV upload. Saves the file, then reads its text and offers what it found, which
// is why this step comes first in the wizard.

import React, { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useField, useFormikContext } from 'formik';
import { FIELDS, CV_CONTENT_TYPE, MAX_CV_BYTES } from '../validation/applicationSchema';
import { uploadCv, rejectionReason } from '../services/cvService';
import { readPdfText } from '../utils/readPdfText';
import { parseCv } from '../utils/parseCv';

// react-dropzone reports why it turned a file away as a code. Its own messages quote
// raw MIME types and byte counts, so they are replaced here.
const messageForRejection = (rejection) => {
  switch (rejection?.errors?.[0]?.code) {
    case 'file-invalid-type':
      return 'Your CV must be a PDF.';
    case 'too-many-files':
      return 'Attach one PDF.';
    case 'file-too-large':
      return 'That file is too large.';
    default:
      return 'That file could not be used. Try a different PDF.';
  }
};

const SUGGESTION_LABELS = {
  firstName: 'First name',
  lastName: 'Last name',
  phone: 'Phone number',
  address: 'Home address',
  linkedinUrl: 'LinkedIn',
};

const CvUpload = ({ userId }) => {
  const [field, meta, helpers] = useField(FIELDS.cv);
  const { setFieldValue } = useFormikContext();
  const [suggestions, setSuggestions] = useState(null);
  const [progress, setProgress] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const chooseRef = useRef(null);
  const removeRef = useRef(null);
  const wantsFocus = useRef(false);

  const cv = field.value;
  const isUploading = progress !== null;
  const hasFile = Boolean(cv && cv.cvDocId);

  // While an upload is running the schema error is "still uploading", which is true
  // but not worth shouting over the progress text the user is already watching.
  const message = uploadError || (meta.touched && !isUploading ? meta.error : '');
  const showError = Boolean(message);

  // The button that had focus unmounts when a file arrives or is removed, so focus
  // has to be moved after the render that swapped it, not inside the handler.
  useEffect(() => {
    if (!wantsFocus.current) return;
    wantsFocus.current = false;
    (hasFile ? removeRef : chooseRef).current?.focus();
  }, [hasFile]);

  // Validates, saves the file, then reads its text. react-dropzone passes rejected
  // files in the second argument, and ignoring it is why a wrong file type used to
  // report "choose a file" to someone who just had.
  const handleDrop = async (accepted, rejected) => {
    const file = accepted[0];
    if (!file) {
      setUploadError(rejected?.length ? messageForRejection(rejected[0]) : 'Choose a file to upload.');
      return;
    }

    const reason = rejectionReason(file);
    if (reason) {
      setUploadError(reason);
      return;
    }

    setUploadError('');
    setProgress(0);
    // A placeholder rather than null, so the schema can say "still uploading"
    // instead of "upload your CV" to someone who just did.
    helpers.setValue({ uploading: true });

    try {
      helpers.setValue(await uploadCv(file, userId, setProgress));
      wantsFocus.current = true;
      readAndSuggest(file);
    } catch (error) {
      setUploadError(error.message);
      helpers.setValue(null);
    } finally {
      setProgress(null);
    }
  };

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop: handleDrop,
    // The key is a MIME type and each extension needs its leading dot. An array or a
    // bare string produces an empty accept attribute, which accepts everything.
    accept: { [CV_CONTENT_TYPE]: ['.pdf'] },
    multiple: false,
    maxFiles: 1,
    // Dragging is a pointer-only gesture, so the drop zone is not the control and the
    // button below is. react-dropzone's default also puts role="presentation" on a
    // focusable element, which gives a screen reader a stop that announces nothing.
    noClick: true,
    noKeyboard: true,
  });

  // Never fills anything in by itself. A CV is not a form, and a wrong guess silently
  // written into an application is worse than no guess at all.
  const readAndSuggest = async (file) => {
    try {
      const found = parseCv(await readPdfText(file));
      if (Object.keys(found).length) setSuggestions(found);
    } catch (error) {
      // Reading the text is a convenience. The upload already succeeded.
      console.error('Could not read the CV text:', error);
    }
  };

  const applySuggestions = () => {
    Object.entries(suggestions).forEach(([name, value]) => setFieldValue(name, value));
    if (suggestions.linkedinUrl) setFieldValue(FIELDS.hasLinkedin, 'yes');
    setSuggestions(null);
  };

  const removeFile = () => {
    helpers.setValue(null);
    setUploadError('');
    setSuggestions(null);
    wantsFocus.current = true;
  };

  return (
    <div className="form-group">
      <span className="form-label">Your CV</span>

      <p className="form-hint" id="cv-hint">
        PDF only, up to {MAX_CV_BYTES / 1024} KB.
      </p>

      {hasFile ? (
        <div className="file-list">
          <div className="file-item">
            <div className="file-info">
              <span className="file-name">{cv.fileName}</span>
              <span className="file-size">{(cv.sizeBytes / 1024).toFixed(0)} KB</span>
            </div>
            <button type="button" ref={removeRef} className="remove-file" onClick={removeFile}>
              Remove<span className="visually-hidden"> {cv.fileName}</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`file-upload-area${isDragActive ? ' dragover' : ''}${isUploading ? ' uploading' : ''}`}
        >
          <input {...getInputProps()} />
          <button
            type="button"
            id={FIELDS.cv}
            ref={chooseRef}
            className="btn btn-primary"
            // aria-disabled rather than disabled, so the element stays focusable and
            // the step gate can still move focus here to announce the error.
            aria-disabled={isUploading}
            aria-describedby={showError ? 'cv-hint cv-error' : 'cv-hint'}
            onClick={() => {
              if (isUploading) return;
              open();
            }}
          >
            Choose file
          </button>
          <p>or drag it here</p>
        </div>
      )}

      {isUploading && (
        <>
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="CV progress"
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="form-hint">
            {progress < 100 ? `Reading your CV, ${progress}% done.` : 'Saving your CV.'}
          </p>
        </>
      )}

      {/* react-dropzone announces nothing on drag, and a bar width is not readable. */}
      <p className="visually-hidden" role="status">
        {isDragActive ? 'File over the drop zone. Release to upload.' : ''}
      </p>

      {suggestions && (
        <div className="submit-message info cv-suggestions" role="status">
          <p>
            <strong>Found these in your CV.</strong> Check them before you use them.
          </p>
          <ul>
            {Object.entries(suggestions).map(([name, value]) => (
              <li key={name}>
                <span className="summary-label">{SUGGESTION_LABELS[name]}</span> {value}
              </li>
            ))}
          </ul>
          <div className="draft-banner-actions">
            <button type="button" className="btn btn-primary btn-small" onClick={applySuggestions}>
              Fill these in
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setSuggestions(null)}
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {showError && (
        <p className="form-error" id="cv-error">
          {message}
        </p>
      )}
    </div>
  );
};

export default CvUpload;
