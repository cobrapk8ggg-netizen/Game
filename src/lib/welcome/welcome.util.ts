import { botCopy } from "@config/strings";
import { type WelcomeSettings } from "@database/models/welcome.schema";
import { type WelcomeConfig } from "@lib/welcome/welcome.types";
import {
	DEFAULT_WELCOME_MESSAGE,
	fillTemplate,
	type GreetingContext,
	isWelcomeStyle,
	WELCOME_LIMITS,
	WELCOME_PLACEHOLDERS,
	type WelcomePlaceholder,
	WELCOME_STYLES,
} from "@testify/shared";

/** The rules of the welcome system, with no Discord objects in sight. */

// Declared in `@testify/shared` so the dashboard's form validates against the same rules.
export {
	DEFAULT_WELCOME_MESSAGE,
	fillTemplate,
	type GreetingContext,
	isWelcomeStyle,
	WELCOME_LIMITS,
	WELCOME_PLACEHOLDERS,
	WELCOME_STYLES,
};

/** What each placeholder stands for, in the words the Discord panel prints beside it. */
export const PLACEHOLDER_HELP: Record<WelcomePlaceholder, string> = {
	"{user}": "Mentions them",
	"{username}": "Their name, unlinked",
	"{server}": "This server's name",
	"{count}": "How many members there are now",
};

const ARABIC_PLACEHOLDER_HELP: Record<WelcomePlaceholder, string> = {
	"{user}": "إشارة إلى العضو",
	"{username}": "اسم العضو من دون إشارة",
	"{server}": "اسم الخادم",
	"{count}": "عدد الأعضاء الحالي",
};

export function placeholderLabel(token: WelcomePlaceholder): string {
	return botCopy(PLACEHOLDER_HELP[token], ARABIC_PLACEHOLDER_HELP[token]);
}

export function welcomeMessage(message: string): string {
	return message === DEFAULT_WELCOME_MESSAGE
		? botCopy(message, "مرحبًا بك في **{server}**، {user}! أنت العضو رقم **{count}**.")
		: message;
}

type AddedLater = "style" | "background";
export type StoredWelcomeSettings = Omit<WelcomeSettings, AddedLater> & Partial<Pick<WelcomeSettings, AddedLater>>;

/** Folds the old `isEmbed` flag into the three-way style, so no other file knows it existed. */
export function normaliseWelcome(settings: StoredWelcomeSettings | null): WelcomeConfig | null {
	if (settings === null) return null;

	return {
		channelId: settings.channelId,
		message: welcomeMessage(settings.message),
		style: settings.style ?? (settings.isEmbed ? "embed" : "text"),
		hasBackground: (settings.background?.data.byteLength ?? 0) > 0,
	};
}

interface BackgroundCheck {
	ok: boolean;
	reason?: string;
}

/** Whether an uploaded file can be used as a card background. */
export function checkBackground(file: {
	contentType: string | null;
	size: number;
	width?: number | null;
}): BackgroundCheck {
	if (!file.contentType?.startsWith("image/")) {
		return {
			ok: false,
			reason: botCopy(
				"That is not an image. Upload a PNG, JPG or WebP.",
				"الملف المرفق ليس صورة. ارفع صورة بصيغة PNG أو JPG أو WebP.",
			),
		};
	}

	if (file.contentType.includes("gif")) {
		return {
			ok: false,
			reason: botCopy(
				"Animated GIFs cannot be used — the card is a still image. Try a PNG or JPG.",
				"تتطلب البطاقة صورة ثابتة. استخدم PNG أو JPG بدلًا من صورة GIF متحركة.",
			),
		};
	}

	if (file.size > WELCOME_LIMITS.maxBackgroundBytes) {
		const megabytes = Math.round(WELCOME_LIMITS.maxBackgroundBytes / 1024 / 1024);
		return {
			ok: false,
			reason: botCopy(
				`That image is too large. Keep it under ${megabytes} MB.`,
				`الصورة كبيرة جدًا. اختر صورة يقلّ حجمها عن ${megabytes} ميغابايت.`,
			),
		};
	}

	return { ok: true };
}
