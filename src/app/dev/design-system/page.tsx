import { notFound } from "next/navigation";
import { DesignSystemGallery } from "@/components/ui/design-system-gallery";

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignSystemGallery />;
}
