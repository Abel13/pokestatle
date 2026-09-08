import { Suspense } from "react";
import { GameBoard } from "@/components/game/game-board";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  return (
    <Suspense fallback={<GameBoardSkeleton />}>
      <GameBoard />
    </Suspense>
  );
}

function GameBoardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="mx-auto h-10 w-64" />
      <Skeleton className="mx-auto h-6 w-80" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
