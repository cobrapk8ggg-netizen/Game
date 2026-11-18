import { botCopy } from "@config/strings";
import { customId } from "@core/button";
import { BIRTHDAY_PANEL_ID } from "@lib/birthdays/birthdays.constants";
import { birthdayMessage } from "@lib/birthdays/birthdays.util";
import { channelSelect, row } from "@lib/discord/components.util";
import { withoutPings } from "@lib/discord/containers.util";
import { type ContainerMessage } from "@lib/discord/discord.types";
import { settingsScreen, statusDot, switchAction } from "@lib/settings/settingsScreen.util";
import { type BirthdaySettings } from "@testify/shared";

export function birthdaySettingsPanel(
	settings: BirthdaySettings,
	shared: number,
	ownerId: string,
	note?: string,
): ContainerMessage & { allowedMentions: { parse: [] } } {
	const status = settings.enabled
		? botCopy(
				`${statusDot(true)} — birthdays are posted in <#${settings.channelId ?? ""}> on the day.`,
				`${statusDot(true)} — تُنشر التهنئة في <#${settings.channelId ?? ""}> يوم عيد الميلاد.`,
			)
		: settings.channelId === null
			? botCopy(
					`${statusDot(false)} — pick a channel below, then turn it on.`,
					`${statusDot(false)} — اختر قناةً أدناه، ثم فعّل الميزة.`,
				)
			: botCopy(`${statusDot(false)} — no birthdays are posted yet.`, `${statusDot(false)} — منشورات التهنئة معطّلة.`);

	return withoutPings(
		settingsScreen({
			id: BIRTHDAY_PANEL_ID,
			ownerId,
			category: "settings",
			title: botCopy("🎂 Birthdays", "🎂 أعياد الميلاد"),
			status,
			...(note !== undefined ? { note } : {}),
			rows: [
				{
					label: botCopy("The message", "نص التهنئة"),
					value: `>>> ${birthdayMessage(settings.message)}`,
					action: { action: "edit", label: botCopy("Edit", "تعديل") },
				},
				{
					label: botCopy("Shared with this server", "أعياد الميلاد المسجّلة في الخادم"),
					value: botCopy(
						`${String(shared)} ${shared === 1 ? "member" : "members"}, each by running \`/birthday set\` here.`,
						`عدد الأعضاء الذين سجّلوا تواريخ ميلادهم بالأمر \`/birthday set\`: ${String(shared)}.`,
					),
				},
				...(settings.channelId !== null && !settings.canSend
					? [
							{
								label: botCopy("⚠️ I cannot post there", "⚠️ لا أستطيع النشر في تلك القناة"),
								value: botCopy(
									"Let me send messages in that channel, or pick another.",
									"امنحني صلاحية إرسال الرسائل في تلك القناة، أو اختر قناةً أخرى.",
								),
							},
						]
					: []),
			],
			pickers: [
				{
					label: botCopy("Posted in", "قناة نشر التهاني"),
					hint: botCopy(
						"Where a birthday is posted, on the day, in UTC.",
						"تُنشر التهنئة في هذه القناة في يوم الميلاد حسب التوقيت العالمي المنسّق.",
					),
					control: row(
						channelSelect({
							id: customId(BIRTHDAY_PANEL_ID, "channel", ownerId),
							placeholder: botCopy("Channel for birthdays…", "اختر قناةً للتهاني…"),
							...(settings.channelId === null ? {} : { defaultChannelIds: [settings.channelId] }),
						}),
					),
				},
			],
			actions: [switchAction(settings.enabled, settings.channelId !== null)],
			footer: botCopy(
				"Placeholders: `{user}` mentions them, `{username}` names them, `{server}` is this server. Only the member is pinged, and never their age, which is not kept.",
				"الحقل `{user}` يشير إلى العضو، و`{username}` يكتب اسمه، و`{server}` يكتب اسم الخادم. لا يُشعَر سوى صاحب عيد الميلاد، ولا تُحفظ سنّه.",
			),
		}),
	);
}
