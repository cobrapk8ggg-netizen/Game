import {
	type Guild,
	type GuildMember,
	type Message,
	type MessageCreateOptions,
	type ModalBuilder,
	PermissionFlagsBits,
} from "discord.js";
import { HOUR_MS } from "@config/constants";
import { botCopy } from "@config/strings";
import { UserFacingError } from "@core/errors";
import { linkButton, modalForm, row } from "@lib/discord/components.util";
import { embed } from "@lib/discord/embeds.util";
import { truncate } from "@lib/format/format.util";
import { REPORT_FORM_ID, REPORT_LIMITS } from "@lib/modmail/modmail.constants";
import { readModmailSettings } from "@lib/modmail/modmailActions.util";

/** Right-click Report message: a member tells the server's staff about a message, in its mod mail channel. */

/** When each person last reported, by server, and which messages; nothing here outlives a restart. */
const sent = new Map<string, { at: number; messageId: string }[]>();

const keyOf = (guildId: string, userId: string): string => `${guildId}:${userId}`;

function recent(guildId: string, userId: string, now: number): { at: number; messageId: string }[] {
	return (sent.get(keyOf(guildId, userId)) ?? []).filter((report) => now - report.at < HOUR_MS);
}

export function reportLimitProblem(
	guildId: string,
	userId: string,
	messageId: string,
	now = Date.now(),
): string | null {
	const reports = recent(guildId, userId, now);
	if (reports.some((report) => report.messageId === messageId))
		return botCopy("You have reported that message already.", "سبق أن أبلغت عن تلك الرسالة.");
	if (reports.length >= REPORT_LIMITS.perHour) {
		return botCopy(
			`You have sent ${String(REPORT_LIMITS.perHour)} reports in the last hour. Try again later, or message a moderator.`,
			`بلغت الحدّ الأقصى للبلاغات خلال ساعة (${String(REPORT_LIMITS.perHour)}). أعد المحاولة لاحقًا أو راسل أحد المشرفين.`,
		);
	}
	return null;
}

function noteReport(guildId: string, userId: string, messageId: string, now: number): void {
	if (sent.size > REPORT_LIMITS.remembered) sent.clear();
	sent.set(keyOf(guildId, userId), [...recent(guildId, userId, now), { at: now, messageId }]);
}

export function clearReports(): void {
	sent.clear();
}

export function reportForm(message: Pick<Message, "channelId" | "id">, ownerId: string): ModalBuilder {
	return modalForm({
		id: REPORT_FORM_ID,
		action: "send",
		args: [message.channelId, message.id, ownerId],
		title: botCopy("Report a message", "الإبلاغ عن رسالة"),
		fields: [
			{
				id: "reason",
				label: botCopy("What is wrong with it", "سبب البلاغ"),
				paragraph: true,
				maxLength: REPORT_LIMITS.reasonLength,
			},
		],
	});
}

/** Where the report would go, or why it cannot be made; asked before the form opens and again when it is sent. */
export async function reportDestination(
	guild: Guild,
	reporterId: string,
	message: Message<true>,
): Promise<{ channelId: string; pingRoleId: string | null }> {
	if (message.system)
		throw new UserFacingError(
			botCopy(
				"Discord's own messages cannot be reported here.",
				"لا يمكن الإبلاغ هنا عن رسائل النظام الصادرة من ديسكورد.",
			),
		);
	if (message.author.id === reporterId)
		throw new UserFacingError(botCopy("You cannot report your own message.", "لا يمكنك الإبلاغ عن رسالة كتبتها أنت."));

	const settings = await readModmailSettings(guild);
	if (!settings.enabled || settings.channelId === null || !settings.canUse) {
		throw new UserFacingError(
			botCopy(
				"This server has not set up mod mail, so a report has nowhere to go. Tell a moderator.",
				"لم يضبط الخادم قناة مراسلات الإشراف لاستقبال البلاغات. أبلغ أحد المشرفين مباشرةً.",
			),
		);
	}

	const problem = reportLimitProblem(guild.id, reporterId, message.id);
	if (problem !== null) throw new UserFacingError(problem);
	return { channelId: settings.channelId, pingRoleId: settings.pingRoleId };
}

export function reportPost(report: {
	reporter: { id: string; username: string };
	message: Message<true>;
	reason: string;
	pingRoleId: string | null;
}): MessageCreateOptions {
	const { reporter, message } = report;
	const link = `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
	const files = message.attachments.size;
	const quote = message.content === "" ? "*No text*" : truncate(message.content, REPORT_LIMITS.quoteLength);

	return {
		...(report.pingRoleId === null ? {} : { content: `<@&${report.pingRoleId}>` }),
		embeds: [
			embed({
				category: "moderation",
				title: botCopy("🚩 Message reported", "🚩 بلاغ عن رسالة"),
				description: quote,
				fields: [
					{
						name: botCopy("Written by", "كاتب الرسالة"),
						value: `<@${message.author.id}> (${message.author.username})`,
						inline: true,
					},
					{
						name: botCopy("Reported by", "مقدّم البلاغ"),
						value: `<@${reporter.id}> (${reporter.username})`,
						inline: true,
					},
					{ name: botCopy("Channel", "القناة"), value: `<#${message.channelId}>`, inline: true },
					{
						name: botCopy("Sent", "وقت الإرسال"),
						value: `<t:${String(Math.floor(message.createdTimestamp / 1_000))}:f>`,
						inline: true,
					},
					...(files > 0 ? [{ name: botCopy("Attachments", "المرفقات"), value: String(files), inline: true }] : []),
					{ name: botCopy("What is wrong with it", "سبب البلاغ"), value: report.reason },
				],
				footer: botCopy(
					`Author ${message.author.id} · Message ${message.id}`,
					`معرّف الكاتب ${message.author.id} · معرّف الرسالة ${message.id}`,
				),
			}),
		],
		components: [row(linkButton(botCopy("Jump to message", "الذهاب إلى الرسالة"), link))],
		// The quote is somebody's own words, so only the role a manager chose is pinged.
		allowedMentions: { parse: [], roles: report.pingRoleId === null ? [] : [report.pingRoleId] },
	};
}

/** Sends a report from the form, reading the message again so what staff see is what is there now. */
export async function sendReport(
	reporter: GuildMember,
	channelId: string,
	messageId: string,
	reason: string,
): Promise<void> {
	const guild = reporter.guild;
	const channel = await guild.channels.fetch(channelId).catch(() => null);
	if (channel?.isTextBased() !== true || !channel.permissionsFor(reporter).has(PermissionFlagsBits.ViewChannel)) {
		throw new UserFacingError(
			botCopy(
				"That channel is gone, so there is nothing left to report.",
				"حُذفت القناة التي تضمّ الرسالة المراد الإبلاغ عنها.",
			),
		);
	}
	const message = await channel.messages.fetch(messageId).catch(() => null);
	if (message === null)
		throw new UserFacingError(
			botCopy(
				"That message has been deleted, so there is nothing left to report.",
				"حُذفت الرسالة المراد الإبلاغ عنها.",
			),
		);
	if (reason === "")
		throw new UserFacingError(
			botCopy(
				"Say what is wrong with it, so the moderators know what to look for.",
				"اشرح سبب البلاغ ليتمكّن فريق الإشراف من مراجعته.",
			),
		);

	const { channelId: destinationId, pingRoleId } = await reportDestination(guild, reporter.id, message);
	const destination = guild.channels.cache.get(destinationId);
	if (destination?.isSendable() !== true) {
		throw new UserFacingError(
			botCopy(
				"This server's mod mail channel is gone. Tell a moderator.",
				"حُذفت قناة مراسلات الإشراف في هذا الخادم. أبلغ أحد المشرفين مباشرةً.",
			),
		);
	}

	await destination.send(reportPost({ reporter: reporter.user, message, reason, pingRoleId }));
	noteReport(guild.id, reporter.id, message.id, Date.now());
}
