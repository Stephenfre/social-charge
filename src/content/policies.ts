export type PolicyId =
  | 'safety-harassment'
  | 'travel-waiver'
  | 'event-participation'
  | 'code-of-conduct'
  | 'liability-waiver'
  | 'refund-credit-policy'
  | 'privacy-policy'
  | 'terms-of-service';

export type PolicyContent = {
  id: PolicyId;
  title: string;
  summary: string;
  sections: Array<{
    title: string;
    body: string[];
  }>;
};

export const policies: Record<PolicyId, PolicyContent> = {
  'safety-harassment': {
    id: 'safety-harassment',
    title: 'Safety & Harassment Policy',
    summary: 'Serious incidents may be reported to police or emergency responders.',
    sections: [
      {
        title: 'Summary',
        body: [
          'Safety is our top priority. We maintain a zero-tolerance policy for harassment or unsafe behavior.',
        ],
      },
      {
        title: 'Full Policy',
        body: [
          '1. Reporting: Members may report incidents via the app or email safety@socialcharge.com.',
          '2. Immediate Action: The Company may suspend or ban members pending investigation.',
          '3. Confidentiality: All reports are treated discreetly.',
          '4. Non-Retaliation: Members who report issues are protected from retaliation.',
        ],
      },
    ],
  },
  'travel-waiver': {
    id: 'travel-waiver',
    title: 'Travel & Trip Waiver',
    summary: 'For overnight or international events, members accept additional travel risks.',
    sections: [
      {
        title: 'Full Waiver',
        body: [
          '1. You are responsible for valid identification, passport, and travel insurance.',
          '2. The Company is not responsible for flight cancellations, delays, or lost luggage.',
          '3. You agree to carry personal medical and travel insurance.',
          '4. You release Social Charge LLC from liability for injuries or incidents outside direct event activities.',
        ],
      },
    ],
  },
  'event-participation': {
    id: 'event-participation',
    title: 'Event Participation Agreement',
    summary: 'By RSVPing or attending an event, you agree to follow event-specific terms.',
    sections: [
      {
        title: 'Full Agreement',
        body: [
          '1. Responsibility: You are responsible for your behavior and personal belongings at all events.',
          "2. Check-In: Hosts may require photo or QR check-in for safety.",
          '3. Cancellations: Follow the 48-hour cancellation rule for refunds in credits.',
          '4. Media Use: You consent to photos or videos being taken at events for internal or marketing use unless you opt out in writing.',
          "5. Emergency Procedure: Follow the host's instructions in any emergency.",
        ],
      },
    ],
  },
  'code-of-conduct': {
    id: 'code-of-conduct',
    title: 'Member Behavior / Code of Conduct',
    summary: 'Members must treat others with respect and follow community rules.',
    sections: [
      {
        title: 'Full Policy',
        body: [
          '1. Respectful Conduct: No harassment, discrimination, stalking, or violence.',
          '2. Substance Use: Intoxicated or unsafe behavior may result in removal and membership termination.',
          '3. Privacy: Do not record or photograph others without consent.',
          '4. Zero Tolerance: Any violation may lead to immediate suspension without refund.',
          '5. Investigation: Reports are handled confidentially by the Social Charge team.',
          '6. Termination Rights: The Company reserves the right to deny event access or terminate memberships for violations.',
        ],
      },
    ],
  },
  'liability-waiver': {
    id: 'liability-waiver',
    title: 'Liability Waiver & Release',
    summary:
      'You assume full responsibility for your participation in any Social Battery events or activities.',
    sections: [
      {
        title: 'Full Waiver',
        body: [
          '1. You acknowledge that participation involves inherent risks, including personal injury, illness, property damage, or loss.',
          '2. You voluntarily assume all risks associated with event attendance or travel.',
          '3. You release Social Charge LLC, its staff, contractors, and partners from all liability, except for cases of gross negligence or willful misconduct.',
          '4. You consent to emergency medical care if necessary and agree to cover related costs.',
          '5. This waiver is binding for all events and trips attended under your membership.',
        ],
      },
    ],
  },
  'refund-credit-policy': {
    id: 'refund-credit-policy',
    title: 'Refund & SB Credit Policy',
    summary:
      'All refunds are issued as Social Battery Credits (“SB Credits”), not cash or card refunds.',
    sections: [
      {
        title: 'Full Policy',
        body: [
          '1. Refunds for canceled events or membership changes are provided in SB Credits only.',
          '2. Event Cancellation: Members canceling at least 48 hours before an event receive a full SB Credit refund.',
          '3. Last-minute signups made within 6 hours of an event are non-refundable.',
          '4. SB Credit Expiration: Basic Members have 30 days, Plus Members 60 days, Premium Members 90 days, and Promotional or Trial Credits 30 days from issue.',
          '5. Grace Period: A 14-day grace period applies for expired credits upon written request.',
          '6. Rollovers: Credits automatically roll over if the member renews before expiration.',
          '7. Expiration Reminders: Members receive reminders 30, 7, and 1 day before expiration.',
          '8. No Cash Value: Credits are non-transferable and hold no cash value.',
        ],
      },
    ],
  },
  'privacy-policy': {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    summary:
      'We respect your privacy. This policy explains how we collect, use, and protect your information.',
    sections: [
      {
        title: 'Full Policy',
        body: [
          '1. Data Collected: Contact details, profile info, photos, event attendance, messages, and location data if enabled.',
          '2. Use of Data: To operate the app, manage memberships, process payments, and improve services.',
          '3. Sharing: We only share data with trusted service providers as needed for operations.',
          '4. Security: All data is encrypted in storage and transit.',
          '5. Retention: Data is kept only as long as necessary for active accounts or legal compliance.',
          '6. Marketing: You may opt out of promotional emails anytime.',
          '7. Your Rights: You may request data deletion or correction by emailing support@socialcharge.com.',
        ],
      },
    ],
  },
  'terms-of-service': {
    id: 'terms-of-service',
    title: 'Terms of Service',
    summary:
      'This agreement governs your use of the Social Battery mobile app and membership services.',
    sections: [
      {
        title: 'Full Terms',
        body: [
          '1. Eligibility: You must be at least 21 years old and a resident of the United States.',
          '2. Membership: All memberships are month-to-month and automatically renew unless canceled prior to the renewal date.',
          '3. Payment Authorization: By purchasing a membership, you authorize recurring monthly payments through the payment method on file.',
          '4. Refund Policy: All refunds are issued as SB Credits only; no monetary refunds are made to bank accounts or cards.',
          '5. Event Participation: You agree to follow all event rules, sign applicable waivers, and assume responsibility for your participation.',
          '6. Account Termination: Social Charge LLC reserves the right to suspend or terminate accounts for violation of any policies or conduct rules.',
          '7. Limitation of Liability: The Company is not liable for damages arising from participation in events, travel, or member interactions, except where prohibited by law.',
          '8. Governing Law: These Terms are governed by the laws of Arizona.',
          '9. Dispute Resolution: All disputes shall be resolved through binding arbitration in Maricopa County, Arizona.',
          '10. Acceptance: By tapping “I Agree” or continuing to use the app, you agree to these Terms of Service.',
        ],
      },
    ],
  },
};
