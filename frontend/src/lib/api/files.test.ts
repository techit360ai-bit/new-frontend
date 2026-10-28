import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import { fetchDomainFiles, normalizeDomainFile } from "./files";

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  const original = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return handler(String(url), init);
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

test("domain files read canonical BACKEND live endpoint", async () => {
  setAuthTokenGetter(() => "jwt-files");
  const fetchMock = stubFetch(async () => response({
    files: [
      { id: "folder_1", name: "Specs", type: "folder", updatedAt: "2026-07-13T10:00:00Z" },
      { id: "file_1", filename: "README.md", sizeLabel: "4 KB", updatedAt: "2026-07-13T11:00:00Z" },
    ],
  }));

  try {
    const files = await fetchDomainFiles();
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];

    expect(url).toBe("http://localhost:3000/api/domain/files");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-files");
    expect(files).toHaveLength(2);
    expect(files[0]).toMatchObject({ id: "folder_1", name: "Specs", type: "folder" });
    expect(files[1]).toMatchObject({ id: "file_1", name: "README.md", type: "file", size: "4 KB", fileType: "code" });
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("domain files return empty live state without bundled records", async () => {
  const fetchMock = stubFetch(async () => response({ files: [] }));

  try {
    await expect(fetchDomainFiles()).resolves.toEqual([]);
  } finally {
    fetchMock.restore();
  }
});

test("file normalizer tolerates partial live rows", () => {
  expect(normalizeDomainFile({ name: "screenshot.png", updatedAt: "not-a-date" })).toMatchObject({
    id: "screenshot.png",
    name: "screenshot.png",
    type: "file",
    modified: "not-a-date",
    fileType: "image",
  });
});
