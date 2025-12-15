'use client';

import styles from './About.module.css';

export interface AboutContent {
    hero: { title: string; subtitle: string; image: string };
    facts: { founded: string; location: string; forms: string; hours: string };
    whoWeAre: { text: string; mission: string };
    timeline: { year: string; text: string }[];
    ensembles: { title: string; description: string; image?: string }[];
    contact: { address: string; phone: string; email: string };
    cta: { text: string; buttonText: string };
}

export default function AboutView({ content, lang }: { content: AboutContent; lang: 'en' | 'sq' }) {
    return (
        <div className={styles.container}>
            {/* Hero */}
            <section className={styles.hero} style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${content.hero.image})` }}>
                <div className={styles.heroContent}>
                    <h1>{content.hero.title}</h1>
                    <p>{content.hero.subtitle}</p>
                </div>
            </section>

            {/* Quick Facts */}
            <section className={styles.facts}>
                <div className={styles.factItem}>📅 {content.facts.founded}</div>
                <div className={styles.factItem}>📍 {content.facts.location}</div>
                <div className={styles.factItem}>🎭 {content.facts.forms}</div>
                <div className={styles.factItem}>🕒 {content.facts.hours}</div>
            </section>

            {/* Who We Are */}
            <section className={styles.section}>
                <div className={styles.twoColumn}>
                    <div>
                        <h2>{lang === 'en' ? 'Who We Are' : 'Kush Jemi'}</h2>
                        <p>{content.whoWeAre.text}</p>
                    </div>
                    <div className={styles.highlight}>
                        <h3>{lang === 'en' ? 'Our Mission' : 'Misioni'}</h3>
                        <p>{content.whoWeAre.mission}</p>
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className={styles.section}>
                <h2>{lang === 'en' ? 'Our History' : 'Historia Jonë'}</h2>
                <div className={styles.timeline}>
                    {content.timeline.map((item, i) => (
                        <div key={i} className={styles.timelineItem}>
                            <strong>{item.year}</strong>
                            <p>{item.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Ensembles */}
            <section className={styles.section}>
                <h2>{lang === 'en' ? 'Artistic Bodies' : 'Trupat Artistikë'}</h2>
                <div className={styles.grid}>
                    {content.ensembles.map((item, i) => (
                        <div key={i} className={styles.card}>
                            {item.image && <img src={item.image} alt={item.title} className={styles.cardImage} />}
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Map & Contact */}
            <section className={styles.section}>
                <h2>{lang === 'en' ? 'Visit Us' : 'Na Vizitoni'}</h2>
                <div className={styles.twoColumn}>
                    <div className={styles.contactPanel}>
                        <p><strong>📍</strong> {content.contact.address}</p>
                        <p><strong>📞</strong> {content.contact.phone}</p>
                        <p><strong>✉️</strong> {content.contact.email}</p>
                        <div className={styles.buttons}>
                            <a href="mailto:sekretaria@tkob.gov.al" className={styles.buttonOutline}>Contact Us</a>
                            <a href="/" className={styles.buttonOutline}>See Calendar</a>
                        </div>
                    </div>
                    <div className={styles.map}>
                        {/* Static placeholder or iframe */}
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.326265737526!2d19.8160!3d41.3275!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1350310464201a7f%3A0x6e3c0326402421!2sOpera%20and%20Ballet%20Theatre!5e0!3m2!1sen!2sal!4v1600000000000!5m2!1sen!2sal"
                            width="100%" height="300" style={{ border: 0 }} loading="lazy">
                        </iframe>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.cta}>
                <h2>{content.cta.text}</h2>
                <a href="/" className={styles.button}>{content.cta.buttonText}</a>
            </section>
        </div>
    );
}
