/**
 * Upload hook (1.6): drag and drop / paste of files into the editor POST them to a host URL and insert the returned
 * image or file link. Progress and errors are announced in an `aria-live` region; nothing runs unless the form theme
 * rendered `data-tiptap-upload-url-value`.
 */

export type UploadLabels = {
  uploading: string;
  uploaded: string;
  failed: string;
};

export type UploadConfig = {
  url: string;
  token: string;
  labels: UploadLabels;
};

export type UploadResult = {
  url: string;
  name: string;
  image: boolean;
};

/** Where the uploaded file goes in the document. */
export type UploadInserter = {
  image(url: string, alt: string): void;
  link(url: string, text: string): void;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const DEFAULT_LABELS: UploadLabels = {
  uploading: 'Uploading %name%…',
  uploaded: '%name% uploaded.',
  failed: '%name% could not be uploaded: %reason%',
};

function pick(value: string | undefined, fallback: string): string {
  return value !== undefined && value !== '' ? value : fallback;
}

/** Reads the upload configuration rendered by the form theme, or null when the hook is off. */
export function readUploadConfig(root: HTMLElement): UploadConfig | null {
  const url = root.dataset.tiptapUploadUrlValue ?? '';
  if (url === '') {
    return null;
  }

  return {
    url,
    token: root.dataset.tiptapUploadTokenValue ?? '',
    labels: {
      uploading: pick(root.dataset.tiptapUploadUploadingValue, DEFAULT_LABELS.uploading),
      uploaded: pick(root.dataset.tiptapUploadUploadedValue, DEFAULT_LABELS.uploaded),
      failed: pick(root.dataset.tiptapUploadFailedValue, DEFAULT_LABELS.failed),
    },
  };
}

/** The files of a drop or paste (none for plain text / HTML). */
export function filesFrom(transfer: DataTransfer | null): File[] {
  return transfer ? Array.from(transfer.files ?? []) : [];
}

/** The status region next to the editor (created once). */
export function ensureLiveRegion(root: HTMLElement): HTMLElement {
  const existing = root.querySelector<HTMLElement>('.tiptap-editor-upload-status');
  if (existing) {
    return existing;
  }

  const region = document.createElement('div');
  region.className = 'tiptap-editor-upload-status';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  root.appendChild(region);

  return region;
}

function format(template: string, name: string, reason = ''): string {
  return template.replace('%name%', name).replace('%reason%', reason);
}

/** POSTs one file; resolves with the host's description or rejects with the host's reason (or the HTTP status). */
export async function uploadFile(file: File, config: UploadConfig, fetchImpl: FetchLike): Promise<UploadResult> {
  const body = new FormData();
  body.append('file', file, file.name);
  const response = await fetchImpl(config.url, {
    method: 'POST',
    body,
    credentials: 'same-origin',
    headers: { 'X-CSRF-Token': config.token, Accept: 'application/json' },
  });

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!response.ok || typeof data.url !== 'string') {
    throw new Error(typeof data.error === 'string' ? data.error : String(response.status));
  }

  return { url: data.url, name: typeof data.name === 'string' ? data.name : file.name, image: data.image === true };
}

/** Uploads the files one by one, inserting each result and announcing progress and failures. */
export async function handleFiles(
  files: File[],
  config: UploadConfig,
  live: HTMLElement,
  inserter: UploadInserter,
  fetchImpl: FetchLike,
): Promise<void> {
  for (const file of files) {
    live.textContent = format(config.labels.uploading, file.name);
    try {
      const result = await uploadFile(file, config, fetchImpl);
      if (result.image) {
        inserter.image(result.url, result.name);
      } else {
        inserter.link(result.url, result.name);
      }
      live.textContent = format(config.labels.uploaded, result.name);
    } catch (error) {
      live.textContent = format(config.labels.failed, file.name, (error as Error).message);
    }
  }
}

/**
 * Listens to drop and paste on the editor surface (capture phase, before ProseMirror) and uploads the files.
 * Text-only drops and pastes are left to the editor.
 *
 * @return the pending upload of the last handled event, for tests
 */
export function attachUploadHook(
  root: HTMLElement,
  surface: HTMLElement,
  config: UploadConfig,
  inserter: UploadInserter,
  fetchImpl: FetchLike,
): { last: () => Promise<void> } {
  const live = ensureLiveRegion(root);
  let pending: Promise<void> = Promise.resolve();

  const onTransfer = (event: Event, transfer: DataTransfer | null): void => {
    const files = filesFrom(transfer);
    if (files.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    pending = handleFiles(files, config, live, inserter, fetchImpl);
  };

  surface.addEventListener('drop', (event) => onTransfer(event, (event as DragEvent).dataTransfer), true);
  surface.addEventListener('paste', (event) => onTransfer(event, (event as ClipboardEvent).clipboardData), true);

  return { last: () => pending };
}
