import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/products/")({
  component: () => <div className="p-6">Products</div>,
});
