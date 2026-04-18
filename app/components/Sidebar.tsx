// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Tooltip } from "@cloudflare/kumo";
import {
	ArchiveIcon,
	CaretLeftIcon,
	FileIcon,
	FolderIcon,
	PaperPlaneTiltIcon,
	TrashIcon,
	TrayIcon,
} from "@phosphor-icons/react";
import React, { useMemo } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { Folders, SYSTEM_FOLDER_IDS } from "shared/folders";
import { useFolders } from "~/queries/folders";
import { useUIStore } from "~/hooks/useUIStore";

const FOLDER_ICONS: Record<string, React.ReactNode> = {
	[Folders.INBOX]: <TrayIcon size={20} weight="regular" />,
	[Folders.SENT]: <PaperPlaneTiltIcon size={20} weight="regular" />,
	[Folders.DRAFT]: <FileIcon size={20} weight="regular" />,
	[Folders.ARCHIVE]: <ArchiveIcon size={20} weight="regular" />,
	[Folders.TRASH]: <TrashIcon size={20} weight="regular" />,
};

const SYSTEM_FOLDER_LINKS = [
	{ id: Folders.INBOX, label: "Inbox" },
	{ id: Folders.SENT, label: "Sent" },
	{ id: Folders.DRAFT, label: "Drafts" },
	{ id: Folders.ARCHIVE, label: "Archive" },
	{ id: Folders.TRASH, label: "Trash" },
];

export default function Sidebar() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const navigate = useNavigate();
	const { data: folders = [] } = useFolders(mailboxId);
	const { closeSidebar } = useUIStore();

	const customFolders = useMemo(
		() => folders.filter((f) => !(SYSTEM_FOLDER_IDS as readonly string[]).includes(f.id)),
		[folders],
	);

	const handleNavClick = () => {
		closeSidebar();
	};

	return (
		<aside className="h-full w-full flex flex-col items-center py-2 bg-sh-bg-panel no-scrollbar overflow-y-auto overflow-x-hidden">
			<Tooltip content="Back to Mailboxes" side="right" asChild>
				<button
					type="button"
					onClick={() => navigate("/")}
					className="text-sh-text-muted hover:text-sh-text-white transition-colors p-2 mb-4 shrink-0 rounded-[2px] focus:outline-none focus:ring-2 focus:ring-sh-accent"
				>
					<CaretLeftIcon size={20} />
				</button>
			</Tooltip>

			<nav className="flex flex-col items-center gap-4 w-full">
				{SYSTEM_FOLDER_LINKS.map((folder) => {
					const icon = FOLDER_ICONS[folder.id];
					return (
						<Tooltip key={folder.id} content={folder.label} side="right" asChild>
							<NavLink
								to={`/mailbox/${mailboxId}/emails/${folder.id}`}
								onClick={handleNavClick}
								className={({ isActive }) =>
									`flex items-center justify-center p-2 rounded-[2px] transition-colors relative ${
										isActive
											? "text-sh-accent bg-sh-bg-selected"
											: "text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover"
									}`
								}
							>
								{icon}
							</NavLink>
						</Tooltip>
					);
				})}

				{customFolders.length > 0 && (
					<div className="w-8 h-[1px] bg-sh-border-thin my-2 shrink-0" />
				)}

				{customFolders.map((folder) => (
					<Tooltip key={folder.id} content={folder.name} side="right" asChild>
						<NavLink
							to={`/mailbox/${mailboxId}/emails/${folder.id}`}
							onClick={handleNavClick}
							className={({ isActive }) =>
								`flex items-center justify-center p-2 rounded-[2px] transition-colors relative ${
									isActive
										? "text-sh-accent bg-sh-bg-selected"
										: "text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover"
								}`
							}
						>
							<FolderIcon size={20} weight="regular" />
						</NavLink>
					</Tooltip>
				))}
			</nav>
		</aside>
	);
}