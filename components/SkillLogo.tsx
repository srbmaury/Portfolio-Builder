"use client";

import Image from "next/image";
import { useState } from "react";
import { skillIconUrl, skillInitials } from "@/lib/skill-icons";

/**
 * Logos come from a third-party icon CDN, so a slug can disappear at any time.
 * When the request fails we fall back to the skill's initials instead of
 * leaving a broken image in the portfolio.
 */
export function SkillLogo({ skill }: { skill: string }) {
  const url = skillIconUrl(skill);
  const [failed, setFailed] = useState(false);

  return (
    <span className="skill-logo">
      {url && !failed ? (
        <Image
          src={url}
          alt=""
          width={34}
          height={34}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{skillInitials(skill)}</span>
      )}
    </span>
  );
}
