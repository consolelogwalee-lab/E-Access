export const metadata = { title: "Privacy Policy | E-Access" };

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 text-[19px] font-bold text-neutral-900">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 text-[15px] leading-[1.75] text-neutral-600">{children}</p>
);

export default function PrivacyPage() {
  return (
    <article>
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E2A600]">Legal</span>
      <h1 className="display mt-3 text-[32px] leading-[1.2] text-neutral-950 md:text-[40px]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-400">Last updated: July 2026</p>

      <P>
        E-Access is operated by T-Prime Development (&ldquo;we&rdquo;, &ldquo;us&rdquo;), Port Harcourt, Nigeria.
        This policy explains what personal information we collect on the E-Access platform, why we collect it,
        and the choices you have. It is written to comply with the Nigeria Data Protection Act 2023 (NDPA) and
        the Nigeria Data Protection Regulation (NDPR).
      </P>

      <H>Information we collect</H>
      <P>
        Account information: your name, email address, and password (stored only as a secure cryptographic hash,
        never in readable form). Optional profile details: phone and WhatsApp numbers, agency information if you
        apply to become a verified agent, and your property preferences.
      </P>
      <P>
        Activity on the platform: listings you save, searches you save, offers, inspection bookings, messages,
        payment plans you choose to track, and property requests you submit.
      </P>
      <P>
        Documents and photos: when you use the property and document validation service or submit a listing, you
        upload documents (such as survey plans or certificates of occupancy) and photos. These are stored in
        access-controlled cloud storage and are visible only to you and the E-Access verification team, including
        legal partners engaged for verification.
      </P>

      <H>How we use your information</H>
      <P>
        To operate the platform: creating your account, verifying your email, showing you listings, processing
        offers, running validations, and sending you notifications about activity that concerns you. To improve
        trust and safety: verifying documents, screening agents, and preventing fraud. We do not sell your
        personal information to anyone.
      </P>

      <H>Emails and communication</H>
      <P>
        We send transactional emails (verification codes, password resets, and updates on your offers,
        transactions, and validation requests). Where you provide a WhatsApp number, we may contact you on
        WhatsApp about services you requested.
      </P>

      <H>How long we keep information</H>
      <P>
        Account data is kept while your account is active. Validation records and issued certificates are kept
        for as long as needed to stand behind our verification. You can request deletion of your account and
        associated personal data by contacting us; we will honour it subject to legal record-keeping obligations.
      </P>

      <H>Security</H>
      <P>
        Passwords are hashed, sessions expire automatically, uploaded documents are stored in private storage
        reachable only through short-lived signed links, and repeated failed logins are throttled. No system is
        perfectly secure, but we treat your documents with the seriousness Nigerian land matters deserve.
      </P>

      <H>Your rights</H>
      <P>
        Under the NDPA you may request access to, correction of, or deletion of your personal data, and you may
        withdraw consent for optional processing. Contact us at hello.eaccess@gmail.com and we will respond
        within 30 days.
      </P>

      <H>Contact</H>
      <P>
        T-Prime Development / E-Access, Port Harcourt, Nigeria. Email: hello.eaccess@gmail.com.
      </P>
    </article>
  );
}
