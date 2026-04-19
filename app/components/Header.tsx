// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Tooltip } from "@cloudflare/kumo";
import { GearSixIcon, RobotIcon, XIcon, PencilSimpleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import React, { type KeyboardEvent, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams, useSearchParams, NavLink } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";
import { Folders, SYSTEM_FOLDER_IDS } from "shared/folders";
import { useFolders } from "~/queries/folders";
import SearchModal from "~/components/SearchModal";

const SYSTEM_FOLDER_LINKS = [
	{ id: Folders.INBOX, label: "Inbox" },
	{ id: Folders.DRAFT, label: "Drafts" },
	{ id: Folders.SENT, label: "Sent" },
	{ id: Folders.ARCHIVE, label: "Archive" },
	{ id: Folders.TRASH, label: "Trash" },
];

export default function Header() {
	const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { toggleAgentPanel, isAgentPanelOpen, startCompose } = useUIStore();
	const { data: folders = [] } = useFolders(mailboxId);

	const isSettingsActive = location.pathname.includes("/settings");

	const customFolders = useMemo(
		() => folders.filter((f) => !(SYSTEM_FOLDER_IDS as readonly string[]).includes(f.id)),
		[folders],
	);

	const getUnreadCount = (folderId: string) => {
		const found = folders.find((f) => f.id === folderId);
		return found?.unreadCount || 0;
	};

	return (
		<header className="flex items-center justify-between px-6 h-[80px] bg-transparent border-b border-sh-border sticky top-0 z-10 shrink-0">
			{/* Left: Split Inbox Tabs */}
			<nav className="flex items-center h-full gap-6 overflow-x-auto no-scrollbar">
				{SYSTEM_FOLDER_LINKS.map((folder) => {
					const unread = getUnreadCount(folder.id);
					return (
						<NavLink
							key={folder.id}
							to={`/mailbox/${mailboxId}/emails/${folder.id}`}
							className={({ isActive }) =>
								`flex items-center h-full text-[15px] transition-colors ${
									isActive
										? "text-sh-text-white font-bold"
										: "text-sh-text-inactive font-medium hover:text-sh-text-muted"
								}`
							}
						>
							{() => (
								<>
									<span>{folder.label}</span>
									{unread > 0 && (
										<span className="ml-1.5 text-sh-text-inactive font-medium">({unread})</span>
									)}
								</>
							)}
						</NavLink>
					);
				})}
				{customFolders.map((folder) => {
					const unread = folder.unreadCount || 0;
					return (
						<NavLink
							key={folder.id}
							to={`/mailbox/${mailboxId}/emails/${folder.id}`}
							className={({ isActive }) =>
								`flex items-center h-full text-[15px] transition-colors ${
									isActive
										? "text-sh-text-white font-bold"
										: "text-sh-text-inactive font-medium hover:text-sh-text-muted"
								}`
							}
						>
							{() => (
								<>
									<span>{folder.name}</span>
									{unread > 0 && (
										<span className="ml-1.5 text-sh-text-inactive font-medium">({unread})</span>
									)}
								</>
							)}
						</NavLink>
					);
				})}
			</nav>

			{/* Right: Search, Compose, Settings, Agent */}
			<div className="flex items-center gap-3 shrink-0 ml-4">
				{/* Search Button */}
				<Tooltip content="Search" side="bottom" asChild>
					<button
						type="button"
						onClick={() => setIsSearchModalOpen(true)}
						className="p-1.5 text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent"
						aria-label="Search emails"
					>
						<MagnifyingGlassIcon size={18} />
					</button>
				</Tooltip>

				{/* Compose Button */}
				<Tooltip content="Compose" side="bottom" asChild>
					<button
						type="button"
						onClick={() => startCompose()}
						className="p-1.5 text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover transition-colors rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent"
						aria-label="Compose email"
					>
						<PencilSimpleIcon size={18} />
					</button>
				</Tooltip>

				{/* Icons */}
				<div className="flex items-center gap-1">
					<Tooltip content={isAgentPanelOpen ? "Hide agent panel" : "Show agent panel"} side="bottom" asChild>
						<button
							type="button"
							onClick={toggleAgentPanel}
							className={`p-1.5 rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent ${
								isAgentPanelOpen
									? "text-sh-text-white bg-sh-bg-hover"
									: "text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover"
							}`}
							aria-label="Toggle agent panel"
						>
							<RobotIcon size={18} />
						</button>
					</Tooltip>
					<Tooltip content="Settings" side="bottom" asChild>
						<button
							type="button"
							onClick={() =>
								navigate(
									isSettingsActive
										? `/mailbox/${mailboxId}/emails/inbox`
										: `/mailbox/${mailboxId}/settings`,
								)
							}
							className={`p-1.5 rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent ${
								isSettingsActive
									? "text-sh-text-white bg-sh-bg-hover"
									: "text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover"
							}`}
							aria-label="Settings"
						>
							<GearSixIcon size={18} />
						</button>
					</Tooltip>
				</div>
			</div>

			<SearchModal
				isOpen={isSearchModalOpen}
				onClose={() => setIsSearchModalOpen(false)}
				mailboxId={mailboxId || ""}
			/>
		</header>
	);
}