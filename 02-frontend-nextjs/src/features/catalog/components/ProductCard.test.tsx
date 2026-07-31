import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import { ProductSummary } from "../types/catalog.types";

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
    primaryImageUrl: "https://img/1.jpg",
    ...overrides,
  };
}

describe("ProductCard", () => {
  it("renders the product name, brand, and formatted price", () => {
    render(<ProductCard product={makeProduct()} />);

    expect(screen.getByText("Trail Runner Pro")).toBeInTheDocument();
    expect(screen.getByText("Nike")).toBeInTheDocument();
    expect(screen.getByText("$129.98")).toBeInTheDocument();
  });

  it("links to the product detail page", () => {
    render(<ProductCard product={makeProduct()} />);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/products/trail-runner-pro",
    );
  });

  it("shows a fallback when there is no image", () => {
    render(<ProductCard product={makeProduct({ primaryImageUrl: null })} />);

    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  it("hides the rating when there are no ratings yet", () => {
    render(<ProductCard product={makeProduct({ ratingCount: 0 })} />);

    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });
});
