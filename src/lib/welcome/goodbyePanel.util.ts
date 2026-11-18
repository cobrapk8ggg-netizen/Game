import { botCopy } from "@config/strings";
import { customId } from "@core/button";
import { channelSelect, row } from "@lib/discord/components.util";
import { withoutPings } from "@lib/discord/containers.util";
import { type ContainerMessage } from "@lib/discord/discord.types";
import { settingsScreen, statusDot, switchAction } from "@lib/settings/settingsScreen.util";
import { GOODBYE_PANEL_ID } from "@lib/welcome/welcome.constants";
import { placeholderLabel } from "@lib/welcome/welcome.util";
import { type GoodbyeSettings, WELCOME_PLACEHOLDERS } from "@testify/shared";

const STYLE_LABELS = { text: ["Plain message", "رسالة نصية"], embed: ["Embed", "بطاقة مضمّنة"] } as const;

export function goodbyePanel(
	settings: GoodbyeSettings,
	ownerId: string,
	note?: string,
): ContainerMessage & { allowedMentions: { parse: [] } } {
	const [styleEnglish, styleArabic] = STYLE_LABELS[settings.style];
	const status = settings.enabled
		? botCopy(
				`${statusDot(true)} — a goodbye is posted in <#${settings.channelId ?? ""}> when somebody leaves.`,
				`${statusDot(true)} · تُرسل الرسالة في <#${settings.channelId ?? ""}> عند مغادرة عضو.`,
			)
		: settings.channelId === null
			? botCopy(
					`${statusDot(false)} — pick a channel below, then turn it on.`,
					`${statusDot(false)} · اختر قناة أدناه ثم فعّل رسائل الوداع.`,
				)
			: botCopy(
					`${statusDot(false)} — nobody is said goodbye to yet.`,
					`${statusDot(false)} · إرسال رسائل الوداع متوقّف.`,
				);

	const placeholders = WELCOME_PLACEHOLDERS.map(
		(token) => `\`${token}\` ${placeholderLabel(token).toLowerCase()}`,
	).join(" · ");

	return withoutPings(
		settingsScreen({
			id: GOODBYE_PANEL_ID,
			ownerId,
			category: "settings",
			title: botCopy("👋 Goodbye messages", "👋 رسائل الوداع"),
			status,
			...(note !== undefined ? { note } : {}),
			rows: [
				{
					label: botCopy("The message", "نص رسالة الوداع"),
					value: `>>> ${settings.message}`,
					action: { action: "edit", label: botCopy("Edit", "تعديل") },
				},
				{
					label: botCopy("Sent as", "طريقة العرض"),
					value: botCopy(styleEnglish, styleArabic),
					action: {
						action: "style",
						label:
							settings.style === "text"
								? botCopy("Use an embed", "استخدام بطاقة مضمّنة")
								: botCopy("Use a plain message", "استخدام رسالة نصية"),
						args: [settings.style === "text" ? "embed" : "text"],
					},
				},
				...(settings.channelId !== null && !settings.canSend
					? [
							{
								label: botCopy("⚠️ I cannot post there", "⚠️ تعذّر النشر في هذه القناة"),
								value: botCopy(
									"Let me send messages in that channel, or pick another.",
									"امنح البوت صلاحية «إرسال الرسائل» فيها أو اختر قناة أخرى.",
								),
							},
						]
					: []),
			],
			pickers: [
				{
					label: botCopy("Posted in", "قناة الوداع"),
					hint: botCopy(
						"Where the goodbye goes when somebody leaves the server.",
						"القناة التي تُرسل إليها رسالة الوداع عند مغادرة عضو.",
					),
					control: row(
						channelSelect({
							id: customId(GOODBYE_PANEL_ID, "channel", ownerId),
							placeholder: botCopy("Channel for goodbyes…", "اختر قناة للوداع…"),
							...(settings.channelId === null ? {} : { defaultChannelIds: [settings.channelId] }),
						}),
					),
				},
			],
			actions: [
				{ action: "preview", label: botCopy("Preview", "معاينة") },
				switchAction(settings.enabled, settings.channelId !== null),
			],
			footer: botCopy(
				`Placeholders: ${placeholders}. Nobody is pinged, because the member has already left.`,
				`العناصر التي يملؤها البوت: ${placeholders}. لا يُرسل أي إشعار لأن العضو غادر الخادم.`,
			),
		}),
	);
}
