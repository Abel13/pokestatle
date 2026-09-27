import { redirect } from "next/navigation";

/** Legacy Size route → Resize them. */
export default function ScaleRedirectPage() {
  redirect("/resize-them");
}
