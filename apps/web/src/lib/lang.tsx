import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, hi: string) => string;
}

const Ctx = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("mm_lang") : null;
    return (stored as Lang) || "en";
  });
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("mm_lang", lang);
  }, [lang]);
  return (
    <Ctx.Provider value={{ lang, setLang, t: (en, hi) => (lang === "hi" ? hi : en) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang() {
  return useContext(Ctx);
}
