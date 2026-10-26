import Link from "next/link";
import { AudioLines } from "lucide-react";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="VibePage início">
      <span className="brand-mark">
        <AudioLines size={22} />
      </span>
      vibe<span className="brand-light">page</span>
      <span className="brand-dot">®</span>
    </Link>
  );
}
