// src/components/Header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/", label: "RECHERCHE" },
  { href: "/profile", label: "PROFIL" },
];

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        {/* Logo image */}
        <a href="/" className="site-header__brand" aria-label="Accueil">
          <img src="/images/quetes2.png" alt="" className="site-header__logo" />
        </a>

        {/* Nav */}
        <nav className="site-header__nav" aria-label="Navigation principale">
          {NAV.map((item, i) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`site-header__link ${active ? "is-active" : ""}`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Espace utilisateur */}
        <div className="site-header__user" ref={menuRef}>
          {status === "loading" ? null : status !== "authenticated" ? (
            <button
              className="btn btn--solid"
              onClick={() => signIn("google")}
              aria-label="Se connecter avec Google"
            >
              Se connecter
            </button>
          ) : (
            <div className="userchip">
              <button
                className="userchip__btn"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                title={session.user?.name ?? ""}
              >
                <img
                  src={session.user?.image ?? "/images/classes/cra.png"}
                  alt=""
                  className="userchip__avatar"
                />
                <span className="userchip__name">
                  {session.user?.name ?? "Compte"}
                </span>
                <svg
                  className={`userchip__chev ${open ? "rot" : ""}`}
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                >
                  <path
                    d="M7 10l5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>

              {open && (
                <div className="usermenu" role="menu">
                  <a className="usermenu__item" href="/" role="menuitem">
                    Recherche
                  </a>
                  <a className="usermenu__item" href="/profile" role="menuitem">
                    Profil
                  </a>
                  <button
                    className="usermenu__item usermenu__item--danger"
                    onClick={() => signOut()}
                    role="menuitem"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
