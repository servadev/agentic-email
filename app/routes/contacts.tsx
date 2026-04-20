// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import MailboxSplitView from "~/components/MailboxSplitView";
import ContactDetail from "~/components/ContactDetail";
import { useEmails } from "~/queries/emails";
import { useContacts } from "~/queries/contacts";
import { useUIStore } from "~/hooks/useUIStore";
import { parseSenderInfo } from "~/lib/utils";
import type { Email, ContactData } from "~/types";

import ComposePanel from "~/components/ComposePanel";

export default function ContactsRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const { selectedContact, setSelectedContact, isComposing } = useUIStore();

	// We fetch a chunk of emails to build our contacts list from cache
	const params = useMemo(() => ({ limit: "200" }), []);
	const { data: emailData, isFetching } = useEmails(mailboxId, params);
	const emails = emailData?.emails ?? [];

	const { data: contactsData = [] } = useContacts(mailboxId);
	const editedContacts = useMemo(() => {
		const map: Record<string, ContactData> = {};
		for (const c of contactsData) {
			map[c.id] = c;
		}
		return map;
	}, [contactsData]);

	// Group emails into contacts and sort alphabetically
	const contacts = useMemo(() => {
		const map = new Map<string, { emailAddress: string; displayName: string; latestEmail: Email | null; threadCount: number; unreadCount: number }>();
		
		// First, add all manually edited contacts from the DB
		for (const c of contactsData) {
			const normalized = c.id.toLowerCase();
			if (normalized === mailboxId?.toLowerCase()) continue;
			
			map.set(normalized, {
				emailAddress: normalized,
				displayName: c.displayName || normalized,
				latestEmail: null,
				threadCount: 0,
				unreadCount: 0
			});
		}

		emails.forEach(email => {
			let contactStr = email.sender || "";
			if (email.folder_id === "sent" || email.sender?.toLowerCase() === mailboxId?.toLowerCase()) {
				const recipients = email.recipient ? email.recipient.split(",") : [];
				if (recipients.length > 0) {
					contactStr = recipients[0].trim();
				} else {
					contactStr = email.sender || "";
				}
			}
			
			const { displayName, emailAddress } = parseSenderInfo(contactStr);
			
			const normalizedEmailAddress = emailAddress.toLowerCase();
			if (normalizedEmailAddress === mailboxId?.toLowerCase()) return; // Skip the 'You' contact
			const contactId = normalizedEmailAddress;
			const isUnread = email.thread_unread_count ? email.thread_unread_count > 0 : !email.read;

			const existing = map.get(contactId);
			if (!existing) {
				map.set(contactId, {
					emailAddress: normalizedEmailAddress,
					displayName: editedContacts[normalizedEmailAddress]?.displayName || displayName,
					latestEmail: email,
					threadCount: 1,
					unreadCount: isUnread ? 1 : 0
				});
			} else {
				existing.threadCount += 1;
				if (isUnread) existing.unreadCount += 1;
				if (!existing.latestEmail || new Date(email.date).getTime() > new Date(existing.latestEmail.date).getTime()) {
					existing.latestEmail = email;
				}
			}
		});

		return Array.from(map.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
	}, [emails, editedContacts, mailboxId, contactsData]);

	const youContact = useMemo(() => {
		if (!mailboxId) return null;
		
		const normalizedMailboxId = mailboxId.toLowerCase();
		const editedYou = editedContacts[normalizedMailboxId];
		const displayName = editedYou?.displayName || parseSenderInfo(mailboxId).displayName;
		
		return {
			emailAddress: normalizedMailboxId,
			displayName: `You (${displayName})`,
			latestEmail: null as unknown as Email, // We won't use this for 'You'
			threadCount: 0,
			unreadCount: 0
		};
	}, [mailboxId, editedContacts]);

	const [hasAutoSelected, setHasAutoSelected] = useState(false);

	useEffect(() => {
		if (!selectedContact && youContact && !hasAutoSelected && !isComposing) {
			setSelectedContact(youContact.emailAddress);
			setHasAutoSelected(true);
		}
	}, [selectedContact, youContact, hasAutoSelected, isComposing, setSelectedContact]);

	const leftPane = (
		<div className="flex flex-col h-full bg-sh-bg-dark">
			<div className="flex-1 overflow-y-auto no-scrollbar py-2">
				{youContact && (
					<div className="mb-3 border-b border-sh-border-thin pb-3">
						<div
							role="button"
							tabIndex={0}
							onClick={() => setSelectedContact(youContact.emailAddress)}
							onKeyDown={(e: React.KeyboardEvent) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setSelectedContact(youContact.emailAddress);
								}
							}}
							className={`group relative flex flex-col justify-center w-full text-left cursor-pointer transition-colors h-[48px] pr-4 ${
								selectedContact === youContact.emailAddress ? "bg-sh-bg-selected" : "hover:bg-sh-bg-hover"
							} ${selectedContact === youContact.emailAddress ? "border-l-[3px] border-l-sh-accent pl-[29px]" : "border-l-[3px] border-l-transparent pl-[29px]"}`}
						>
							<span
								className={`truncate text-[15px] font-bold ${
									selectedContact === youContact.emailAddress ? "text-sh-text-white" : "text-sh-text-read"
								}`}
							>
								{youContact.displayName}
							</span>
						</div>
					</div>
				)}

				{isFetching && emails.length === 0 ? (
					<div className="p-6 text-center text-sh-text-muted text-[13px]">Loading contacts...</div>
				) : contacts.length > 0 ? (
					<div>
						{contacts.map((contact) => {
							const isSelected = selectedContact === contact.emailAddress;
							return (
								<div
									key={contact.emailAddress}
									role="button"
									tabIndex={0}
									onClick={() => setSelectedContact(contact.emailAddress)}
									onKeyDown={(e: React.KeyboardEvent) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											setSelectedContact(contact.emailAddress);
										}
									}}
									className={`group relative flex flex-col justify-center w-full text-left cursor-pointer transition-colors h-[48px] pr-4 ${
										isSelected ? "bg-sh-bg-selected" : "hover:bg-sh-bg-hover"
									} ${isSelected ? "border-l-[3px] border-l-sh-accent pl-[29px]" : "border-l-[3px] border-l-transparent pl-[29px]"}`}
								>
									<span
										className={`truncate text-[15px] font-bold ${
											isSelected ? "text-sh-text-white" : "text-sh-text-read"
										}`}
									>
										{contact.displayName}
									</span>
								</div>
							);
						})}
					</div>
				) : (
					<div className="p-6 text-center text-sh-text-muted text-[13px]">No contacts found</div>
				)}
			</div>
		</div>
	);

	let centerPane: React.ReactNode;
	if (isComposing) {
		centerPane = <ComposePanel />;
	} else if (selectedContact) {
		const contactObj = selectedContact === youContact?.emailAddress ? youContact : contacts.find(c => c.emailAddress === selectedContact);
		centerPane = (
			<div className="flex flex-col h-full bg-transparent w-full">
				<ContactDetail contact={contactObj} onBack={() => setSelectedContact(null)} />
			</div>
		);
	} else {
		centerPane = (
			<div className="flex items-center justify-center h-full text-sh-text-muted text-[13px] bg-transparent">
				Select a contact
			</div>
		);
	}

	return (
		<MailboxSplitView
			leftPane={leftPane}
			centerPane={centerPane}
			rightPane={null}
		/>
	);
}
