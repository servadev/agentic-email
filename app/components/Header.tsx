// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Tooltip } from "@cloudflare/kumo";
import { GearSixIcon, RobotIcon, XIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import React, { type KeyboardEvent, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams, useSearchParams, NavLink } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";
import { Folders, SYSTEM_FOLDER_IDS } from "shared/folders";
import { useFolders } from "~/queries/folders";

const SYSTEM_FOLDER_LINKS = [
	{ id: Folders.INBOX, label: "Inbox" },
	{ id: Folders.DRAFT, label: "Drafts" },
	{ id: Folders.SENT, label: "Sent" },
	{ id: Folders.ARCHIVE, label: "Archive" },
	{ id: Folders.TRASH, label: "Trash" },
];

export default function Header() {
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const { toggleAgentPanel, isAgentPanelOpen, startCompose } = useUIStore();
	const { data: folders = [] } = useFolders(mailboxId);

	// Sync search input with URL query param so it stays populated
	const urlQuery = searchParams.get("q") || "";
	useEffect(() => {
		if (location.pathname.includes("/search") && urlQuery) {
			setSearchQuery(urlQuery);
		}
	}, [urlQuery, location.pathname]);

	const performSearch = () => {
		if (mailboxId && searchQuery.trim()) {
			const q = searchQuery.trim();
			navigate(`/mailbox/${mailboxId}/search?q=${encodeURIComponent(q)}`);
			setIsSearchExpanded(false);
		}
	};

	const clearSearch = () => {
		setSearchQuery("");
		if (location.pathname.includes("/search") && mailboxId) {
			navigate(`/mailbox/${mailboxId}/emails/inbox`);
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			performSearch();
		}
		if (e.key === "Escape") {
			if (searchQuery) {
				clearSearch();
			} else {
				setIsSearchExpanded(false);
			}
		}
	};

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
		<header className="flex items-center justify-between px-4 h-[48px] bg-sh-bg-panel border-b border-sh-border sticky top-0 z-10 shrink-0">
			{/* Left: Split Inbox Tabs */}
			<nav className="flex items-center h-full gap-4 overflow-x-auto no-scrollbar">
				{SYSTEM_FOLDER_LINKS.map((folder) => {
					const unread = getUnreadCount(folder.id);
					return (
						<NavLink
							key={folder.id}
							to={`/mailbox/${mailboxId}/emails/${folder.id}`}
							className={({ isActive }) =>
								`relative flex items-center h-full text-sh-base transition-colors ${
									isActive
										? "text-sh-text-white font-medium"
										: "text-sh-text-inactive hover:text-sh-text-muted"
								}`
							}
						>
							{({ isActive }) => (
								<>
									<span>{folder.label}</span>
									{unread > 0 && (
										<span className="ml-1.5 text-sh-text-inactive">({unread})</span>
									)}
									{isActive && (
										<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sh-accent" />
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
								`relative flex items-center h-full text-sh-base transition-colors ${
									isActive
										? "text-sh-text-white font-medium"
										: "text-sh-text-inactive hover:text-sh-text-muted"
								}`
							}
						>
							{({ isActive }) => (
								<>
									<span>{folder.name}</span>
									{unread > 0 && (
										<span className="ml-1.5 text-sh-text-inactive">({unread})</span>
									)}
									{isActive && (
										<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sh-accent" />
									)}
								</>
							)}
						</NavLink>
					);
				})}
			</nav>

			{/* Right: Search, Compose, Settings, Agent */}
			<div className="flex items-center gap-3 shrink-0 ml-4">
				{/* Search Bar */}
				<div className="relative flex items-center w-64 h-7">
					<input
						className="w-full h-full bg-sh-search-bg border border-sh-border-thin rounded-[4px] px-2.5 text-sh-base text-sh-text-white placeholder-sh-search-placeholder outline-none focus:border-sh-text-muted transition-colors"
						aria-label="Search emails"
						placeholder="Search..."
						value={searchQuery}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={clearSearch}
							className="absolute right-1.5 p-0.5 text-sh-text-muted hover:text-sh-text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent rounded-[2px]"
							aria-label="Clear search"
						>
							<XIcon size={12} />
						</button>
					)}
				</div>

				{/* Compose Button */}
				<button
					type="button"
					onClick={() => startCompose()}
					className="flex items-center gap-1.5 bg-sh-accent hover:bg-opacity-90 text-sh-text-white px-3 py-1 rounded-[2px] text-[12px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent"
				>
					<PencilSimpleIcon size={14} />
					<span>Compose</span>
				</button>

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
		</header>
	);
}