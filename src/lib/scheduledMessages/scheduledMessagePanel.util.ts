import { ButtonStyle } from "discord.js";
import { botCopy } from "@config/strings";
import { customId } from "@core/button";
import { channelSelect, option, row, select } from "@lib/discord/components.util";
import { container, containerMessage, divider, text, withoutPings } from "@lib/discord/containers.util";
import { type ContainerMessage, type ContainerPart } from "@lib/discord/discord.types";
import { discordTime, escapeMarkdown, truncate } from "@lib/format/format.util";
import { SCHEDULE_PANEL_ID } from "@lib/scheduledMessages/scheduledMessages.constants";
import { repeatLabel } from "@lib/scheduledMessages/scheduledMessages.util";
import { settingsScreen, type ScreenAction, type ScreenRow } from "@lib/settings/settingsScreen.util";
import { SCHEDULE_LIMITS, type ScheduledMessage } from "@testify/shared";

type QuietPanel = ContainerMessage & { allowedMentions: { parse: [] } };

const flat = (value: string): string => value.replace(/\s+/g, " ");

/** A select option cannot show a timestamp, so it is written out in UTC there and nowhere else. */
function utc(iso: string): string {
	return `${iso.slice(0, 10)} ${iso.slice(11, 16)} ${botCopy("UTC", "بالتوقيت العالمي")}`;
}

function when(iso: string): string {
	const at = new Date(iso);
	return `${discordTime(at, "f")} (${discordTime(at, "R")})`;
}

/** Every scheduled message in the server, soonest first, picked from one menu. */
export function scheduleHub(messages: readonly ScheduledMessage[], ownerId: string, note?: string): QuietPanel {
	const parts: ContainerPart[] = [
		text(
			`## ⏰ ${botCopy("Scheduled messages", "الرسائل المجدولة")}\n${
				messages.length === 0
					? botCopy(
							"None yet. Use `/schedule add` to post a message later, once or every day or week.",
							"لا توجد رسائل مجدولة بعد. استخدم `/schedule add` لجدولة رسالة تُنشر مرة واحدة أو تُكرّر يوميًا أو أسبوعيًا.",
						)
					: botCopy(
							`${String(messages.length)} of ${String(SCHEDULE_LIMITS.maxPerGuild)}.`,
							`عدد الرسائل المجدولة: ${String(messages.length)} من أصل ${String(SCHEDULE_LIMITS.maxPerGuild)}.`,
						)
			}`,
		),
	];
	if (note !== undefined) parts.push(text(`-# ${note}`));

	if (messages.length > 0) {
		parts.push(
			divider(),
			text(
				messages
					.map(
						(entry, index) =>
							`${String(index + 1)}. <#${entry.channelId}> · ${when(entry.nextAt)} · ${repeatLabel(entry.repeat)}\n` +
							`-# ${escapeMarkdown(truncate(flat(entry.message), 80))}`,
					)
					.join("\n"),
			),
			row(
				select({
					id: customId(SCHEDULE_PANEL_ID, "open", ownerId),
					placeholder: botCopy("Choose one to change or delete…", "اختر رسالةً لتعديلها أو حذفها…"),
					options: messages.map((entry) =>
						option({
							label: truncate(flat(entry.message), 100),
							value: entry.id,
							description: botCopy(
								`${repeatLabel(entry.repeat)} · next ${utc(entry.nextAt)}`,
								`${repeatLabel(entry.repeat)} · النشر التالي ${utc(entry.nextAt)}`,
							),
						}),
					),
				}),
			),
		);
	}

	parts.push(
		text(
			botCopy(
				"-# Every post pings nobody, so a mention in it is shown but nobody is notified.",
				"-# تظهر الإشارات في الرسالة من دون إرسال إشعارات إلى المذكورين.",
			),
		),
	);

	return withoutPings(containerMessage(container({ category: "settings", parts })));
}

interface ScheduleEditorState {
	schedule: ScheduledMessage;
	note?: string;
	confirmingDelete?: boolean;
}

/** One scheduled message: where, when, how often and what it says, each applied on the press. */
export function scheduleEditor(state: ScheduleEditorState, ownerId: string): QuietPanel {
	const { schedule } = state;
	const args = [schedule.id];

	const rows: ScreenRow[] = [
		{
			label: botCopy("Next post", "موعد النشر التالي"),
			value: when(schedule.nextAt),
			action: { action: "time", label: botCopy("Change", "تعديل"), args },
		},
		{
			label: botCopy("Repeats", "التكرار"),
			value: repeatLabel(schedule.repeat),
			action: { action: "repeat", label: botCopy("Change", "تعديل"), args },
		},
		{
			label: botCopy("Message", "الرسالة"),
			value: truncate(schedule.message, 1_000),
			action: { action: "edit", label: botCopy("Edit", "تعديل"), args },
		},
	];
	if (!schedule.canSend) {
		rows.push({
			label: botCopy("⚠️ Cannot post", "⚠️ تعذّر النشر"),
			value: botCopy(
				`I cannot post in <#${schedule.channelId}>, so this will be skipped. Give me Send Messages there, or move it.`,
				`سأتخطّى هذه الرسالة لتعذّر النشر في <#${schedule.channelId}>. امنحني صلاحية إرسال الرسائل أو انقلها إلى قناة أخرى.`,
			),
		});
	}

	const actions: ScreenAction[] = state.confirmingDelete
		? [
				{ action: "delete-yes", label: botCopy("Delete it", "تأكيد الحذف"), style: ButtonStyle.Danger, args },
				{ action: "delete-no", label: botCopy("Keep it", "إبقاء الرسالة"), args },
			]
		: [
				{ action: "delete", label: botCopy("Delete", "حذف"), style: ButtonStyle.Danger, args },
				{ action: "hub", label: botCopy("All scheduled messages", "جميع الرسائل المجدولة") },
			];

	return withoutPings(
		settingsScreen({
			id: SCHEDULE_PANEL_ID,
			ownerId,
			category: "settings",
			title: botCopy("⏰ Scheduled message", "⏰ رسالة مجدولة"),
			status: state.confirmingDelete
				? botCopy("Delete this scheduled message? It will not be posted.", "هل تريد حذف هذه الرسالة من جدول النشر؟")
				: botCopy(
						`Posts in <#${schedule.channelId}>. Every change applies the moment you make it.`,
						`تُنشر في <#${schedule.channelId}>. تسري التعديلات فورًا.`,
					),
			...(state.note !== undefined ? { note: state.note } : {}),
			rows,
			pickers: [
				{
					label: botCopy("Posted in", "قناة النشر"),
					control: row(
						channelSelect({
							id: customId(SCHEDULE_PANEL_ID, "channel", schedule.id, ownerId),
							placeholder: botCopy("Channel to post in…", "اختر قناة النشر…"),
							defaultChannelIds: [schedule.channelId],
						}),
					),
				},
			],
			actions,
		}),
	);
}
