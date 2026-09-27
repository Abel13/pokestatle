import { Suspense } from "react";
import {
  PlayHub,
  PlayHubSkeleton,
} from "@/components/game/play-hub";

export default function ResizeThemPage() {
  return (
    <Suspense fallback={<PlayHubSkeleton />}>
      <PlayHub initialMode="resize" />
    </Suspense>
  );
}
