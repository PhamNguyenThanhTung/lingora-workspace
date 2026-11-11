'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '../landing.module.css';

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const desktopActionsRef = useRef<HTMLDivElement>(null);
  const wasMobileRef = useRef(false);
  const lastHeaderFocusRef = useRef<HTMLElement | null>(null);

  // Close mobile menu on Escape key press and return focus to toggle button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        toggleBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Keep keyboard focus on a visible, equivalent control across the breakpoint.
  useEffect(() => {
    wasMobileRef.current = window.innerWidth < 768;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      lastHeaderFocusRef.current = target instanceof HTMLElement && headerRef.current?.contains(target)
        ? target
        : null;
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        lastHeaderFocusRef.current = null;
      }
    };

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const wasMobile = wasMobileRef.current;
      if (isMobile === wasMobile) return;
      wasMobileRef.current = isMobile;

      const activeElement = document.activeElement;
      const previouslyFocusedElement = activeElement instanceof HTMLElement && headerRef.current?.contains(activeElement)
        ? activeElement
        : activeElement === document.body
          ? lastHeaderFocusRef.current
          : null;
      if (wasMobile && !isMobile) {
        const focusedLink = previouslyFocusedElement instanceof HTMLAnchorElement
          ? previouslyFocusedElement
          : previouslyFocusedElement?.closest('a');
        const href = focusedLink?.getAttribute('href');
        const wasInMobileMenu = Boolean(previouslyFocusedElement && mobileNavRef.current?.contains(previouslyFocusedElement));
        const wasOnToggle = previouslyFocusedElement === toggleBtnRef.current;

        setIsMenuOpen(false);
        if (wasInMobileMenu || wasOnToggle) {
          window.requestAnimationFrame(() => {
            const desktopEquivalent = href
              ? [
                  ...Array.from(desktopNavRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
                  ...Array.from(desktopActionsRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
                ].find((link) => link.getAttribute('href') === href)
              : null;
            (desktopEquivalent ?? brandRef.current)?.focus();
          });
        }
      } else {
        const wasInDesktopNavigation = Boolean(
          previouslyFocusedElement && (
            desktopNavRef.current?.contains(previouslyFocusedElement) ||
            desktopActionsRef.current?.contains(previouslyFocusedElement)
          )
        );
        if (wasInDesktopNavigation) {
          window.requestAnimationFrame(() => toggleBtnRef.current?.focus());
        }
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const targetId = event.currentTarget.getAttribute('href')?.slice(1);
    setIsMenuOpen(false);

    if (targetId) {
      window.requestAnimationFrame(() => {
        const section = document.getElementById(targetId);
        const headingId = section?.getAttribute('aria-labelledby');
        if (headingId) {
          document.getElementById(headingId)?.focus({ preventScroll: true });
        }
      });
    }
  };

  return (
    <header ref={headerRef} className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <a ref={brandRef} href="#" className={styles.brandLink} aria-label="Lingora — Trang chủ giới thiệu">
            <span className={styles.brandMark} aria-hidden="true">
              L<span className={styles.brandMarkDot} />
            </span>
            <span className={styles.brandCopy}>
              <span className={styles.brandName}>Lingora</span>
              <span className={styles.brandTagline}>Nền tảng học ngoại ngữ</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav ref={desktopNavRef} className={styles.headerNav} aria-label="Điều hướng trang giới thiệu">
            <a href="#cach-hoc" className={styles.navLink}>Cách học</a>
            <a href="#trai-nghiem" className={styles.navLink}>Trải nghiệm</a>
            <a href="#faq" className={styles.navLink}>Câu hỏi thường gặp</a>
          </nav>

          {/* Desktop Action CTAs */}
          <div ref={desktopActionsRef} className={styles.headerActions}>
            <Link
              href="/login"
              prefetch={false}
              className={styles.btnLogin}
              id="headerLoginBtn"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              prefetch={false}
              className={styles.btnRegister}
              id="headerRegisterBtn"
            >
              Bắt đầu học
            </Link>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            ref={toggleBtnRef}
            id="mobileMenuToggleBtn"
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="mobileLandingNav"
            aria-label={isMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          >
            {isMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
        {/* Keep the disclosure inside the sticky header so it follows the control while scrolling. */}
        {isMenuOpen && (
          <div
            id="mobileLandingNav"
            ref={mobileNavRef}
            className={styles.mobileNavOpen}
            role="navigation"
            aria-label="Menu điều hướng di động"
          >
            <div className={styles.mobileNavLinks}>
              <a href="#cach-hoc" className={styles.mobileNavLink} onClick={handleNavClick}>
                Cách học
              </a>
              <a href="#trai-nghiem" className={styles.mobileNavLink} onClick={handleNavClick}>
                Trải nghiệm học tập
              </a>
              <a href="#faq" className={styles.mobileNavLink} onClick={handleNavClick}>
                Câu hỏi thường gặp
              </a>
            </div>
            <div className={styles.mobileNavActions}>
              <Link
                href="/register"
                prefetch={false}
                className={styles.mobileBtnRegister}
                onClick={handleNavClick}
              >
                Bắt đầu học ngay
              </Link>
              <Link
                href="/login"
                prefetch={false}
                className={styles.mobileBtnLogin}
                onClick={handleNavClick}
              >
                Đăng nhập tài khoản
              </Link>
            </div>
          </div>
        )}
    </header>
  );
}
