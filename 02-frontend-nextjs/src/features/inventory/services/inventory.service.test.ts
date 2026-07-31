import { apiFetch } from "@/shared/lib/api-client";
import * as inventoryService from "./inventory.service";

jest.mock("@/shared/lib/api-client", () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.Mock;

describe("inventory.service", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("fetchVariantStock() calls GET /inventory/variants/:variantId uncached", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      variantId: "v1",
      quantityOnHand: 10,
      quantityReserved: 2,
      quantityAvailable: 8,
      updatedAt: "2026-01-01T00:00:00Z",
    });

    const result = await inventoryService.fetchVariantStock("v1");

    expect(mockedApiFetch).toHaveBeenCalledWith("/inventory/variants/v1", {
      cache: "no-store",
    });
    expect(result.quantityAvailable).toBe(8);
  });
});
