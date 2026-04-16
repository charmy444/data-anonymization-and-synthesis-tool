"use client";

import { usePathname, useRouter } from "next/navigation";

import { useLanguage } from "@/components/language-provider";
import { SlidingControl } from "@/components/sliding-control";

const labels = {
  ru: {
    home: "Главная",
    generate: "Generate",
    anonymize: "Anonymize",
    similar: "Similar",
  },
  en: {
    home: "Home",
    generate: "Generate",
    anonymize: "Anonymize",
    similar: "Similar",
  },
} as const;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = labels[language];

  const items = [
    { href: "/", label: t.home },
    { href: "/generate", label: t.generate },
    { href: "/anonymize", label: t.anonymize },
    { href: "/similar", label: t.similar },
  ];

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <nav className="site-header__nav" aria-label="Primary">
          <SlidingControl
            ariaLabel="Primary navigation"
            className="sliding-control--nav"
            items={items.map((item) => ({ id: item.href, label: item.label }))}
            value={pathname}
            onChange={(nextPath) => {
              if (nextPath !== pathname) {
                router.push(nextPath);
              }
            }}
          />
        </nav>

        <div className="language-toggle">
          <SlidingControl
            ariaLabel="Language"
            className="sliding-control--language"
            items={[
              { id: "ru", label: "RU" },
              { id: "en", label: "EN" },
            ]}
            value={language}
            onChange={(nextLanguage) => {
              if (nextLanguage === "ru" || nextLanguage === "en") {
                setLanguage(nextLanguage);
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}
