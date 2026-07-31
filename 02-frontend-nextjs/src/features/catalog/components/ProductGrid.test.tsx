import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as catalogService from "../services/catalog.service";
import { ProductListResult, ProductSummary } from "../types/catalog.types";
import { ProductGrid } from "./ProductGrid";

jest.mock("../services/catalog.service");

const mockedFetchProducts = catalogService.fetchProducts as jest.Mock;

function makeProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: "p1",
    name: "Trail Runner Pro",
    slug: "trail-runner-pro",
    status: "published",
    basePrice: 129.98,
    currencyCode: "USD",
    ratingAvg: 4.5,
    ratingCount: 10,
    brandName: "Nike",
    primaryImageUrl: null,
    ...overrides,
  };
}

function renderGrid(initialPage: ProductListResult) {
  // staleTime matters here: without it, initialData is immediately stale
  // and mounting triggers a redundant background refetch of page 1 (masking
  // the "Load more" behavior under test) — mirrors the real
  // shared/lib/query-client.ts config, not just test hygiene.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductGrid filters={{}} initialPage={initialPage} />
    </QueryClientProvider>,
  );
}

describe("ProductGrid", () => {
  beforeEach(() => {
    mockedFetchProducts.mockReset();
  });

  it("renders products from the initial (server-fetched) page", () => {
    renderGrid({ items: [makeProduct()], nextCursor: null, hasMore: false });

    expect(screen.getByText("Trail Runner Pro")).toBeInTheDocument();
    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no products", () => {
    renderGrid({ items: [], nextCursor: null, hasMore: false });

    expect(screen.getByText("No products found.")).toBeInTheDocument();
  });

  it("fetches the next page when Load more is clicked", async () => {
    mockedFetchProducts.mockResolvedValueOnce({
      items: [makeProduct({ id: "p2", name: "All-Terrain Hiker" })],
      nextCursor: null,
      hasMore: false,
    });

    renderGrid({
      items: [makeProduct()],
      nextCursor: "cursor-1",
      hasMore: true,
    });

    await userEvent.click(screen.getByText("Load more"));

    await waitFor(() =>
      expect(screen.getByText("All-Terrain Hiker")).toBeInTheDocument(),
    );
    // Both the original and the newly loaded product stay visible.
    expect(screen.getByText("Trail Runner Pro")).toBeInTheDocument();
    expect(mockedFetchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: "cursor-1" }),
    );
  });
});
