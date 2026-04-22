// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useEmail } from "~/queries/emails";
import { useContacts } from "~/queries/contacts";
import { 
	CaretLeftIcon,
	LinkedinLogoIcon,
	FacebookLogoIcon,
	LinkIcon,
	XLogoIcon
} from "@phosphor-icons/react";
import { useUIStore } from "~/hooks/useUIStore";
import type { Email, ContactData } from "~/types";

export default function SenderCard({ contactEmail }: { contactEmail: string }) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const queryClient = useQueryClient();
	const { toggleSenderCard } = useUIStore();
	const { data: contactsData = [] } = useContacts(mailboxId);

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

	const contact = contactsData.find(c => c.id === contactEmail.toLowerCase());
	
	// If the user has edited the contact, prefer those values
	if (contact?.displayName) {
		displayName = contact.displayName;
	}

	const displayTitle = contact?.title && contact?.company ? `${contact.title} • ${contact.company}` : contact?.title || contact?.company || "";
	const displayLocation = contact?.officeLocation || "";
	const avatarUrl = contact?.avatarUrl;

	const recentCount = seenThreads.size;

	const initial = displayName.charAt(0).toUpperCase() || "?";

	return (
		<div className="flex flex-col h-full bg-transparent text-sh-text-white relative overflow-y-auto no-scrollbar">
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

			<div className="flex flex-col items-start p-6 mt-6 md:mt-0">
				<h2 className="text-[24px] font-semibold mb-6 truncate w-full">{displayName}</h2>
				
				<div className="flex items-center gap-4 mb-6">
					<div className="w-20 h-20 rounded-full bg-sh-bg-hover flex items-center justify-center text-3xl font-bold text-white shrink-0 overflow-hidden border border-sh-border">
						{avatarUrl ? (
							<img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
						) : (
							initial
						)}
					</div>
					<div className="flex flex-col min-w-0 gap-1">
						<span className="text-[16px] font-medium truncate text-sh-text-white">{emailAddress}</span>
						{displayLocation && (
							<span className="text-[14px] text-sh-text-muted truncate">{displayLocation}</span>
						)}
					</div>
				</div>

				{displayTitle && (
					<p className="text-[16px] font-medium text-sh-text-muted mb-8">{displayTitle}</p>
				)}

				{/* Social Links */}
				<div className="flex flex-col gap-4 w-full">
					{contact?.linkedIn && (
						<div className="flex items-center gap-3 text-sh-text-muted hover:text-sh-text-white transition-colors cursor-pointer">
							<LinkedinLogoIcon size={24} />
							<span className="text-[15px] font-medium">{contact.linkedIn}</span>
						</div>
					)}
					{contact?.facebook && (
						<div className="flex items-center gap-3 text-sh-text-muted hover:text-sh-text-white transition-colors cursor-pointer">
							<FacebookLogoIcon size={24} />
							<span className="text-[15px] font-medium">{contact.facebook}</span>
						</div>
					)}
					{contact?.website && (
						<div className="flex items-center gap-3 text-sh-text-muted hover:text-sh-text-white transition-colors cursor-pointer">
							<LinkIcon size={24} />
							<span className="text-[15px] font-medium">{contact.website}</span>
						</div>
					)}
					{contact?.xAccount && (
						<div className="flex items-center gap-3 text-sh-text-muted hover:text-sh-text-white transition-colors cursor-pointer">
							<XLogoIcon size={24} />
							<span className="text-[15px] font-medium">{contact.xAccount}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}