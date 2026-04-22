// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import {
	CaretLeftIcon,
	ChatCircleIcon,
	EnvelopeSimpleIcon,
	LinkedinLogoIcon,
	DotsThreeIcon,
	DeviceMobileIcon,
	PhoneIcon,
	MapPinIcon,
	BuildingsIcon,
	UsersIcon,
	UserCircleIcon,
	PencilSimpleIcon,
	XIcon,
	PlusIcon,
	List,
	BriefcaseIcon,
	UserIcon
} from "@phosphor-icons/react";
import React, { useState, useMemo, useRef } from "react";
import type { Email, ContactData } from "~/types";
import { useParams, useNavigate } from "react-router";
import { useContacts, useUpdateContact } from "~/queries/contacts";

import { useUIStore } from "~/hooks/useUIStore";

interface Contact {
	emailAddress: string;
	displayName: string;
	latestEmail: Email;
	threadCount: number;
	unreadCount: number;
}

interface ContactDetailProps {
	contact?: Contact;
	onBack: () => void;
}

function ContactEditModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const { data: contactsData = [] } = useContacts(mailboxId);
	const updateContactMutation = useUpdateContact();
	
	const editedData = useMemo(() => {
		return contactsData?.find(c => c.id === contact.emailAddress.toLowerCase()) || {} as ContactData;
	}, [contactsData, contact.emailAddress]);

	const [firstName, setFirstName] = useState(editedData.firstName ?? (contact.displayName.split(" ")[0] || ""));
	const [lastName, setLastName] = useState(editedData.lastName ?? (contact.displayName.split(" ").slice(1).join(" ") || ""));
	const [email, setEmail] = useState(editedData.id || contact.emailAddress);
	const [deviceNumber, setDeviceNumber] = useState(editedData.deviceNumber || "");
	const [company, setCompany] = useState(editedData.company || "");
	const [title, setTitle] = useState(editedData.title || "");
	const [department, setDepartment] = useState(editedData.department || "");
	const [officeLocation, setOfficeLocation] = useState(editedData.officeLocation || "");
	const [avatarUrl, setAvatarUrl] = useState(editedData.avatarUrl || "");
	
	// Social fields
	const [linkedIn, setLinkedIn] = useState(editedData.linkedIn || "");
	const [facebook, setFacebook] = useState(editedData.facebook || "");
	const [website, setWebsite] = useState(editedData.website || "");
	const [xAccount, setXAccount] = useState(editedData.xAccount || "");
	
	const [activeTab, setActiveTab] = useState<"contact" | "organization" | "socials">("contact");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Convert to base64
		const reader = new FileReader();
		reader.onload = (event) => {
			if (event.target?.result) {
				setAvatarUrl(event.target.result as string);
			}
		};
		reader.readAsDataURL(file);
	};

	const handleSave = () => {
		updateContactMutation.mutate({
			mailboxId: mailboxId!,
			id: contact.emailAddress.toLowerCase(),
			data: {
				firstName,
				lastName,
				deviceNumber,
				company,
				title,
				department,
				officeLocation,
				avatarUrl,
				linkedIn,
				facebook,
				website,
				xAccount,
				displayName: `${firstName} ${lastName}`.trim()
			}
		}, {
			onSuccess: () => {
				onClose();
			},
			onError: (error) => {
				console.error("Failed to save contact details:", error);
				alert("Failed to save contact. Please try again.");
			}
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm" onClick={onClose}>
			<div
				className="w-full max-w-[480px] bg-gradient-to-br from-[#1a1b33] via-[#1a1226] to-[#2d152a] border border-sh-border rounded-lg shadow-2xl flex flex-col overflow-hidden text-sh-text-white max-h-[80vh]"
				role="dialog"
				aria-modal="true"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center p-4 pb-0">
					<h2 className="text-[16px] font-semibold text-sh-text-white pl-4 pt-2">Edit Contact</h2>
					<button onClick={onClose} className="text-sh-text-muted hover:text-sh-text-white transition-colors mb-auto">
						<XIcon size={20} />
					</button>
				</div>
				<div className="flex justify-center mt-2 border-b border-sh-border pb-4 mx-8">
					<div className="flex gap-1 bg-sh-bg-panel p-1 rounded-lg">
						<button 
							onClick={() => setActiveTab("contact")}
							className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors ${activeTab === "contact" ? "bg-sh-bg-hover text-white" : "text-sh-text-muted hover:text-sh-text-white"}`}
						>
							Contact
						</button>
						<button 
							onClick={() => setActiveTab("organization")}
							className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors ${activeTab === "organization" ? "bg-sh-bg-hover text-white" : "text-sh-text-muted hover:text-sh-text-white"}`}
						>
							Organization
						</button>
						<button 
							onClick={() => setActiveTab("socials")}
							className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-colors ${activeTab === "socials" ? "bg-sh-bg-hover text-white" : "text-sh-text-muted hover:text-sh-text-white"}`}
						>
							Socials
						</button>
					</div>
				</div>

				<div className="overflow-y-auto px-8 py-6 space-y-8 no-scrollbar">
					{activeTab === "contact" && (
						<>
							{/* Avatar & Name */}
							<div className="flex gap-5 items-start">
								<div className="mt-4 text-sh-text-muted"><UserIcon size={20} /></div>
								<div 
									className="w-16 h-16 rounded-full bg-sh-bg-hover flex items-center justify-center text-2xl font-bold border border-sh-border shrink-0 mt-2 text-white overflow-hidden cursor-pointer group relative"
									onClick={() => fileInputRef.current?.click()}
									title="Click to upload avatar"
								>
									{avatarUrl ? (
										<img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
									) : (
										(firstName.charAt(0).toUpperCase() || "?")
									)}
									<div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
										<PencilSimpleIcon size={20} className="text-white" />
									</div>
								</div>
								<input 
									type="file" 
									accept="image/*" 
									className="hidden" 
									ref={fileInputRef} 
									onChange={handleAvatarUpload} 
								/>
								<div className="flex-1 space-y-3 mt-1">
									<div>
										<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">First name</label>
										<input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
									</div>
									<div>
										<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Last name</label>
										<input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
									</div>
								</div>
							</div>

							{/* Email */}
							<div className="flex gap-5 items-start">
								<div className="mt-4 text-sh-text-muted"><EnvelopeSimpleIcon size={20} /></div>
								<div className="flex-1">
									<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Email</label>
									<input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
								</div>
							</div>

							{/* Phone */}
							<div className="flex gap-5 items-start">
								<div className="mt-4 text-sh-text-muted"><PhoneIcon size={20} /></div>
								<div className="flex-1">
									<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Device number</label>
									<input value={deviceNumber} onChange={e => setDeviceNumber(e.target.value)} className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
								</div>
							</div>
						</>
					)}

					{activeTab === "organization" && (
						<div className="flex gap-5 items-start">
							<div className="mt-4 text-sh-text-muted"><BriefcaseIcon size={20} /></div>
							<div className="flex-1">
								<div className="grid grid-cols-2 gap-x-6 gap-y-4">
									<div>
										<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Company</label>
										<input value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
									</div>
									<div>
										<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Title</label>
										<input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
									</div>
									<div>
										<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Department</label>
										<input value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
									</div>
									<div>
										<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Office location</label>
										<input value={officeLocation} onChange={e => setOfficeLocation(e.target.value)} className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
									</div>
								</div>
							</div>
						</div>
					)}

					{activeTab === "socials" && (
						<div className="flex flex-col gap-6">
							<div className="flex gap-5 items-start">
								<div className="mt-4 text-sh-text-muted"><LinkedinLogoIcon size={20} /></div>
								<div className="flex-1">
									<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">LinkedIn</label>
									<input value={linkedIn} onChange={e => setLinkedIn(e.target.value)} placeholder="linkedin.com/in/username" className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
								</div>
							</div>
							<div className="flex gap-5 items-start">
								<div className="mt-4 text-sh-text-muted"><ChatCircleIcon size={20} /></div>
								<div className="flex-1">
									<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Facebook</label>
									<input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="facebook.com/username" className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
								</div>
							</div>
							<div className="flex gap-5 items-start">
								<div className="mt-4 text-sh-text-muted"><List size={20} /></div>
								<div className="flex-1">
									<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">Website</label>
									<input value={website} onChange={e => setWebsite(e.target.value)} placeholder="example.com" className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
								</div>
							</div>
							<div className="flex gap-5 items-start">
								<div className="mt-4 text-sh-text-muted"><UsersIcon size={20} /></div>
								<div className="flex-1">
									<label className="text-[11px] font-medium text-sh-text-muted block mb-0.5">X (Twitter)</label>
									<input value={xAccount} onChange={e => setXAccount(e.target.value)} placeholder="@username" className="w-full bg-transparent border-b border-sh-border focus:border-sh-accent outline-none text-[14px] pb-1 transition-colors" />
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="px-8 py-4 border-t border-sh-border flex gap-3 mt-auto bg-black/20">
					<button onClick={handleSave} className="px-5 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] text-white text-[13px] font-medium rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent">
						Save
					</button>
					<button onClick={onClose} className="px-5 py-1.5 bg-transparent border border-sh-border hover:bg-sh-bg-hover text-white text-[13px] font-medium rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent">
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}

function ContactField({
	icon,
	label,
	value,
	isLink,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	isLink?: boolean;
}) {
	return (
		<div className="flex items-start gap-4">
			<div className="text-sh-text-muted mt-0.5">{icon}</div>
			<div className="flex flex-col min-w-0">
				<span className="text-[12px] text-sh-text-muted mb-0.5">{label}</span>
				{isLink ? (
					<a href="#" className="text-[14px] text-sh-accent hover:underline truncate">
						{value}
					</a>
				) : (
					<span className="text-[14px] text-sh-text-white truncate">{value}</span>
				)}
			</div>
		</div>
	);
}

export default function ContactDetail({ contact, onBack }: ContactDetailProps) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const navigate = useNavigate();
	const { startCompose, setSelectedContact } = useUIStore();
	const { data: contactsData = [] } = useContacts(mailboxId);
	const [isEditing, setIsEditing] = useState(false);
	const [activeDetailTab, setActiveDetailTab] = useState<"overview" | "contact" | "organization" | "socials">("overview");

	if (!contact) return null;

	const editedData = useMemo(() => {
		return contactsData.find(c => c.id === contact.emailAddress.toLowerCase()) || {} as ContactData;
	}, [contactsData, contact.emailAddress]);

	const displayName = editedData.displayName || contact.displayName;
	const emailAddress = editedData.id || contact.emailAddress;
	const deviceNumber = editedData.deviceNumber || "-";
	const company = editedData.company || "-";
	const title = editedData.title || "-";
	const department = editedData.department || "-";
	const officeLocation = editedData.officeLocation || "-";

	const initial = displayName.charAt(0).toUpperCase() || "?";
	
	const navigateToInbox = () => navigate(`/mailbox/${mailboxId}/emails/inbox`);

	return (
		<div className="flex flex-col h-full w-full bg-transparent text-sh-text-white relative overflow-y-auto no-scrollbar">
			{/* Mobile back button */}
			<div className="md:hidden sticky top-0 bg-sh-bg-dark/80 backdrop-blur-md z-10 px-4 py-3 border-b border-sh-border flex items-center">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center text-sh-text-muted hover:text-sh-text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent rounded-[2px]"
					aria-label="Back to contacts list"
				>
					<CaretLeftIcon size={20} />
					<span className="ml-1 text-[14px] font-medium">Contacts</span>
				</button>
			</div>

			<div className="p-6 md:p-12 max-w-5xl w-full">
				{/* Header Section */}
				<div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 mb-12">
					{/* Avatar */}
					<div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-sh-bg-hover flex items-center justify-center text-4xl md:text-5xl font-bold text-sh-text-white shrink-0 border border-sh-border relative overflow-hidden">
						{editedData.avatarUrl ? <img src={editedData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : initial}
					</div>

					{/* Info & Actions */}
					<div className="flex flex-col flex-1 min-w-0">
						<h1 className="text-3xl md:text-[40px] font-bold mb-2 truncate">
							{displayName}
						</h1>
						<p className="text-sh-text-muted text-[15px] mb-5 truncate">
							{title} • {officeLocation}
						</p>

						<div className="flex items-center gap-2">
							<button onClick={() => {
								navigateToInbox();
								startCompose({ mode: "new", prefillTo: contact.emailAddress });
							}} className="flex items-center justify-center p-2.5 bg-sh-bg-panel hover:bg-sh-bg-hover transition-colors rounded-[4px] border border-sh-border focus:outline-none focus:ring-2 focus:ring-sh-accent" title="Email">
								<EnvelopeSimpleIcon size={20} />
							</button>
							<button onClick={() => {
								setSelectedContact(contact.emailAddress);
								navigateToInbox();
							}} className="flex items-center justify-center p-2.5 bg-sh-bg-panel hover:bg-sh-bg-hover transition-colors rounded-[4px] border border-sh-border focus:outline-none focus:ring-2 focus:ring-sh-accent" title="Chat">
								<ChatCircleIcon size={20} />
							</button>
							<button onClick={() => setIsEditing(true)} className="flex items-center justify-center p-2.5 bg-sh-bg-panel hover:bg-sh-bg-hover transition-colors rounded-[4px] border border-sh-border focus:outline-none focus:ring-2 focus:ring-sh-accent" title="Edit Contact">
								<PencilSimpleIcon size={20} />
							</button>
							<button className="flex items-center justify-center p-2.5 bg-sh-bg-panel hover:bg-sh-bg-hover transition-colors rounded-[4px] border border-sh-border focus:outline-none focus:ring-2 focus:ring-sh-accent" title="More options">
								<DotsThreeIcon size={20} />
							</button>
						</div>
					</div>
				</div>

				{/* Tabs Section */}
				<div className="flex items-center gap-8 border-b border-sh-border mb-8 overflow-x-auto no-scrollbar shrink-0">
					<button 
						onClick={() => setActiveDetailTab("overview")}
						className={`pb-3 text-[15px] font-medium border-b-2 whitespace-nowrap transition-colors ${activeDetailTab === "overview" ? "border-sh-accent text-sh-text-white" : "border-transparent text-sh-text-muted hover:text-sh-text-white"}`}
					>
						Overview
					</button>
					<button 
						onClick={() => setActiveDetailTab("contact")}
						className={`pb-3 text-[15px] font-medium border-b-2 whitespace-nowrap transition-colors ${activeDetailTab === "contact" ? "border-sh-accent text-sh-text-white" : "border-transparent text-sh-text-muted hover:text-sh-text-white"}`}
					>
						Contact
					</button>
					<button 
						onClick={() => setActiveDetailTab("organization")}
						className={`pb-3 text-[15px] font-medium border-b-2 whitespace-nowrap transition-colors ${activeDetailTab === "organization" ? "border-sh-accent text-sh-text-white" : "border-transparent text-sh-text-muted hover:text-sh-text-white"}`}
					>
						Organization
					</button>
					<button 
						onClick={() => setActiveDetailTab("socials")}
						className={`pb-3 text-[15px] font-medium border-b-2 whitespace-nowrap transition-colors ${activeDetailTab === "socials" ? "border-sh-accent text-sh-text-white" : "border-transparent text-sh-text-muted hover:text-sh-text-white"}`}
					>
						Socials
					</button>
				</div>

				{/* Content Section */}
				<div>
					{activeDetailTab === "overview" && (
						<>
							<h2 className="text-[16px] font-semibold text-sh-text-white mb-8">
								Contact information
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
								<ContactField
									icon={<EnvelopeSimpleIcon size={20} />}
									label="Email"
									value={emailAddress}
									isLink
								/>
								<ContactField
									icon={<DeviceMobileIcon size={20} />}
									label="Mobile"
									value={deviceNumber}
									isLink
								/>
								<ContactField
									icon={<BuildingsIcon size={20} />}
									label="Company"
									value={company}
								/>
								<ContactField
									icon={<UsersIcon size={20} />}
									label="Department"
									value={department}
								/>
								<ContactField
									icon={<UserCircleIcon size={20} />}
									label="Title"
									value={title}
								/>
								<ContactField
									icon={<MapPinIcon size={20} />}
									label="Office Location"
									value={officeLocation}
								/>
							</div>
						</>
					)}
					{activeDetailTab === "contact" && (
						<>
							<h2 className="text-[16px] font-semibold text-sh-text-white mb-8">
								Contact details
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
								<ContactField
									icon={<EnvelopeSimpleIcon size={20} />}
									label="Email"
									value={emailAddress}
									isLink
								/>
								<ContactField
									icon={<DeviceMobileIcon size={20} />}
									label="Mobile"
									value={deviceNumber}
									isLink
								/>
								<ContactField
									icon={<PhoneIcon size={20} />}
									label="Work phone"
									value="-"
									isLink
								/>
								<ContactField
									icon={<LinkedinLogoIcon size={20} />}
									label="LinkedIn"
									value={editedData.linkedIn || "-"}
									isLink={!!editedData.linkedIn}
								/>
								<ContactField
									icon={<ChatCircleIcon size={20} />}
									label="Facebook"
									value={editedData.facebook || "-"}
									isLink={!!editedData.facebook}
								/>
								<ContactField
									icon={<List size={20} />}
									label="Website"
									value={editedData.website || "-"}
									isLink={!!editedData.website}
								/>
								<ContactField
									icon={<UsersIcon size={20} />}
									label="X (Twitter)"
									value={editedData.xAccount || "-"}
									isLink={!!editedData.xAccount}
								/>
							</div>
						</>
					)}
					{activeDetailTab === "organization" && (
						<>
							<h2 className="text-[16px] font-semibold text-sh-text-white mb-8">
								Organization
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
								<ContactField
									icon={<BuildingsIcon size={20} />}
									label="Company"
									value={company}
								/>
								<ContactField
									icon={<UsersIcon size={20} />}
									label="Department"
									value={department}
								/>
								<ContactField
									icon={<UserCircleIcon size={20} />}
									label="Title"
									value={title}
								/>
								<ContactField
									icon={<MapPinIcon size={20} />}
									label="Office Location"
									value={officeLocation}
								/>
							</div>
						</>
					)}
					{activeDetailTab === "socials" && (
						<>
							<h2 className="text-[16px] font-semibold text-sh-text-white mb-8">
								Socials
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
								<ContactField
									icon={<LinkedinLogoIcon size={20} />}
									label="LinkedIn"
									value={editedData.linkedIn || "-"}
									isLink={!!editedData.linkedIn}
								/>
								<ContactField
									icon={<ChatCircleIcon size={20} />}
									label="Facebook"
									value={editedData.facebook || "-"}
									isLink={!!editedData.facebook}
								/>
								<ContactField
									icon={<List size={20} />}
									label="Website"
									value={editedData.website || "-"}
									isLink={!!editedData.website}
								/>
								<ContactField
									icon={<UsersIcon size={20} />}
									label="X (Twitter)"
									value={editedData.xAccount || "-"}
									isLink={!!editedData.xAccount}
								/>
							</div>
						</>
					)}
				</div>
			</div>
			{isEditing && <ContactEditModal contact={contact} onClose={() => setIsEditing(false)} />}
		</div>
	);
}
