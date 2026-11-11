import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingHeader } from './_components/LandingHeader.tsx';
import { LearningPreview } from './_components/LearningPreview.tsx';
import styles from './landing.module.css';

export const metadata: Metadata = {
  title: 'Lingora — Học từng bước, tiến bộ mỗi ngày',
  description: 'Nền tảng học ngoại ngữ theo lộ trình tinh gọn, luyện tập có phản hồi giải thích chi tiết và ôn tập từ vựng ngắt quãng hiệu quả.',
  openGraph: {
    title: 'Lingora — Học từng bước, tiến bộ mỗi ngày',
    description: 'Nền tảng học ngoại ngữ theo lộ trình tinh gọn, luyện tập có phản hồi giải thích chi tiết và ôn tập từ vựng ngắt quãng hiệu quả.',
    type: 'website',
  },
};

export default function RootLandingPage() {
  return (
    <div className={styles.landingRoot}>
      {/* Skip to Main Content for Accessibility */}
      <a href="#main-content" className={styles.skipLink}>
        Chuyển đến nội dung chính
      </a>

      {/* Header */}
      <LandingHeader />

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className={styles.heroSection} aria-labelledby="hero-heading">
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrowPill}>
                <span aria-hidden="true">✦</span>
                <span>Học ngoại ngữ cùng Lingora</span>
              </div>

              <h1 id="hero-heading" className={styles.heroTitle}>
                Học từng bài nhỏ.<br />
                <span className={styles.heroTitleAccent}>Tiến bộ qua từng ngày.</span>
              </h1>

              <p className={styles.heroDescription}>
                Khám phá bài học theo lộ trình, luyện tập với phản hồi rõ ràng và ôn lại từ vựng đã học. Lingora giúp bạn duy trì việc học qua những bước nhỏ, dễ theo dõi.
              </p>

              <div className={styles.heroCtaRow}>
                <Link
                  href="/register"
                  prefetch={false}
                  className={styles.heroPrimaryBtn}
                  id="heroRegisterBtn"
                >
                  <span>Bắt đầu học ngay</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>

                <a
                  href="#cach-hoc"
                  className={styles.heroSecondaryBtn}
                  id="heroExploreBtn"
                >
                  Khám phá cách học
                </a>
              </div>

              <div className={styles.heroReassurance}>
                <span>Bài học có cấu trúc</span>
                <span className={styles.reassuranceDot} aria-hidden="true" />
                <span>Luyện tập có phản hồi</span>
                <span className={styles.reassuranceDot} aria-hidden="true" />
                <span>Ôn từ vựng ngắt quãng</span>
              </div>
            </div>

            {/* Hero Interactive Learning Preview */}
            <div className={styles.heroPreviewCol}>
              <LearningPreview />
            </div>
          </div>
        </section>

        {/* Benefits / Product Experience Section */}
        <section id="trai-nghiem" className={`${styles.section} ${styles.sectionWhite}`} aria-labelledby="experience-heading">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionEyebrow}>Trải nghiệm học tập</span>
              <h2 id="experience-heading" tabIndex={-1} className={styles.sectionTitle}>
                Được thiết kế cho sự bền bỉ
              </h2>
              <p className={styles.sectionSubtitle}>
                Mỗi bài học được thiết kế tinh gọn để bạn tập trung và không cảm thấy quá tải.
              </p>
            </div>

            <div className={styles.benefitsGrid}>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIconBox} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                </div>
                <h3 className={styles.benefitTitle}>Biết mình nên học gì tiếp theo</h3>
                <p className={styles.benefitDescription}>
                  Lộ trình bài học chia nhỏ, mạch lạc từ cơ bản đến nâng cao. Bạn luôn nắm rõ vị trí và mục tiêu kế tiếp mà không phải băn khoăn.
                </p>
              </div>

              <div className={styles.benefitCard}>
                <div className={styles.benefitIconBox} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <h3 className={styles.benefitTitle}>Hiểu câu trả lời, không chỉ xem điểm</h3>
                <p className={styles.benefitDescription}>
                  Mỗi bài luyện tập đều đi kèm lời giải thích ngữ nghĩa và cấu trúc cụ thể, giúp bạn hiểu cặn kẽ bản chất thay vì đoán mò.
                </p>
              </div>

              <div className={styles.benefitCard}>
                <div className={styles.benefitIconBox} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4" />
                    <path d="M12 18v4" />
                    <path d="m4.93 4.93 2.83 2.83" />
                    <path d="m16.24 16.24 2.83 2.83" />
                    <path d="M2 12h4" />
                    <path d="M18 12h4" />
                    <path d="m4.93 19.07 2.83-2.83" />
                    <path d="m16.24 7.76 2.83-2.83" />
                  </svg>
                </div>
                <h3 className={styles.benefitTitle}>Ôn lại từ đã học đúng lúc</h3>
                <p className={styles.benefitDescription}>
                  Hệ thống tự động đưa các từ vựng đã học vào danh sách ôn tập ngắt quãng (SRS) khi đến hạn, giúp bạn ghi nhớ sâu và lâu bền.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="cach-hoc" className={styles.section} aria-labelledby="how-heading">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionEyebrow}>Quy trình học tập</span>
              <h2 id="how-heading" tabIndex={-1} className={styles.sectionTitle}>
                Học cùng Lingora như thế nào?
              </h2>
              <p className={styles.sectionSubtitle}>
                Ba bước mạch lạc giúp bạn bắt đầu và duy trì tiến độ dễ dàng.
              </p>
            </div>

            <div className={styles.stepsGrid}>
              <div className={styles.stepCard}>
                <div className={styles.stepNumber} aria-label="Bước 1">01</div>
                <h3 className={styles.stepTitle}>Chọn điểm bắt đầu</h3>
                <p className={styles.stepDescription}>
                  Bắt đầu từ những bài học vỡ lòng cơ bản nhất hoặc tự lựa chọn cấp độ phù hợp với trình độ hiện tại của bạn trong khóa học.
                </p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepNumber} aria-label="Bước 2">02</div>
                <h3 className={styles.stepTitle}>Học và luyện tập</h3>
                <p className={styles.stepDescription}>
                  Nắm bắt từ vựng trọng tâm, luyện tập qua các câu hỏi trắc nghiệm tương tác và nhận kết quả phản hồi tức thì.
                </p>
              </div>

              <div className={styles.stepCard}>
                <div className={styles.stepNumber} aria-label="Bước 3">03</div>
                <h3 className={styles.stepTitle}>Ôn từ để ghi nhớ</h3>
                <p className={styles.stepDescription}>
                  Thuật toán ghi nhớ tự động chọn lọc các từ đã học đến hạn ôn tập, giúp bạn củng cố phản xạ mà không tốn nhiều thời gian.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className={`${styles.section} ${styles.sectionWhite}`} aria-labelledby="faq-heading">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionEyebrow}>Giải đáp thắc mắc</span>
              <h2 id="faq-heading" tabIndex={-1} className={styles.sectionTitle}>
                Câu hỏi thường gặp
              </h2>
              <p className={styles.sectionSubtitle}>
                Những điều bạn cần biết trước khi bắt đầu học tập tại Lingora.
              </p>
            </div>

            <div className={styles.faqList}>
              <details className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <span>Tôi bắt đầu như thế nào?</span>
                  <svg className={styles.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className={styles.faqAnswer}>
                  Bạn chỉ cần tạo một tài khoản học viên miễn phí, xác nhận email theo hướng dẫn và đăng nhập để chọn lộ trình và bắt đầu bài học đầu tiên.
                </div>
              </details>

              <details className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <span>Tôi có cần làm bài kiểm tra đầu vào không?</span>
                  <svg className={styles.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className={styles.faqAnswer}>
                  Bạn có thể bắt đầu ngay theo lộ trình mặc định từ mức cơ bản hoặc chủ động lựa chọn cấp độ phù hợp trong khóa học của mình.
                </div>
              </details>

              <details className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <span>Sau khi làm bài tập, tôi nhận được gì?</span>
                  <svg className={styles.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className={styles.faqAnswer}>
                  Hệ thống cung cấp kết quả bài làm cùng lời giải thích chi tiết cho từng phương án, giúp bạn hiểu rõ ngữ cảnh và cách dùng từ chính xác.
                </div>
              </details>

              <details className={styles.faqItem}>
                <summary className={styles.faqSummary}>
                  <span>Lingora giúp tôi ôn từ vựng ra sao?</span>
                  <svg className={styles.faqChevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className={styles.faqAnswer}>
                  Các từ vựng cốt lõi từ các bài học bạn đã hoàn thành sẽ được lưu lại. Thuật toán ôn tập ngắt quãng sẽ tự động đưa các từ đến hạn vào phiên ôn tập khi bạn bắt đầu ôn.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className={styles.ctaSection} aria-labelledby="cta-heading">
          <div className={styles.container}>
            <div className={styles.ctaCard}>
              <h2 id="cta-heading" className={styles.ctaTitle}>
                Bắt đầu từ bài học đầu tiên của bạn.
              </h2>
              <p className={styles.ctaDescription}>
                Dành 10 phút mỗi ngày để củng cố vốn từ và rèn luyện phản xạ ngôn ngữ cùng Lingora.
              </p>
              <div className={styles.ctaActions}>
                <Link
                  href="/register"
                  prefetch={false}
                  className={styles.ctaPrimaryBtn}
                  id="finalCtaRegisterBtn"
                >
                  Tạo tài khoản học viên
                </Link>
                <Link
                  href="/login"
                  prefetch={false}
                  className={styles.ctaSecondaryLink}
                  id="finalCtaLoginLink"
                >
                  Đã có tài khoản? Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer} role="contentinfo">
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <a href="#" className={styles.brandLink} aria-label="Lingora">
                <span className={styles.brandMark} aria-hidden="true">
                  L<span className={styles.brandMarkDot} />
                </span>
                <span className={styles.brandCopy}>
                  <span className={styles.brandName}>Lingora</span>
                  <span className={styles.brandTagline}>Nền tảng học ngoại ngữ</span>
                </span>
              </a>
              <p className={styles.footerDesc}>
                Học ngoại ngữ theo lộ trình tinh gọn, rèn luyện qua các bài tập có phản hồi giải thích và ghi nhớ bền lâu với ôn tập ngắt quãng.
              </p>
            </div>

            <div className={styles.footerNav}>
              <div className={styles.footerCol}>
                <span className={styles.footerColTitle}>Khám phá</span>
                <a href="#cach-hoc" className={styles.footerLink}>Cách học</a>
                <a href="#trai-nghiem" className={styles.footerLink}>Trải nghiệm</a>
                <a href="#faq" className={styles.footerLink}>Câu hỏi thường gặp</a>
              </div>

              <div className={styles.footerCol}>
                <span className={styles.footerColTitle}>Tài khoản</span>
                <Link href="/login" prefetch={false} className={styles.footerLink}>
                  Đăng nhập
                </Link>
                <Link href="/register" prefetch={false} className={styles.footerLink}>
                  Đăng ký học viên
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div>© 2026 Lingora. Nền tảng học ngoại ngữ.</div>
            <div>Bản quyền thuộc về Lingora.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
