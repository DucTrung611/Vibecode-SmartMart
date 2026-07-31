import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import * as inventoryService from "../services/inventory.service";
import { StockBadge } from "./StockBadge";

jest.mock("../services/inventory.service");

const mockedFetchVariantStock =
  inventoryService.fetchVariantStock as jest.Mock;

function renderBadge(variantId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StockBadge variantId={variantId} />
    </QueryClientProvider>,
  );
}

describe("StockBadge", () => {
  beforeEach(() => {
    mockedFetchVariantStock.mockReset();
  });

  it("shows quantity available when in stock", async () => {
    mockedFetchVariantStock.mockResolvedValueOnce({
      variantId: "v1",
      quantityOnHand: 10,
      quantityReserved: 2,
      quantityAvailable: 8,
      updatedAt: "2026-01-01T00:00:00Z",
    });

    renderBadge("v1");

    await waitFor(() =>
      expect(screen.getByText("In stock (8)")).toBeInTheDocument(),
    );
  });

  it("shows out of stock when quantityAvailable is zero", async () => {
    mockedFetchVariantStock.mockResolvedValueOnce({
      variantId: "v1",
      quantityOnHand: 2,
      quantityReserved: 2,
      quantityAvailable: 0,
      updatedAt: "2026-01-01T00:00:00Z",
    });

    renderBadge("v1");

    await waitFor(() =>
      expect(screen.getByText("Out of stock")).toBeInTheDocument(),
    );
  });

  it("shows a neutral message when the fetch fails", async () => {
    mockedFetchVariantStock.mockRejectedValueOnce(new Error("not found"));

    renderBadge("missing");

    await waitFor(() =>
      expect(screen.getByText("Stock unavailable")).toBeInTheDocument(),
    );
  });
});
