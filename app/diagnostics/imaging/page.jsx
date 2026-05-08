'use client';

import { useMemo, useState } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import AppShell from '@/components/AppShell';
import PageIntro from '@/components/PageIntro';
import SavedRecordsPanel from '@/components/SavedRecordsPanel';
import {
  createClientId,
  getLocalDateTime,
  savePatientDocument,
} from '@/lib/patientFirestore';

const COLLECTION_NAME = 'imagingResults';

const IMAGING_TYPES = ['X-ray', 'Ultrasound', 'CT Scan', 'MRI', 'Other'];

const MAX_IMAGE_COUNT = 3;
const MAX_ORIGINAL_FILE_SIZE = 8 * 1024 * 1024;
const KEEP_ORIGINAL_LIMIT = 300 * 1024;
const MAX_IMAGE_DIMENSION = 900;
const JPEG_QUALITY = 0.65;
const MAX_STORED_IMAGE_CHARS = 320000;
const MAX_TOTAL_STORED_IMAGE_CHARS = 760000;

const INITIAL_FORM = {
  dateTime: getLocalDateTime(),
  imagingType: '',
  bodyPart: '',
  findings: '',
  impression: '',
  radiologist: '',
  remarks: '',
};

function formatFileSize(bytes = 0) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('The selected image could not be read.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('The selected image could not be optimized by the browser.'));
    };

    image.src = imageUrl;
  });
}

function getDataUrlSize(dataUrl = '') {
  return Math.ceil((String(dataUrl).length * 3) / 4);
}

async function canvasToDataUrl(canvas, quality) {
  return canvas.toDataURL('image/jpeg', quality);
}

async function compressImageToDataUrl(file) {
  const image = await loadImageElement(file);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  const longestSide = Math.max(naturalWidth, naturalHeight);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(longestSide, 1));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);

  let dataUrl = await canvasToDataUrl(canvas, JPEG_QUALITY);

  if (dataUrl.length > MAX_STORED_IMAGE_CHARS) {
    dataUrl = await canvasToDataUrl(canvas, 0.5);
  }

  if (dataUrl.length > MAX_STORED_IMAGE_CHARS) {
    const smallerCanvas = document.createElement('canvas');
    const smallerScale = Math.min(1, 650 / Math.max(width, height));
    smallerCanvas.width = Math.max(1, Math.round(width * smallerScale));
    smallerCanvas.height = Math.max(1, Math.round(height * smallerScale));

    const smallerContext = smallerCanvas.getContext('2d');
    smallerContext.drawImage(image, 0, 0, smallerCanvas.width, smallerCanvas.height);
    dataUrl = await canvasToDataUrl(smallerCanvas, 0.48);
  }

  return dataUrl;
}

async function prepareImageForFirestore(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error(`${file?.name || 'Selected file'} is not an image file.`);
  }

  if (file.size > MAX_ORIGINAL_FILE_SIZE) {
    throw new Error(`${file.name} is larger than ${formatFileSize(MAX_ORIGINAL_FILE_SIZE)}.`);
  }

  let dataUrl = '';
  let wasCompressed = false;

  if (file.size <= KEEP_ORIGINAL_LIMIT) {
    dataUrl = await readFileAsDataUrl(file);
  } else {
    dataUrl = await compressImageToDataUrl(file);
    wasCompressed = true;
  }

  if (dataUrl.length > MAX_STORED_IMAGE_CHARS) {
    dataUrl = await compressImageToDataUrl(file);
    wasCompressed = true;
  }

  if (dataUrl.length > MAX_STORED_IMAGE_CHARS) {
    throw new Error(`${file.name} is still too large after optimization. Please use a smaller demo image.`);
  }

  return {
    id: createClientId('image'),
    name: file.name,
    dataUrl,
    size: getDataUrlSize(dataUrl),
    originalSize: file.size,
    contentType: file.type || 'image/jpeg',
    wasCompressed,
    storageType: 'firestoreDataUrl',
  };
}

function getImageSrc(image) {
  return image?.dataUrl || image?.url || image?.downloadURL || '';
}

function normalizeImages(record) {
  if (Array.isArray(record?.images)) {
    return record.images.filter((image) => getImageSrc(image));
  }

  if (record?.imageDataUrl || record?.imageUrl) {
    return [
      {
        id: record.imageId || createClientId('loaded_image'),
        name: record.imageName || 'Uploaded Image',
        dataUrl: record.imageDataUrl || '',
        url: record.imageUrl || '',
        path: record.imagePath || '',
        size: record.imageSize || 0,
        contentType: record.imageType || '',
      },
    ];
  }

  return [];
}

function getImagesDataLength(images = []) {
  return images.reduce((total, image) => {
    return total + String(image.dataUrl || '').length;
  }, 0);
}

function formatDisplayDate(value) {
  if (!value) return 'No date';

  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleString();
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleString();
}

function ImagingImagesGrid({ images = [], onPreview }) {
  if (!images.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        No imaging images attached.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {images.map((image, index) => {
        const imageSrc = getImageSrc(image);

        return (
          <button
            key={image.id || image.path || imageSrc || index}
            type="button"
            onClick={() => onPreview?.(image)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="aspect-[4/3] bg-slate-100">
              <img
                src={imageSrc}
                alt={image.name || `Imaging upload ${index + 1}`}
                className="h-full w-full object-cover transition group-hover:scale-[1.02]"
              />
            </div>

            <div className="space-y-1 p-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {image.name || `Image ${index + 1}`}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(image.size || image.originalSize)} {image.contentType ? `• ${image.contentType}` : ''}
              </p>
              <p className="text-xs font-semibold text-cyan-700">Click to preview</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ImagePreviewModal({ image, onClose }) {
  if (!image) return null;

  const imageSrc = getImageSrc(image);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close image preview"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {image.name || 'Imaging Image'}
            </p>
            <p className="text-xs text-slate-500">
              {formatFileSize(image.size || image.originalSize)} {image.contentType ? `• ${image.contentType}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
          <img
            src={imageSrc}
            alt={image.name || 'Imaging preview'}
            className="max-h-[76vh] max-w-full rounded-2xl object-contain shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

export default function ImagingPage() {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [loadedRecordId, setLoadedRecordId] = useState('');
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isPreparingImages, setIsPreparingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const modeLabel = useMemo(() => {
    if (loadedRecordId) return 'Editing loaded history record';
    return 'New imaging report';
  }, [loadedRecordId]);

  function handleChange(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleImageSelect(event) {
    setMessage('');
    setError('');

    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';

    if (!selectedFiles.length) return;

    const availableSlots = Math.max(0, MAX_IMAGE_COUNT - images.length);

    if (availableSlots <= 0) {
      setError(`You can attach up to ${MAX_IMAGE_COUNT} images per imaging report.`);
      return;
    }

    const filesToPrepare = selectedFiles.slice(0, availableSlots);

    setIsPreparingImages(true);

    try {
      const preparedImages = [];
      let totalDataLength = getImagesDataLength(images);

      for (const file of filesToPrepare) {
        const preparedImage = await prepareImageForFirestore(file);
        const nextTotal = totalDataLength + String(preparedImage.dataUrl || '').length;

        if (nextTotal > MAX_TOTAL_STORED_IMAGE_CHARS) {
          throw new Error(
            `${file.name} would make the saved report too large. Please attach fewer or smaller demo images.`
          );
        }

        totalDataLength = nextTotal;
        preparedImages.push(preparedImage);
      }

      setImages((prev) => [...prev, ...preparedImages]);
      setMessage(
        `${preparedImages.length} image${preparedImages.length === 1 ? '' : 's'} attached and ready to save.`
      );

      if (selectedFiles.length > filesToPrepare.length) {
        setError(`Only ${availableSlots} more image${availableSlots === 1 ? '' : 's'} can be attached.`);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to prepare image. Please try a smaller image.');
    } finally {
      setIsPreparingImages(false);
    }
  }

  function removeImage(indexToRemove) {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  function resetForm() {
    setFormData({ ...INITIAL_FORM, dateTime: getLocalDateTime() });
    setLoadedRecordId('');
    setImages([]);
    setMessage('');
    setError('');
  }

  function validateForm() {
    if (!formData.dateTime) return 'Date/Time is required.';
    if (!formData.imagingType) return 'Imaging Type is required.';
    if (!formData.bodyPart.trim()) return 'Body Part / Area is required.';
    if (!formData.findings.trim()) return 'Findings is required.';
    if (!formData.impression.trim()) return 'Impression is required.';
    return '';
  }

  async function handleSave() {
    setMessage('');
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const recordId = loadedRecordId || createClientId('imaging');

      const payload = {
        ...formData,
        bodyPart: formData.bodyPart.trim(),
        findings: formData.findings.trim(),
        impression: formData.impression.trim(),
        radiologist: formData.radiologist.trim(),
        remarks: formData.remarks.trim(),
        images,
        imageCount: images.length,
        imageStorageMode: 'firestoreDataUrl',
      };

      if (!loadedRecordId) {
        payload.createdAt = serverTimestamp();
      }

      await savePatientDocument(COLLECTION_NAME, recordId, payload);

      setLoadedRecordId(recordId);
      setMessage(
        loadedRecordId
          ? 'Imaging report updated successfully.'
          : 'Imaging report saved successfully.'
      );
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setError(
        err?.message
          ? `Failed to save imaging report: ${err.message}`
          : 'Failed to save imaging report. Please check your Firestore connection.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleLoadHistory(record) {
    setLoadedRecordId(record.id || '');
    setFormData({
      dateTime: record.dateTime || getLocalDateTime(),
      imagingType: record.imagingType || '',
      bodyPart: record.bodyPart || '',
      findings: record.findings || '',
      impression: record.impression || '',
      radiologist: record.radiologist || '',
      remarks: record.remarks || '',
    });
    setImages(normalizeImages(record));
    setMessage('Saved imaging report loaded into the form.');
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  const isBusy = isPreparingImages || isSaving;

  return (
    <AppShell title="Imaging" subtitle="Diagnostic imaging reports with image attachments">
      <PageIntro
        title="Imaging Report Entry"
        description="Record imaging findings and attach diagnostic images for the active demo patient."
      />

      <div className="space-y-6 pb-36">
        {(message || error) && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </div>
        )}

        {isPreparingImages && (
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm font-semibold text-cyan-800">
            Preparing image for demo storage...
          </div>
        )}

        <div className="section-card p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-kicker">{modeLabel}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 lg:text-xl">
                Imaging Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fill out the report fields and attach demo images. Images are stored directly with the Firestore report for faster demo saving.
              </p>
            </div>

            <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
              {images.length} image{images.length === 1 ? '' : 's'} attached
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date/Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.dateTime}
                onChange={(e) => handleChange('dateTime', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Imaging Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.imagingType}
                onChange={(e) => handleChange('imagingType', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select imaging type</option>
                {IMAGING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Body Part / Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bodyPart}
                onChange={(e) => handleChange('bodyPart', e.target.value)}
                placeholder="Example: Chest, abdomen, skull, left arm"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Radiologist / Reader
              </label>
              <input
                type="text"
                value={formData.radiologist}
                onChange={(e) => handleChange('radiologist', e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Findings <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.findings}
                onChange={(e) => handleChange('findings', e.target.value)}
                placeholder="Enter imaging findings..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Impression <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.impression}
                onChange={(e) => handleChange('impression', e.target.value)}
                placeholder="Enter final impression..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Remarks
              </label>
              <textarea
                rows={3}
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="Optional remarks..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="section-card p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 lg:text-xl">
                Imaging Image Attachments
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Attach fake/sample images only. Maximum {MAX_IMAGE_COUNT} images. Small images are saved directly with the report, so Firebase Storage is not required.
              </p>
            </div>

            <label
              className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                isBusy
                  ? 'cursor-not-allowed bg-slate-400'
                  : 'cursor-pointer bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              {isPreparingImages ? 'Preparing...' : 'Add Images'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={isBusy}
                className="hidden"
              />
            </label>
          </div>

          {images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((image, index) => {
                const imageSrc = getImageSrc(image);

                return (
                  <div
                    key={image.id || image.path || imageSrc || index}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewImage(image)}
                      className="block aspect-[4/3] w-full bg-slate-100 text-left"
                    >
                      <img
                        src={imageSrc}
                        alt={image.name || `Imaging upload ${index + 1}`}
                        className="h-full w-full object-cover transition hover:scale-[1.02]"
                      />
                    </button>
                    <div className="space-y-3 p-3">
                      <div>
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {image.name || `Image ${index + 1}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(image.size || image.originalSize)} {image.contentType ? `• ${image.contentType}` : ''}
                          {image.wasCompressed ? ' • optimized' : ''}
                        </p>
                        <p className="text-xs font-semibold text-cyan-700">Click image to preview</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={isBusy}
                        className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No images attached yet.</p>
              <p className="mt-1 text-sm text-slate-500">Click Add Images to attach imaging files.</p>
            </div>
          )}
        </div>

        <SavedRecordsPanel
          collectionName={COLLECTION_NAME}
          title="Saved Imaging Reports"
          description="Click a saved report to load it back into the imaging form."
          sortBy="updatedAt"
          sortDirection="desc"
          refreshKey={refreshKey}
          onRecordSelect={handleLoadHistory}
          getTitle={(record, index) => {
            const type = record.imagingType || 'Imaging Report';
            const area = record.bodyPart ? ` - ${record.bodyPart}` : '';
            return `${type}${area}` || `Imaging Report ${index + 1}`;
          }}
          getSubtitle={(record) => {
            const count = record.imageCount || normalizeImages(record).length || 0;
            return `${formatDisplayDate(record.dateTime)} • ${count} image${count === 1 ? '' : 's'}`;
          }}
          getBadge={(record) => record.imagingType || 'Imaging'}
          renderDetails={(record) => {
            const recordImages = normalizeImages(record);

            return (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Date/Time</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{formatDisplayDate(record.dateTime)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Imaging Type</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{record.imagingType || '—'}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Body Part / Area</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{record.bodyPart || '—'}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Findings</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{record.findings || '—'}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Impression</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{record.impression || '—'}</p>
                  </div>
                </div>

                {(record.radiologist || record.remarks) && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Radiologist / Reader</p>
                      <p className="mt-2 text-sm text-slate-700">{record.radiologist || '—'}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Remarks</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{record.remarks || '—'}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-900">Attached Images</p>
                  <ImagingImagesGrid images={recordImages} onPreview={setPreviewImage} />
                </div>
              </div>
            );
          }}
        />
      </div>

      <div className="fixed bottom-6 left-4 right-4 z-50 lg:left-72 lg:right-0">
        <div className="action-shell rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={isBusy}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="rounded-xl bg-cyan-600 px-5 py-3 font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? 'Saving...'
                : loadedRecordId
                  ? 'Update Imaging Report'
                  : 'Save Imaging Report'}
            </button>
          </div>
        </div>
      </div>

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </AppShell>
  );
}
