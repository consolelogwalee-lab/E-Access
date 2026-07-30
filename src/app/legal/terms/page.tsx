export const metadata = { title: "Terms of Use | E-Access" };

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 text-[19px] font-bold text-neutral-900">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 text-[15px] leading-[1.75] text-neutral-600">{children}</p>
);

export default function TermsPage() {
  return (
    <article>
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E2A600]">Legal</span>
      <h1 className="display mt-3 text-[32px] leading-[1.2] text-neutral-950 md:text-[40px]">Terms of Use</h1>
      <p className="mt-2 text-sm text-neutral-400">Last updated: July 2026</p>

      <P>
        These terms govern your use of the E-Access platform, operated by T-Prime Development, Port Harcourt,
        Nigeria. By creating an account or using the platform you agree to them.
      </P>

      <H>What E-Access is (and is not)</H>
      <P>
        E-Access is a property discovery and verification platform. We list properties, verify documents and
        developers to the best of our professional ability, connect buyers with verified agents and developers,
        and track transaction progress. E-Access is not a bank, an escrow service, or a payment processor:
        no money moves through the platform. All payments for property happen directly between you and the
        seller, developer, or agent, outside E-Access.
      </P>

      <H>Verification and its limits</H>
      <P>
        Our &ldquo;Verified&rdquo; badge and Certificates of Verification reflect checks performed at a point in
        time on the documents and information made available to us, including registry checks conducted with
        legal partners. They are professional opinions offered in good faith, not a guarantee of title and not a
        substitute for your own independent legal advice. We strongly advise engaging your own solicitor before
        completing any purchase.
      </P>

      <H>Your account and conduct</H>
      <P>
        Keep your login details private; you are responsible for activity on your account. You agree not to post
        false listings, upload forged documents, impersonate others, or use the platform for any unlawful
        purpose. Submitting forged land documents is a crime in Nigeria; we cooperate with law enforcement and
        will terminate accounts involved in fraud.
      </P>

      <H>Listings, offers and transactions</H>
      <P>
        Listing a property does not guarantee it will be verified or sold. Making an offer is an expression of
        interest, not a binding contract; a contract only arises through documents you sign directly with the
        seller. Transaction tracking on E-Access is a coordination service and creates no liability for us for
        the underlying deal.
      </P>

      <H>Verified agents</H>
      <P>
        Agent verification confirms identity and registration details at the time of approval. Agents are
        independent businesses, not employees or partners of E-Access, and we are not a party to agreements you
        make with them.
      </P>

      <H>Content and intellectual property</H>
      <P>
        You retain rights to the documents and photos you upload and grant us a licence to use them for
        verification and for displaying your listings. The E-Access name, logo, and platform design are the
        property of T-Prime Development.
      </P>

      <H>Liability</H>
      <P>
        The platform is provided &ldquo;as is&rdquo;. To the maximum extent permitted by Nigerian law, our
        liability arising from your use of the platform is limited to fees you paid us (if any) in the twelve
        months before the claim. We are not liable for losses arising from transactions conducted outside the
        platform.
      </P>

      <H>Changes and termination</H>
      <P>
        We may update these terms; continued use after an update is acceptance. We may suspend accounts that
        breach these terms. You may close your account at any time.
      </P>

      <H>Governing law</H>
      <P>
        These terms are governed by the laws of the Federal Republic of Nigeria, and disputes are subject to the
        jurisdiction of Nigerian courts.
      </P>

      <H>Contact</H>
      <P>T-Prime Development / E-Access, Port Harcourt, Nigeria. Email: hello.eaccess@gmail.com.</P>
    </article>
  );
}
