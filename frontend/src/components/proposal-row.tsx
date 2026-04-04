interface ProposalRowProps {
  type: string;
  token_in: string;
  token_out: string;
  amount_in: string;
  status: "confirmed" | "completed" | "failed";
  timestamp: string;
  tx_hash?: string;
}

const statusStyles: Record<ProposalRowProps["status"], string> = {
  confirmed: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export function ProposalRow({
  type,
  token_in,
  token_out,
  amount_in,
  status,
  timestamp,
  tx_hash,
}: ProposalRowProps) {
  return (
    <tr className="border-b border-black/10 text-sm">
      <td className="py-3 pr-4 uppercase tracking-widest text-xs">
        {type.replace("_", " ")}
      </td>
      <td className="py-3 pr-4 font-medium">
        {token_in} → {token_out}
      </td>
      <td className="py-3 pr-4">{amount_in}</td>
      <td className="py-3 pr-4">
        <span
          className={`px-2 py-0.5 text-xs font-medium uppercase tracking-widest ${statusStyles[status]}`}
        >
          {status}
        </span>
      </td>
      <td className="py-3 pr-4 text-black/50 text-xs">
        {new Date(timestamp).toLocaleString()}
      </td>
      <td className="py-3">
        {tx_hash && (
          <a
            href={`https://basescan.org/tx/${tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-black/50 hover:text-black"
          >
            {tx_hash.slice(0, 8)}...
          </a>
        )}
      </td>
    </tr>
  );
}
