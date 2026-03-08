import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Layout from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";

const ContentSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export default function LayoutRoute() {
  return (
    <Layout>
      <Suspense fallback={<ContentSkeleton />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}
