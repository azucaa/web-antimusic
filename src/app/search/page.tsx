import { Suspense } from "react";
import SearchClient from "./SearchClient";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchClient />
    </Suspense>
  );
}

function SearchSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-purple-400">
      <Loader2 className="animate-spin text-purple-600" size={32} />
      <span className="text-xs font-bold uppercase tracking-widest">Loading Search Workspace...</span>
    </div>
  );
}
export const dynamic = 'force-dynamic';
