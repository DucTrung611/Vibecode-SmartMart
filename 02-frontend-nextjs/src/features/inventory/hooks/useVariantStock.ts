import { useQuery } from "@tanstack/react-query";
import * as inventoryService from "../services/inventory.service";

export function useVariantStock(variantId: string) {
  return useQuery({
    queryKey: ["inventory", "variant-stock", variantId],
    queryFn: () => inventoryService.fetchVariantStock(variantId),
    staleTime: 30_000,
    retry: false,
  });
}
