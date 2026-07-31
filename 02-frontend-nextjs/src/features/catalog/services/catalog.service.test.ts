import { apiFetch, apiFetchEnvelope } from "@/shared/lib/api-client";
import * as catalogService from "./catalog.service";

jest.mock("@/shared/lib/api-client", () => ({
  apiFetch: jest.fn(),
  apiFetchEnvelope: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.Mock;
const mockedApiFetchEnvelope = apiFetchEnvelope as jest.Mock;

describe("catalog.service", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedApiFetchEnvelope.mockReset();
  });

  describe("fetchProducts", () => {
    it("builds a query string from provided filters", async () => {
      mockedApiFetchEnvelope.mockResolvedValueOnce({
        success: true,
        data: [],
        meta: { timestamp: "now", pagination: { limit: 24, nextCursor: null, hasMore: false } },
      });

      await catalogService.fetchProducts({ category: "shoes", q: "trail" });

      expect(mockedApiFetchEnvelope).toHaveBeenCalledWith(
        expect.stringContaining("/catalog/products?"),
        expect.any(Object),
      );
      const [path] = mockedApiFetchEnvelope.mock.calls[0];
      expect(path).toContain("category=shoes");
      expect(path).toContain("q=trail");
    });

    it("returns items and pagination info from the envelope", async () => {
      mockedApiFetchEnvelope.mockResolvedValueOnce({
        success: true,
        data: [{ id: "p1" }],
        meta: {
          timestamp: "now",
          pagination: { limit: 24, nextCursor: "abc", hasMore: true },
        },
      });

      const result = await catalogService.fetchProducts();

      expect(result).toEqual({
        items: [{ id: "p1" }],
        nextCursor: "abc",
        hasMore: true,
      });
    });

    it("defaults hasMore/nextCursor when no pagination meta is present", async () => {
      mockedApiFetchEnvelope.mockResolvedValueOnce({
        success: true,
        data: [],
        meta: { timestamp: "now" },
      });

      const result = await catalogService.fetchProducts();

      expect(result.nextCursor).toBeNull();
      expect(result.hasMore).toBe(false);
    });
  });

  it("fetchProductBySlug() calls GET /catalog/products/:slug", async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: "p1" });

    await catalogService.fetchProductBySlug("trail-runner-pro");

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/catalog/products/trail-runner-pro",
      expect.any(Object),
    );
  });

  it("fetchProductVariants() calls GET /catalog/products/:id/variants", async () => {
    mockedApiFetch.mockResolvedValueOnce([]);

    await catalogService.fetchProductVariants("p1");

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/catalog/products/p1/variants",
      expect.any(Object),
    );
  });

  it("fetchCategoryTree() calls GET /catalog/categories", async () => {
    mockedApiFetch.mockResolvedValueOnce([]);

    await catalogService.fetchCategoryTree();

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/catalog/categories",
      expect.any(Object),
    );
  });

  it("fetchBrands() calls GET /catalog/brands", async () => {
    mockedApiFetch.mockResolvedValueOnce([]);

    await catalogService.fetchBrands();

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/catalog/brands",
      expect.any(Object),
    );
  });
});
