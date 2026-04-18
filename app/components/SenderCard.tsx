// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useEmail } from "~/queries/emails";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { useUIStore } from "~/hooks/useUIStore";
import type { Email } from "~/types";

export default function SenderCard({ contactEmail }: { contactEmail: string }) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const queryClient = useQueryClient();
	const { toggleSenderCard } = useUIStore();

	// We use the queryClient to get all emails currently loaded in any list query
	const allEmailQueries = queryClient.getQueriesData<{ emails: Email[] }>({
		queryKey: ["emails", mailboxId],
	});

	// Find the first email matching this contact to extract the display name
	let email: Email | undefined;
	const seenThreads = new Set<string>();

	for (const [key, data] of allEmailQueries) {
		if (data && Array.isArray(data.emails)) {
			for (const e of data.emails) {
				const senderStr = e.sender || "";
				const match = senderStr.match(/(.*)<(.*)>/);
				const eEmailAddress = match ? match[2].trim() : senderStr;
				if (eEmailAddress.toLowerCase() === contactEmail.toLowerCase()) {
					if (!email) email = e;
					if (e.thread_id) {
						seenThreads.add(e.thread_id);
					} else {
						seenThreads.add(e.id);
					}
				}
			}
		}
	}

	if (!email) return null;

	// Parse sender display name and email address
	const senderStr = email.sender || "";
	let displayName = senderStr;
	let emailAddress = senderStr;

	const match = senderStr.match(/(.*)<(.*)>/);
	if (match) {
		displayName = match[1].trim() || match[2].trim();
		emailAddress = match[2].trim();
	} else {
		// Just an email address
		displayName = senderStr.split("@")[0];
	}

	// Remove quotes if present
	displayName = displayName.replace(/^"|"$/g, "").trim();

	const recentCount = seenThreads.size;

	const initial = displayName.charAt(0).toUpperCase() || "?";

	return (
		<div className="flex flex-col h-full bg-sh-bg-panel text-sh-text-white relative">
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

			<div className="flex flex-col items-center p-8 border-b border-sh-border mt-6 md:mt-0">
				<div className="w-16 h-16 rounded-full bg-sh-accent flex items-center justify-center text-xl font-semibold mb-4 text-white">
					{initial}
				</div>
				<h2 className="text-[15px] font-medium mb-1 text-center truncate w-full px-4">{displayName}</h2>
				<p className="text-[13px] text-sh-text-muted text-center truncate w-full px-4">{emailAddress}</p>
			</div>

			<div className="flex flex-col p-6 gap-6">
				<div>
					<h3 className="text-[11px] uppercase tracking-wider text-sh-text-muted font-semibold mb-3">
						About
					</h3>
					<div className="flex justify-between items-center py-1">
						<span className="text-[13px] text-sh-text-read">Recent threads</span>
						<span className="text-[13px] font-medium text-sh-text-white">{recentCount}</span>
					</div>
				</div>
			</div>
		</div>
	);
}