export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-24">
      <h1 className="text-4xl font-bold tracking-tight uppercase">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm font-medium tracking-widest uppercase">
        Last updated: April 4, 2026
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          1. Introduction
        </h2>
        <p className="mt-4 text-base font-normal">
          Senter Software Solutions ("we", "us") operates Aiwal, an onchain
          wallet automation tool. This policy explains what data we collect when
          you use Aiwal.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          2. What We Collect
        </h2>
        <ul className="mt-4 text-base font-normal list-disc pl-5 space-y-2">
          <li>
            Your wallet address, as provided when you connect your wallet.
          </li>
          <li>
            Onchain activity initiated through Aiwal (e.g. swaps, limit orders
            executed on your behalf).
          </li>
        </ul>
        <p className="mt-4 text-base font-normal">
          We do not collect: email addresses, names, identity documents, or any
          off-chain personal information.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          3. Why We Collect It
        </h2>
        <ul className="mt-4 text-base font-normal list-disc pl-5 space-y-2">
          <li>To execute delegated onchain actions you have authorized.</li>
          <li>To display your transaction history within the application.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          4. What We Do Not Do
        </h2>
        <ul className="mt-4 text-base font-normal list-disc pl-5 space-y-2">
          <li>We do not sell your data.</li>
          <li>
            We do not share your wallet address or activity with third parties
            beyond what is required to settle transactions on-chain (which is
            inherently public).
          </li>
          <li>We do not use your data for advertising.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          5. Onchain Data
        </h2>
        <p className="mt-4 text-base font-normal">
          All onchain activity is public by nature of the blockchain. Aiwal does
          not control or obscure data recorded on-chain.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          6. Delegated Execution
        </h2>
        <p className="mt-4 text-base font-normal">
          Aiwal holds delegated execution rights to act on your behalf. We never
          hold, custody, or control your private keys or funds. You may revoke
          delegation at any time through the application.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          7. Cookies and Tracking
        </h2>
        <p className="mt-4 text-base font-normal">
          We do not use cookies or third-party tracking scripts.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          8. Data Retention
        </h2>
        <p className="mt-4 text-base font-normal">
          We retain wallet addresses and associated onchain activity for as long
          as your account is active. You may request deletion of any off-chain
          records by contacting us.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          9. Your Rights (EU/GDPR)
        </h2>
        <p className="mt-4 text-base font-normal">
          Under GDPR you have the right to access, rectify, or erase personal
          data we hold about you. To exercise these rights, contact:{" "}
          <span className="font-medium">legal@senter.software</span>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          10. Changes
        </h2>
        <p className="mt-4 text-base font-normal">
          We may update this policy. Continued use of Aiwal after changes
          constitutes acceptance.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          11. Contact
        </h2>
        <p className="mt-4 text-base font-normal">
          Senter Software Solutions —{" "}
          <span className="font-medium">support@senter.be</span>
        </p>
      </section>
    </div>
  );
}
