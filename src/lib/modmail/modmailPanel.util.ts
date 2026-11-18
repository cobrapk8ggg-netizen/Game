import { ButtonStyle } from "discord.js";
import { botCopy } from "@config/strings";
import { customId } from "@core/button";
import { type StoredConversation } from "@database/repositories/modmailRepository";
import { button, channelSelect, option, roleSelect, row, select } from "@lib/discord/components.util";
import { container, containerMessage, divider, text } from "@lib/discord/containers.util";
import { type ContainerMessage, type ContainerPart } from "@lib/discord/discord.types";
import { MODMAIL_ID, MODMAIL_SETTINGS_ID } from "@lib/modmail/modmail.constants";
import { settingsScreen, statusDot, switchAction } from "@lib/settings/settingsScreen.util";
import { MODMAIL_NOTE_PREFIX, type ModmailSettings } from "@testify/shared";

const seconds = (date: Date): string => String(Math.floor(date.getTime() / 1_000));

function quoted(value: string): string {
	return value
		.split("\n")
		.map((line) => `> ${line}`)
		.join("\n");
}

/** The thread's name in the staff channel, inside Discord's 100 characters. */
export function threadName(username: string): string {
	return `📬 ${username}`.slice(0, 100);
}

/** The first post in a conversation's thread, carrying what the member wrote and the Close button. */
export function openingPost(
	conversation: StoredConversation,
	firstMessage: string,
	pingRoleId: string | null,
): ContainerMessage {
	const ping = pingRoleId === null ? "" : `<@&${pingRoleId}> `;
	const parts: ContainerPart[] = [
		text(
			botCopy(
				`## 📬 Mod mail\n${ping}<@${conversation.userId}> (${conversation.username}) · ${conversation.userId}`,
				`## 📬 مراسلات الإشراف\n${ping}<@${conversation.userId}> (${conversation.username}) · ${conversation.userId}`,
			),
		),
		text(quoted(firstMessage)),
		divider(),
		text(
			botCopy(
				`-# Everything you write in this thread is sent to them, except a message starting with \`${MODMAIL_NOTE_PREFIX}\`, which stays here. Opened <t:${seconds(conversation.createdAt)}:R>.`,
				`-# تُرسل رسائل هذه المحادثة إلى العضو. لكتابة ملاحظة داخلية، ابدأ الرسالة بـ \`${MODMAIL_NOTE_PREFIX}\`. فُتحت المحادثة <t:${seconds(conversation.createdAt)}:R>.`,
			),
		),
		row(
			button({
				id: customId(MODMAIL_ID, "close", conversation.id),
				label: botCopy("Close", "إغلاق"),
				style: ButtonStyle.Danger,
			}),
		),
	];

	return containerMessage(container({ category: "moderation", parts }));
}

/** `/modmail open`: the button that opens the form, because a prefix command cannot show one. */
export function writePanel(guildName: string, guildId: string, userId: string): ContainerMessage {
	return containerMessage(
		container({
			category: "moderation",
			parts: [
				text(
					botCopy(
						`## 📬 Write to the staff of ${guildName}\nOnly they read it. Their replies come to you in a direct message, and anything you send me there goes back to them until one of you closes it.`,
						`## 📬 مراسلة فريق الإشراف في ${guildName}\nيقرأ فريق الإشراف رسالتك، وتصل ردوده إلى رسائلك الخاصة. أنقل إليهم كل ما ترسله إليّ هناك إلى أن تُغلق المحادثة.`,
					),
				),
				row(
					button({
						id: customId(MODMAIL_ID, "write", guildId, userId),
						label: botCopy("Write to the staff", "مراسلة فريق الإشراف"),
						emoji: "✏️",
					}),
				),
			],
		}),
	);
}

/** Offered in a direct message to somebody with nothing open who shares servers that take mod mail. */
export function offerPanel(servers: readonly { id: string; name: string }[], userId: string): ContainerMessage {
	return containerMessage(
		container({
			category: "moderation",
			parts: [
				text(
					botCopy(
						"## 📬 Write to a server's staff?\nPick the server and write your message. Its staff get it in a private thread, and their replies come back here.",
						"## 📬 أتريد مراسلة فريق الإشراف؟\nاختر الخادم واكتب رسالتك. يتلقّاها فريق الإشراف في محادثة مخصّصة له، وتصلك الردود هنا.",
					),
				),
				row(
					select({
						id: customId(MODMAIL_ID, "pick", userId),
						placeholder: botCopy("Choose a server…", "اختر خادمًا…"),
						options: servers.map((server) => option({ label: server.name.slice(0, 100), value: server.id })),
					}),
				),
			],
		}),
	);
}

/** Sent to the member once a conversation opens, with their own way to close it. */
export function openedNotice(guildName: string, conversationId: string, userId: string): ContainerMessage {
	return containerMessage(
		container({
			category: "moderation",
			parts: [
				text(
					botCopy(
						`## 📬 Sent to the staff of ${guildName}\nEverything you send me here now goes to them, and their replies come back here, until one of you closes it.`,
						`## 📬 أُرسلت الرسالة إلى فريق الإشراف في ${guildName}\nما ترسله هنا يصل إلى الفريق، وتصلك ردوده في هذه المحادثة إلى أن يغلقها أحدكما.`,
					),
				),
				row(
					button({
						id: customId(MODMAIL_ID, "close-own", conversationId, userId),
						label: botCopy("Close", "إغلاق"),
						style: ButtonStyle.Secondary,
					}),
				),
			],
		}),
	);
}

/** What the member's own Close leaves; a Components V2 message can only be edited into another. */
export function closedNotice(): ContainerMessage {
	return containerMessage(
		container({
			category: "moderation",
			parts: [
				text(
					botCopy(
						"📬 Closed. Write to me again whenever you want to start a new one.",
						"📬 أُغلقت المحادثة. أرسل إليّ رسالة متى أردت بدء محادثة جديدة.",
					),
				),
			],
		}),
	);
}

/** How a staff reply is signed in the member's direct messages. */
export function staffSignature(guildName: string, staffName: string, anonymous: boolean): string {
	return anonymous
		? botCopy(`**Staff of ${guildName}**`, `**فريق الإشراف في ${guildName}**`)
		: botCopy(`**${staffName}** · staff of ${guildName}`, `**${staffName}** · من فريق الإشراف في ${guildName}`);
}

/** `/modmail settings`: the switch, the channel threads are made in, who is pinged and how replies are signed. */
export function modmailSettingsPanel(settings: ModmailSettings, ownerId: string, note?: string): ContainerMessage {
	const status = settings.enabled
		? botCopy(
				`${statusDot(true)} — members can write to staff, in threads in <#${settings.channelId ?? ""}>.`,
				`${statusDot(true)} — يستطيع الأعضاء مراسلة فريق الإشراف. تُنشأ المحادثات في <#${settings.channelId ?? ""}>.`,
			)
		: settings.channelId === null
			? botCopy(
					`${statusDot(false)} — pick a channel below, then turn it on.`,
					`${statusDot(false)} — اختر قناةً أدناه، ثم فعّل الميزة.`,
				)
			: botCopy(
					`${statusDot(false)} — members cannot write to staff yet.`,
					`${statusDot(false)} — مراسلات الإشراف معطّلة.`,
				);

	return settingsScreen({
		id: MODMAIL_SETTINGS_ID,
		ownerId,
		category: "moderation",
		title: botCopy("📬 Mod mail", "📬 مراسلات الإشراف"),
		status,
		...(note !== undefined ? { note } : {}),
		rows: [
			{ label: botCopy("Open conversations", "المحادثات المفتوحة"), value: String(settings.open) },
			...(settings.channelId !== null && !settings.canUse
				? [
						{
							label: botCopy("⚠️ I cannot work there", "⚠️ الصلاحيات غير كافية"),
							value: botCopy(
								"Let me send messages, create public threads and manage threads in that channel.",
								"امنحني في هذه القناة صلاحيات إرسال الرسائل وإنشاء المحادثات العامة وإدارتها.",
							),
						},
					]
				: []),
		],
		pickers: [
			{
				label: botCopy("Threads go in", "قناة المحادثات"),
				hint: botCopy(
					"Each conversation gets a thread here. Keep the channel to staff.",
					"تُفتح محادثة فرعية لكل مراسلة في هذه القناة. احصر الوصول إليها بفريق الإشراف.",
				),
				control: row(
					channelSelect({
						id: customId(MODMAIL_SETTINGS_ID, "channel", ownerId),
						placeholder: botCopy("Channel for mod mail…", "اختر قناةً لمراسلات الإشراف…"),
						...(settings.channelId === null ? {} : { defaultChannelIds: [settings.channelId] }),
					}),
				),
			},
			{
				label: botCopy("Ping when one opens", "الرتبة التي تُشعَر عند فتح محادثة"),
				hint: botCopy("Leave it empty to ping nobody.", "اترك الحقل فارغًا لفتح المحادثات من دون إشعار أي رتبة."),
				control: row(
					roleSelect({
						id: customId(MODMAIL_SETTINGS_ID, "ping", ownerId),
						placeholder: botCopy("Nobody", "بلا إشعار"),
						minValues: 0,
						...(settings.pingRoleId === null ? {} : { defaultRoleIds: [settings.pingRoleId] }),
					}),
				),
			},
			{
				label: botCopy("Replies are signed", "توقيع الردود"),
				control: row(
					select({
						id: customId(MODMAIL_SETTINGS_ID, "signed", ownerId),
						options: [
							option({
								label: botCopy("With the staff member's name", "باسم المشرف الذي ردّ"),
								value: "named",
								selected: !settings.anonymous,
							}),
							option({
								label: botCopy("As the server's staff", "باسم فريق الإشراف"),
								value: "anonymous",
								selected: settings.anonymous,
							}),
						],
					}),
				),
			},
		],
		actions: [switchAction(settings.enabled, settings.channelId !== null)],
		footer: botCopy(
			"Members start with /modmail open, or by messaging me directly. Staff need Manage Messages to close one.",
			"يبدأ العضو المحادثة بالأمر `/modmail open` أو بمراسلتي مباشرةً. يحتاج المشرف إلى صلاحية إدارة الرسائل لإغلاقها.",
		),
	});
}
