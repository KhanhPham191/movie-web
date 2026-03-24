import type { Metadata } from "next";
import SearchClientPage from "./search-client";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasQuery = Boolean(params.q?.trim());

  return {
    robots: {
      index: !hasQuery,
      follow: true,
    },
  };
}

export default function SearchPage() {
  return <SearchClientPage />;
}
