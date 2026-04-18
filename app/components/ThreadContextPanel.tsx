// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useEmail } from "~/queries/emails";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { useUIStore } from "~/hooks/useUIStore";
import { formatListDate } from "shared/dates";

export default function ThreadContextPanel({ emailId }: { emailId: string }) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const { toggleSenderCard } = useUIStore();
	const { data: emailData } = useEmail(mailboxId, emailId);
	
	const email = emailData?.email;

	if (!email) return null;

	const participants = email.participants ? email.participants.split(",").map(p => {
		const match = p.match(/(.*)<(.*)>/);
		if (match) {
			return { name: match[1].replace(/^"|"$/g, "").trim() || match[2].trim(), email: match[2].trim() };
		}
		return { name: p.trim().split("@")[0], email: p.trim() };
	}) : [];

	return (
		<div className="flex flex-col h-full bg-sh-bg-panel text-sh-text-white relative overflow-y-auto no-scrollbar">
			{/* Mobile back button */}
			<div className="md:hidden absolute top-3 left-3">
				<button
					type="button"
					onClick={toggleSenderCard}
					className="p-2 text-sh-text-muted hover:text-sh-text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent rounded-[2px]"
					aria-label="Back to email"
				>
					<CaretLeftIcon size={20} />
				</button>
			</div>

			<div className="p-6 border-b border-sh-border mt-6 md:mt-0">
				<h2 className="text-[13px] uppercase tracking-wider text-sh-text-muted font-semibold mb-4">
					Thread Info
				</h2>
				<h3 className="text-[15px] font-medium mb-2 leading-snug">{email.subject || "(No Subject)"}</h3>
				<p className="text-[12px] text-sh-text-muted mb-4">
					Started {formatListDate(email.date)}
				</p>
			</div>

			<div className="p-6">
				<h3 className="text-[11px] uppercase tracking-wider text-sh-text-muted font-semibold mb-4">
					Participants
				</h3>
				<div className="flex flex-col gap-3">
					{participants.map((p, idx) => (
						<div key={idx} className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-sh-bg-hover flex items-center justify-center text-[12px] font-medium text-sh-text-white shrink-0">
								{p.name.charAt(0).toUpperCase()}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-medium text-sh-text-white truncate">{p.name}</p>
								<p className="text-[11px] text-sh-text-muted truncate">{p.email}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
