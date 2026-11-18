import { ButtonStyle } from "discord.js";
import { botCopy } from "@config/strings";
import { customId } from "@core/button";
import { button, channelSelect, row } from "@lib/discord/components.util";
import { container, containerMessage, divider, text } from "@lib/discord/containers.util";
import { type ContainerMessage, type ContainerPart } from "@lib/discord/discord.types";
import { WELCOME_PANEL_ID } from "@lib/welcome/welcome.constants";
import { type WelcomeConfig } from "@lib/welcome/welcome.types";
import { placeholderLabel, WELCOME_PLACEHOLDERS } from "@lib/welcome/welcome.util";

/** Setting up the welcome system, as one screen you read and press. */

interface WelcomePanelState {
	/** `null` before anything is configured. */
	config: WelcomeConfig | null;
	note?: string;
}

const STYLE_LABELS = {
	text: ["Plain message", "رسالة نصية"],
	embed: ["Embed", "بطاقة مضمّنة"],
	card: ["Image card", "بطاقة مصوّرة"],
} as const;

function control(action: string, ownerId: string, ...args: (string | number)[]): string {
	return customId(WELCOME_PANEL_ID, action, ...args, ownerId);
}

function summary(config: WelcomeConfig | null): string {
	if (config === null) {
		return (
			botCopy("## 👋 Welcome messages\n", "## 👋 رسائل الترحيب\n") +
			botCopy(
				"Nobody is greeted yet. Pick a channel below and I will start.\n",
				"اختر قناة أدناه لتفعيل رسائل الترحيب.\n",
			) +
			botCopy("-# You can change the wording and the look afterwards.", "-# يمكنك تعديل النص وطريقة العرض لاحقًا.")
		);
	}

	return (
		botCopy("## 👋 Welcome messages\n", "## 👋 رسائل الترحيب\n") +
		botCopy(
			`New members are greeted in <#${config.channelId}> as a **${STYLE_LABELS[config.style][0].toLowerCase()}**.\n`,
			`تُرسل رسالة الترحيب في <#${config.channelId}>. طريقة العرض: **${STYLE_LABELS[config.style][1]}**.\n`,
		) +
		`-# ${backgroundNote(config)}`
	);
}

/** Only the image card has a background, so the other styles get told what they would gain by switching. */
function backgroundNote(config: WelcomeConfig): string {
	if (config.style !== "card")
		return botCopy(
			"Switch to the image card for a picture with their avatar.",
			"اختر البطاقة المصوّرة لإظهار صورة العضو الشخصية.",
		);

	return config.hasBackground
		? botCopy("Using your background image.", "تستخدم البطاقة الخلفية المخصصة.")
		: botCopy("Using the default background.", "تستخدم البطاقة الخلفية الافتراضية.");
}

function placeholderHelp(): string {
	const rows = WELCOME_PLACEHOLDERS.map((token) => `\`${token}\` — ${placeholderLabel(token)}`).join("\n");
	return botCopy(`**Placeholders**\n${rows}`, `**العناصر التي يملؤها البوت**\n${rows}`);
}

export function welcomePanel(state: WelcomePanelState, ownerId: string): ContainerMessage {
	const { config } = state;
	const off = config === null;

	const parts: ContainerPart[] = [text(summary(config))];
	if (state.note !== undefined) parts.push(text(`-# ${state.note}`));

	parts.push(divider());

	if (config !== null) {
		parts.push(
			text(botCopy(`**The message**\n>>> ${config.message}`, `**نص رسالة الترحيب**\n>>> ${config.message}`)),
			divider({ spacer: true }),
			text(placeholderHelp()),
		);
	}

	parts.push(
		divider(),
		text(
			botCopy(
				"**Greeting channel**\n-# Where the welcome is posted when someone joins.",
				"**قناة الترحيب**\n-# القناة التي تُرسل إليها الرسالة عند انضمام عضو.",
			),
		),
		row(
			channelSelect({
				id: control("channel", ownerId),
				placeholder: off
					? botCopy("Greet new members in…", "اختر قناة للترحيب…")
					: botCopy("Move the greeting somewhere else…", "انقل الترحيب إلى قناة أخرى…"),
				...(config !== null ? { defaultChannelIds: [config.channelId] } : {}),
			}),
		),
		row(
			button({
				id: control("style", ownerId, "text"),
				label: botCopy(...STYLE_LABELS.text),
				style: config?.style === "text" ? ButtonStyle.Primary : ButtonStyle.Secondary,
				disabled: off || config.style === "text",
			}),
			button({
				id: control("style", ownerId, "embed"),
				label: botCopy(...STYLE_LABELS.embed),
				style: config?.style === "embed" ? ButtonStyle.Primary : ButtonStyle.Secondary,
				disabled: off || config.style === "embed",
			}),
			button({
				id: control("style", ownerId, "card"),
				label: botCopy(...STYLE_LABELS.card),
				style: config?.style === "card" ? ButtonStyle.Primary : ButtonStyle.Secondary,
				disabled: off || config.style === "card",
			}),
		),
		row(
			button({
				id: control("edit", ownerId),
				label: botCopy("Edit the message", "تعديل الرسالة"),
				style: ButtonStyle.Success,
				disabled: off,
			}),
			button({ id: control("preview", ownerId), label: botCopy("Preview", "معاينة"), disabled: off }),
			button({
				id: control("clear-bg", ownerId),
				label: botCopy("Remove background", "إزالة الخلفية"),
				// Only meaningful once a background exists and the card is what is shown.
				disabled: off || !config.hasBackground,
			}),
			button({
				id: control("off", ownerId),
				label: botCopy("Turn off", "تعطيل الترحيب"),
				style: ButtonStyle.Danger,
				disabled: off,
			}),
		),
	);

	if (config !== null && config.style === "card") {
		parts.push(
			text(
				botCopy(
					"-# Upload your own background with `/welcome background` — a PNG or JPG, ideally 1024×400. " +
						"Without one the card uses the default gradient.",
					"-# لرفع خلفية مخصّصة، استخدم `/welcome background` مع صورة PNG أو JPG، ويفضّل أن يكون مقاسها 1024×400. تستخدم البطاقة تدرّجًا افتراضيًا إلى أن ترفع صورة.",
				),
			),
		);
	}

	return containerMessage(container({ category: "settings", parts }));
}
