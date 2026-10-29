import { describe, expect, it, vi } from 'vitest';

import { attachUploadHook, ensureLiveRegion, filesFrom, handleFiles, readUploadConfig, uploadFile } from './upload';
import type { UploadConfig } from './upload';

const config: UploadConfig = {
  url: '/upload',
  token: 'tok',
  labels: { uploading: 'Up %name%', uploaded: 'Done %name%', failed: 'Fail %name%: %reason%' },
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function transfer(files: File[]): DataTransfer {
  return { files } as unknown as DataTransfer;
}

describe('readUploadConfig', () => {
  it('is off without a URL and falls back to default labels', () => {
    const root = document.createElement('div');
    expect(readUploadConfig(root)).toBeNull();

    root.dataset.tiptapUploadUrlValue = '/u';
    expect(readUploadConfig(root)).toEqual({
      url: '/u',
      token: '',
      labels: { uploading: 'Uploading %name%…', uploaded: '%name% uploaded.', failed: '%name% could not be uploaded: %reason%' },
    });

    root.dataset.tiptapUploadTokenValue = 't';
    root.dataset.tiptapUploadUploadingValue = 'A';
    root.dataset.tiptapUploadUploadedValue = 'B';
    root.dataset.tiptapUploadFailedValue = 'C';
    expect(readUploadConfig(root)).toEqual({ url: '/u', token: 't', labels: { uploading: 'A', uploaded: 'B', failed: 'C' } });
  });
});

describe('helpers', () => {
  it('reads files and creates the live region once', () => {
    const file = new File(['x'], 'a.txt');
    expect(filesFrom(null)).toEqual([]);
    expect(filesFrom({} as DataTransfer)).toEqual([]);
    expect(filesFrom(transfer([file]))).toEqual([file]);

    const root = document.createElement('div');
    const region = ensureLiveRegion(root);
    expect(region.getAttribute('role')).toBe('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(ensureLiveRegion(root)).toBe(region);
  });
});

describe('uploadFile', () => {
  it('posts the file with the CSRF header and returns the description', async () => {
    const fetchImpl = vi.fn(async () => json(201, { url: '/a/1', name: 'shot.png', image: true }));
    const result = await uploadFile(new File(['x'], 'shot.png'), config, fetchImpl);

    expect(result).toEqual({ url: '/a/1', name: 'shot.png', image: true });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/upload');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['X-CSRF-Token']).toBe('tok');
  });

  it('keeps the local name and reports the host reason or the status', async () => {
    await expect(uploadFile(new File(['x'], 'a.pdf'), config, async () => json(201, { url: '/a/2' }))).resolves.toEqual({
      url: '/a/2',
      name: 'a.pdf',
      image: false,
    });
    await expect(uploadFile(new File(['x'], 'a.svg'), config, async () => json(422, { error: 'type_not_allowed' }))).rejects.toThrow(
      'type_not_allowed',
    );
    await expect(uploadFile(new File(['x'], 'a'), config, async () => new Response('<html>', { status: 500 }))).rejects.toThrow('500');
  });
});

describe('handleFiles and the hook', () => {
  it('inserts at the anchor, releases it and runs drops one after the other', async () => {
    const root = document.createElement('div');
    const surface = document.createElement('div');
    const inserter = { image: vi.fn(), link: vi.fn() };
    const released: number[] = [];
    let next = 10;
    const anchorFor = vi.fn(() => {
      const at = next;
      next += 5;
      return { position: () => at, release: () => released.push(at) };
    });
    const order: string[] = [];
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const name = ((init?.body as FormData).get('file') as File).name;
      order.push(name);
      return json(201, { url: `/${name}`, name, image: name.endsWith('.png') });
    });
    const hook = attachUploadHook(root, surface, config, inserter, fetchImpl, anchorFor);

    for (const name of ['a.png', 'b.txt']) {
      const drop = new Event('drop', { cancelable: true });
      Object.defineProperty(drop, 'dataTransfer', { value: transfer([new File(['x'], name)]) });
      surface.dispatchEvent(drop);
    }
    await hook.last();

    expect(order).toEqual(['a.png', 'b.txt']);
    expect(inserter.image).toHaveBeenCalledWith('/a.png', 'a.png', 10);
    expect(inserter.link).toHaveBeenCalledWith('/b.txt', 'b.txt', 15);
    expect(released).toEqual([10, 15]);
  });

  it('inserts images and links and announces each step', async () => {
    const live = document.createElement('div');
    const inserter = { image: vi.fn(), link: vi.fn() };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json(201, { url: '/i', name: 'i.png', image: true }))
      .mockResolvedValueOnce(json(201, { url: '/d', name: 'd.pdf', image: false }))
      .mockResolvedValueOnce(json(422, { error: 'too_large' }));

    await handleFiles([new File(['1'], 'i.png'), new File(['2'], 'd.pdf'), new File(['3'], 'big.zip')], config, live, inserter, fetchImpl);

    expect(inserter.image).toHaveBeenCalledWith('/i', 'i.png', null);
    expect(inserter.link).toHaveBeenCalledWith('/d', 'd.pdf', null);
    expect(live.textContent).toBe('Fail big.zip: too_large');
  });

  it('handles drops and pastes with files and leaves text alone', async () => {
    const root = document.createElement('div');
    const surface = document.createElement('div');
    root.appendChild(surface);
    const inserter = { image: vi.fn(), link: vi.fn() };
    const hook = attachUploadHook(root, surface, config, inserter, async () => json(201, { url: '/x', name: 'x.txt' }));

    const textDrop = new Event('drop', { cancelable: true });
    Object.defineProperty(textDrop, 'dataTransfer', { value: transfer([]) });
    surface.dispatchEvent(textDrop);
    expect(textDrop.defaultPrevented).toBe(false);

    const drop = new Event('drop', { cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: transfer([new File(['x'], 'x.txt')]) });
    surface.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    await hook.last();
    expect(inserter.link).toHaveBeenCalledWith('/x', 'x.txt', null);

    const paste = new Event('paste', { cancelable: true });
    Object.defineProperty(paste, 'clipboardData', { value: transfer([new File(['y'], 'y.txt')]) });
    surface.dispatchEvent(paste);
    await hook.last();
    expect(inserter.link).toHaveBeenCalledTimes(2);
    expect(root.querySelector('.tiptap-editor-upload-status')?.textContent).toBe('Done x.txt');
  });
});
