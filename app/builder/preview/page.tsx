import type { Metadata } from "next";
import { BuilderPreviewPage } from "@/components/builder/BuilderPreviewPage";

export const metadata: Metadata = {
  title: "Portfolio preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PreviewPage() {
  return <BuilderPreviewPage />;
}
