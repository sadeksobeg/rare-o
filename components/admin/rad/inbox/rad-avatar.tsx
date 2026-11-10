import { Link2, UserRound } from "lucide-react";
import { avatarGradientClass, avatarInitial } from "@/components/admin/rad/inbox/avatar-color";
import { cn } from "@/lib/utils";

/**
 * Named contacts → first letter. Nameless (masked phone only) → UserRound
 * icon so we never show a digit from the masked number as the avatar glyph.
 */
export function RadAvatar({
  id,
  name,
  size,
  className,
  linked,
  linkedLabel,
}: {
  id: string;
  name: string | null | undefined;
  size?: "sm" | "lg";
  className?: string;
  linked?: boolean;
  linkedLabel?: string;
}) {
  const trimmed = name?.trim() || "";
  // Stored displayName is sometimes an E.164 / masked phone — never use a digit as the glyph.
  const looksLikePhone = /^[+0-9٠-٩]/.test(trimmed) || /(?:\d.*){3,}/.test(trimmed);
  const hasName = trimmed.length > 0 && !looksLikePhone;
  return (
    <span
      className={cn("rad-avt", size === "sm" && "rad-sm", size === "lg" && "rad-lg", avatarGradientClass(id), className)}
      aria-hidden={!linked}
    >
      {hasName ? (
        avatarInitial(trimmed)
      ) : (
        <UserRound
          width={size === "lg" ? 28 : size === "sm" ? 14 : 18}
          height={size === "lg" ? 28 : size === "sm" ? 14 : 18}
          strokeWidth={1.5}
        />
      )}
      {linked ? (
        <span className="rad-lk" aria-label={linkedLabel}>
          <Link2 width={10} height={10} strokeWidth={2} aria-hidden />
        </span>
      ) : null}
    </span>
  );
}
