import { afterEach, describe, expect, it, vi } from "vitest";

import { prepareProfileImage } from "@/lib/profile-image-client";

class TestImage {
  naturalWidth = 5712;
  naturalHeight = 4284;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("prepareProfileImage", () => {
  it("accepts Safari's PNG fallback when Canvas WebP encoding is unavailable", async () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-image");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (callback: BlobCallback) => {
        callback(new Blob(["png-output"], { type: "image/png" }));
      },
    } as unknown as HTMLCanvasElement;
    vi.stubGlobal("window", { Image: TestImage });
    vi.stubGlobal("document", {
      createElement: (tagName: string) => {
        if (tagName !== "canvas") throw new Error(`Unexpected element: ${tagName}`);
        return canvas;
      },
    });

    const result = await prepareProfileImage(
      new File(["iphone-jpeg"], "IMG_6107.JPG", { type: "image/jpeg" })
    );

    expect(result.name).toBe("IMG_6107.png");
    expect(result.type).toBe("image/png");
    expect(drawImage).toHaveBeenCalledOnce();
  });
});
