// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Tooltip } from "@cloudflare/kumo";
import {
	ArrowClockwiseIcon,
	ArrowCounterClockwiseIcon,
	LinkBreakIcon,
	LinkSimpleIcon,
	ListBulletsIcon,
	ListNumbersIcon,
	MinusIcon,
	QuotesIcon,
	TextBIcon,
	TextItalicIcon,
	TextStrikethroughIcon,
	TextUnderlineIcon,
} from "@phosphor-icons/react";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TiptapImage from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
}

export default function RichTextEditor({
	value,
	onChange,
}: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			LinkExtension.configure({ openOnClick: false }),
			TiptapImage,
			TextStyle,
			Color,
			Highlight.configure({ multicolor: true }),
		],
		content: value,
		editorProps: {
			attributes: {
				class:
					"prose prose-sm max-w-none focus:outline-none min-h-[180px] p-3 text-[13px] text-sh-text-white [&_blockquote]:border-l-2 [&_blockquote]:border-sh-border-thin [&_blockquote]:pl-3 [&_blockquote]:text-sh-text-muted [&_blockquote]:bg-sh-bg-hover [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:text-[12px] [&_blockquote]:rounded-[2px]",
			},
		},
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
	});

	useEffect(() => {
		if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
			editor.commands.setContent(value);
			// Place cursor at the start of the document (above quoted text)
			const rafId = requestAnimationFrame(() => {
				if (!editor.isDestroyed) {
					editor.commands.focus('start');
				}
			});
			return () => cancelAnimationFrame(rafId);
		}
	}, [value, editor]);

	const setLink = useCallback(() => {
		if (!editor) return;
		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("URL", previousUrl);
		if (url === null) return;
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}, [editor]);

	if (!editor) return null;

	const ToolbarButton = ({ 
		active = false, 
		onClick, 
		disabled = false, 
		icon, 
		ariaLabel 
	}: { 
		active?: boolean; 
		onClick: () => void; 
		disabled?: boolean; 
		icon: React.ReactNode; 
		ariaLabel: string; 
	}) => (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			className={`p-1.5 rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-sh-accent flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
				active 
					? "bg-sh-bg-selected text-sh-text-white" 
					: "text-sh-text-muted hover:text-sh-text-white hover:bg-sh-bg-hover"
			}`}
		>
			{icon}
		</button>
	);

	return (
		<div className="rounded-[2px] overflow-hidden flex flex-col h-full bg-sh-bg-dark">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 bg-sh-bg-panel px-2 py-1.5 border-b border-sh-border-thin shrink-0">
				{/* Text formatting */}
				<Tooltip content="Bold" side="bottom" asChild>
					<ToolbarButton
						active={editor.isActive("bold")}
						icon={<TextBIcon size={16} />}
						onClick={() => editor.chain().focus().toggleBold().run()}
						ariaLabel="Bold"
					/>
				</Tooltip>
				<Tooltip content="Italic" side="bottom" asChild>
					<ToolbarButton
						active={editor.isActive("italic")}
						icon={<TextItalicIcon size={16} />}
						onClick={() => editor.chain().focus().toggleItalic().run()}
						ariaLabel="Italic"
					/>
				</Tooltip>
				<Tooltip content="Underline" side="bottom" asChild>
					<ToolbarButton
						active={editor.isActive("underline")}
						icon={<TextUnderlineIcon size={16} />}
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						ariaLabel="Underline"
					/>
				</Tooltip>
				<Tooltip content="Strikethrough" side="bottom" asChild>
					<ToolbarButton
						active={editor.isActive("strike")}
						icon={<TextStrikethroughIcon size={16} />}
						onClick={() => editor.chain().focus().toggleStrike().run()}
						ariaLabel="Strikethrough"
					/>
				</Tooltip>

				<div className="mx-1 h-5 w-px bg-sh-border-thin" />

				{/* Lists */}
				<Tooltip content="Bullet list" side="bottom" asChild>
					<ToolbarButton
						active={editor.isActive("bulletList")}
						icon={<ListBulletsIcon size={16} />}
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						ariaLabel="Bullet list"
					/>
				</Tooltip>
				<Tooltip content="Numbered list" side="bottom" asChild>
					<ToolbarButton
						active={editor.isActive("orderedList")}
						icon={<ListNumbersIcon size={16} />}
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						ariaLabel="Numbered list"
					/>
				</Tooltip>

				<div className="mx-1 h-5 w-px bg-sh-border-thin" />

				{/* Block formatting */}
				<Tooltip content="Blockquote" side="bottom" asChild>
					<ToolbarButton
						active={editor.isActive("blockquote")}
						icon={<QuotesIcon size={16} />}
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						ariaLabel="Blockquote"
					/>
				</Tooltip>
				<Tooltip content="Link" side="bottom" asChild>
					<ToolbarButton
						active={editor.isActive("link")}
						icon={<LinkSimpleIcon size={16} />}
						onClick={setLink}
						ariaLabel="Link"
					/>
				</Tooltip>
				{editor.isActive("link") && (
					<Tooltip content="Remove link" side="bottom" asChild>
						<ToolbarButton
							icon={<LinkBreakIcon size={16} />}
							onClick={() => editor.chain().focus().unsetLink().run()}
							ariaLabel="Remove link"
						/>
					</Tooltip>
				)}
				<Tooltip content="Horizontal rule" side="bottom" asChild>
					<ToolbarButton
						icon={<MinusIcon size={16} />}
						onClick={() => editor.chain().focus().setHorizontalRule().run()}
						ariaLabel="Horizontal rule"
					/>
				</Tooltip>

				<div className="mx-1 h-5 w-px bg-sh-border-thin" />

				{/* Undo/Redo */}
				<Tooltip content="Undo" side="bottom" asChild>
					<ToolbarButton
						icon={<ArrowCounterClockwiseIcon size={16} />}
						onClick={() => editor.chain().focus().undo().run()}
						disabled={!editor.can().undo()}
						ariaLabel="Undo"
					/>
				</Tooltip>
				<Tooltip content="Redo" side="bottom" asChild>
					<ToolbarButton
						icon={<ArrowClockwiseIcon size={16} />}
						onClick={() => editor.chain().focus().redo().run()}
						disabled={!editor.can().redo()}
						ariaLabel="Redo"
					/>
				</Tooltip>
			</div>

			{/* Editor content */}
			<div className="flex-1 overflow-y-auto">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
