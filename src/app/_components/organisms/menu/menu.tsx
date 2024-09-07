"use client";

import { pagesPath } from "@luna/constants/$path";
import { useAccount } from "@luna/context/account/account";
import { useAuthUser } from "@luna/context/auth-user/auth-user";
import { signOut } from "@luna/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./menu.module.scss";

export function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const { authUser } = useAuthUser();
  const { account } = useAccount();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const pathname = usePathname();
  useEffect(() => setIsOpen(false), [pathname]);

  if (!authUser) {
    return null;
  }

  return (
    <>
      <div
        className={`${styles.openbtn} ${isOpen ? styles.active : ""}`}
        onClick={toggleMenu}
      >
        { /* cssでハンバーガーメニューのアイコンを実装 */}
        <span></span>
        <span></span>
        <span></span>
      </div>
      <article className={`${styles.sitemap} ${isOpen ? styles.active : ""}`}>
        <div className={styles.sitemapContainer}>
          <div className={styles.inner}>
            <section>
              <ul> <li> <Link href={pagesPath.profile.$url().pathname}>プロフィール</Link> </li> </ul>
              {account &&
                <ul> <li> <Link href={pagesPath.timelines.$url().pathname}>投稿一覧</Link> </li> </ul>
              }

              <ul> <li> <button onClick={() => signOut()}>ログアウト</button> </li> </ul>
            </section>
          </div>
        </div>
      </article>
    </>
  );
}