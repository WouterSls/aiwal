export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-24">
      <h1 className="text-4xl font-bold tracking-tight uppercase">
        Terms of Service
      </h1>
      <p className="mt-4 text-sm font-medium tracking-widest uppercase">
        Last updated: April 4, 2026
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          1. Acceptance
        </h2>
        <p className="mt-4 text-base font-normal">
          By connecting your wallet to Aiwal, you agree to these Terms of
          Service. If you do not agree, do not use Aiwal.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          2. About Aiwal
        </h2>
        <p className="mt-4 text-base font-normal">
          Aiwal is an onchain automation tool developed by Senter Software
          Solutions. It executes DeFi actions (including token swaps, limit
          orders, and future protocol interactions) on your behalf using
          delegated execution rights you grant.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          3. Non-Custodial
        </h2>
        <p className="mt-4 text-base font-normal">
          Aiwal is non-custodial. We never hold your private keys or funds. All
          execution occurs through smart contract delegation. You retain full
          ownership of your assets at all times.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          4. Delegated Execution
        </h2>
        <p className="mt-4 text-base font-normal">
          By using Aiwal, you grant Senter Software Solutions limited, revocable
          execution rights to perform onchain actions you configure. You may
          revoke these rights at any time. You are responsible for all actions
          executed under your delegation.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          5. Experimental Software
        </h2>
        <p className="mt-4 text-base font-normal">
          Aiwal is experimental software provided as-is. DeFi protocols carry
          inherent risks including smart contract vulnerabilities, price
          volatility, oracle failures, and liquidity risk. You acknowledge and
          accept these risks.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          6. No Financial Advice
        </h2>
        <p className="mt-4 text-base font-normal">
          Nothing in Aiwal constitutes financial, investment, or trading advice.
          All decisions are yours. Past performance of any strategy does not
          guarantee future results.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          7. Supported Actions (MVP)
        </h2>
        <p className="mt-4 text-base font-normal">
          The current version of Aiwal supports:
        </p>
        <ul className="mt-4 text-base font-normal list-disc pl-5 space-y-2">
          <li>Token swaps via integrated DEX protocols</li>
          <li>Limit orders</li>
        </ul>
        <p className="mt-4 text-base font-normal">
          Future versions may support additional DeFi actions. These Terms apply
          to all current and future functionality.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          8. Prohibited Use
        </h2>
        <p className="mt-4 text-base font-normal">You may not use Aiwal to:</p>
        <ul className="mt-4 text-base font-normal list-disc pl-5 space-y-2">
          <li>Circumvent applicable laws or regulations</li>
          <li>Engage in market manipulation or wash trading</li>
          <li>
            Access Aiwal if you are subject to sanctions under EU, UN, or
            applicable national law
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          9. Limitation of Liability
        </h2>
        <p className="mt-4 text-base font-normal">
          To the maximum extent permitted by law, Senter Software Solutions is
          not liable for any losses arising from use of Aiwal, including but not
          limited to: financial losses, failed transactions, smart contract
          exploits, or protocol failures.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          10. MiCA Compliance
        </h2>
        <p className="mt-4 text-base font-normal">
          Senter Software Solutions operates in accordance with the EU Markets
          in Crypto-Assets Regulation (MiCA) as applicable to software
          providers. Aiwal does not issue crypto-assets or provide custody
          services.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          11. Governing Law
        </h2>
        <p className="mt-4 text-base font-normal">
          These Terms are governed by the laws of Belgium. Any disputes shall be
          subject to the exclusive jurisdiction of the courts of Belgium.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          12. Changes
        </h2>
        <p className="mt-4 text-base font-normal">
          We may update these Terms. Continued use of Aiwal after changes
          constitutes acceptance. Material changes will be noted by updating the
          "Last updated" date.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          13. Contact
        </h2>
        <p className="mt-4 text-base font-normal">
          Senter Software Solutions —{" "}
          <span className="font-medium">support@senter.be</span>
        </p>
      </section>
    </div>
  );
}
