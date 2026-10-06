export type LegalDocId = "privacy" | "terms";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
}

export interface LegalDoc {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
  contactEmail: string;
}

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  privacy: {
    title: "Privacy Policy",
    updated: "Last updated July 7, 2026",
    contactEmail: "privacy@sqftgo.com",
    sections: [
      {
        title: "Information we collect",
        paragraphs: [
          "At SqftGo, we collect information to provide better services to all our users. The types of personal information we collect include:",
        ],
        bullets: [
          "Personal identifiers: name, email, phone number and login credentials submitted during sign-up or enquiry forms.",
          "Usage details: interactions with listings, favourite saves, searches, view history and relocation forms.",
          "Professional details: license numbers, firm name, website and office address for verified brokers in our directory.",
        ],
      },
      {
        title: "How we protect your data",
        paragraphs: [
          "Your security is our priority. We implement modern, high-grade technical and organizational safeguards to ensure data safety:",
        ],
        bullets: [
          "All search logs, database endpoints and profile data transmissions are secured under encrypted SSL / TLS channels.",
          "Escrow tokens and verified title deed documents are stored in secure cloud containers accessible only to authorized RERA vetting coordinators.",
          "We never sell or distribute your private search budget profiles or relocation details to third-party advertising networks.",
        ],
      },
      {
        title: "Data sharing & vetting",
        paragraphs: [
          "When you submit a contact request to an Agent, Broker, or Builder in our Directory, we share your submitted name, phone number, and email address with that partner solely to facilitate the transaction.",
        ],
        note: "We vet all listed partners and ensure they adhere to strict RERA compliance guidelines, but recommend checking direct credential profiles before signing deeds.",
      },
      {
        title: "Cookies & tracking",
        paragraphs: [
          "We use strictly necessary cookies to maintain session integrity and performance cookies to understand how visitors engage with our listings. We do not use cross-site tracking or fingerprinting technologies.",
        ],
        bullets: [
          "Essential cookies (always active): required for authentication, session management and security.",
          "Analytics cookies (optional): aggregate page views and listing interaction data. Opt-out available.",
        ],
      },
      {
        title: "Data retention",
        paragraphs: [
          "We retain personal data only for as long as necessary to fulfil the purpose for which it was collected, comply with applicable Indian data protection laws, and resolve disputes or enforce our agreements. Inquiry records are purged after 24 months of inactivity. Dealer accounts are archived for 5 years post-termination in compliance with RERA audit requirements. You may request earlier deletion at any time by contacting our privacy desk.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "As a user of SqftGo, you retain the following data rights which you may exercise at any time by contacting our privacy officer:",
        ],
        bullets: [
          "Access your data",
          "Correct inaccuracies",
          "Request deletion",
          "Withdraw consent",
          "Data portability",
          "Raise a complaint",
        ],
      },
      {
        title: "Contact privacy officer",
        paragraphs: [
          "For any questions regarding your data logs, cookies management, or requests to purge your profile records from our databases, please contact the SQFTGO Privacy & Security Desk at privacy@sqftgo.com or +91 98290 55555.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "Effective July 7, 2026",
    contactEmail: "legal@sqftgo.com",
    intro:
      "Please read these Terms carefully. By accessing or using SqftGo (SQFTGO.COM), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.",
    sections: [
      {
        title: "Scope & use of platform",
        paragraphs: [
          "Welcome to SqftGo (SQFTGO.COM). These Terms of Service govern your access to and use of our property marketplace, regional directories, and relocation concierge services. By browsing our verified listings or submitting enquiries, you agree to comply with these terms and conditions in their entirety.",
          "SqftGo operates exclusively as a property listing and connection platform. We do not act as a real estate agent, broker, legal advisor, or financial institution in any transaction.",
        ],
      },
      {
        title: "RERA compliance & listings vetting",
        paragraphs: [
          "SqftGo acts as a vetted regional property directory. While we execute structural checks, title deed inspections, and require RERA certification numbers for listing brokers and developers:",
        ],
        bullets: [
          "Users are legally obligated to execute complete independent verification of RERA details and title documents before signing lease tokens or sale deeds.",
          "SqftGo does not charge or handle advance lease tokens for listings unless facilitated under official escrow partner accounts.",
          "We hold the right to pull listings or purge dealer accounts immediately upon receiving warnings of RERA licensing issues or deed title discrepancy alerts.",
        ],
      },
      {
        title: "Broker & service partner terms",
        paragraphs: [
          "Directory partners, including architects, agents, decorators, and vastu consultants, must submit accurate firm registration coordinates and agree to prompt audits of their credentials.",
        ],
        note: "Zero tolerance: false representation, RERA check spoofing, or user complaint spikes will result in immediate permanent listing termination without token refunds.",
      },
      {
        title: "User conduct",
        paragraphs: ["All users of the platform agree not to engage in any of the following prohibited activities:"],
        bullets: [
          "Submitting fraudulent inquiry or lead data",
          "Scraping or bulk-downloading listing data",
          "Misrepresenting identity or credentials",
          "Harassing agents, owners or SqftGo staff",
          "Posting misleading property specifications",
          "Bypassing authentication or security controls",
        ],
      },
      {
        title: "Liability & indemnity",
        paragraphs: [
          "SqftGo (SQFTGO.COM), its parent corporations, and officers hold no liability for transactions, title disputes, construction delays, or service quality concerns arising between listing buyers / tenants and verified brokers / builders. Agreements are strictly bilateral.",
        ],
        note: 'SqftGo provides the platform "as-is" with no warranty of fitness for a particular purpose or non-infringement. Users act at their own risk when transacting.',
      },
      {
        title: "Governing law",
        paragraphs: [
          "These Terms are governed by and construed in accordance with the laws of India and the state of Rajasthan. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Udaipur, Rajasthan, India.",
        ],
      },
      {
        title: "Changes to terms",
        paragraphs: [
          "SqftGo reserves the right to modify these Terms of Service at any time. Material changes will be communicated via email to registered users at least 14 days prior to the effective date. Continued use of the platform after a revision constitutes acceptance of the updated Terms. We encourage you to review this page periodically.",
        ],
      },
      {
        title: "Contact & disputes",
        paragraphs: [
          "For any legal queries, disputes, or partnership compliance concerns, please reach out to SQFTGO Legal & Compliance at legal@sqftgo.com or +91 98290 55555.",
        ],
      },
    ],
  },
};
