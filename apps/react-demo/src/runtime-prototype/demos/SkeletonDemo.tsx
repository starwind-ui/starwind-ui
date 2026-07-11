import { useRuntimePrototypeContext } from "../context";
import { Skeleton } from "../kit";

export function SkeletonDemo() {
  const { skeletonRefSlot, setSkeletonRef } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4" id="react-runtime-skeleton-demo">
      <h2 className="font-heading text-xl font-semibold">Skeleton</h2>
      <div className="flex max-w-sm items-center gap-3">
        <Skeleton
          ref={setSkeletonRef}
          className="runtime-skeleton-custom size-12 rounded-full"
          aria-hidden="true"
        />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" aria-hidden="true" />
          <Skeleton className="h-3 w-40" aria-hidden="true" />
        </div>
      </div>
      <p className="sr-only" data-runtime-skeleton-ref>
        {skeletonRefSlot}
      </p>
    </section>
  );
}
