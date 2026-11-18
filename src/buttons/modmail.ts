import { MessageFlags, PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { defineButton } from "@core/button";
import { UserFacingError } from "@core/errors";
import { openConversationOf } from "@database/repositories/modmailRepository";
import { modalForm } from "@lib/discord";
import { closedNotice, closeModmail, MODMAIL_ID, requireModmailAccess, startConversation } from "@lib/modmail";
import { MODMAIL_LIMITS, plainText } from "@testify/shared";

const MESSAGE_FIELD = "message";

const firstMessage = plainText(1, MODMAIL_LIMITS.maxText);

/** Write and the server picker belong to the member, Close in the thread to staff; there is no single owner to check. */
export default defineButton({
	id: MODMAIL_ID,

	async run(interaction, context) {
		const { client } = context;
		const presser = interaction.user;

		if (context.action === "close") {
			const guild = interaction.guild;
			if (guild === null || !interaction.isButton()) return;
			if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) !== true) {
				throw new UserFacingError(
					botCopy(
						"Only staff with the Manage Messages permission can close mod mail.",
						"إغلاق مراسلات الإشراف متاح لأعضاء فريق الإشراف الذين لديهم صلاحية إدارة الرسائل.",
					),
				);
			}

			const [conversationId = ""] = context.args;
			await interaction.deferUpdate();
			await closeModmail(client, guild.id, conversationId, { id: presser.id, name: presser.username }, "staff");
			return;
		}

		// Every other control was made for one member, whose id rides last.
		if (context.args.at(-1) !== presser.id) {
			throw new UserFacingError(botCopy("That is not yours to press.", "هذا الزر مخصّص لمستخدم آخر."));
		}

		if (context.action === "close-own" && interaction.isButton()) {
			const [conversationId = ""] = context.args;
			const open = await openConversationOf(presser.id);
			if (open?.id !== conversationId)
				throw new UserFacingError(botCopy("That conversation is already closed.", "أُغلقت تلك المحادثة بالفعل."));

			await closeModmail(client, open.guildId, open.id, { id: presser.id, name: presser.username }, "member");
			await interaction.update(closedNotice());
			return;
		}

		const guildId =
			context.action === "pick" && interaction.isStringSelectMenu() ? interaction.values[0] : context.args[0];
		if (guildId === undefined) return;

		if ((context.action === "write" || context.action === "pick") && !interaction.isModalSubmit()) {
			const guild = client.guilds.cache.get(guildId);
			if (guild === undefined)
				throw new UserFacingError(botCopy("I am no longer in that server.", "لم أعد عضوًا في ذلك الخادم."));
			await requireModmailAccess(client, presser.id, guild.id);

			await interaction.showModal(
				modalForm({
					id: MODMAIL_ID,
					action: "start",
					args: [guildId, presser.id],
					title: botCopy(`Write to the staff of ${guild.name}`, `مراسلة فريق الإشراف في ${guild.name}`),
					fields: [
						{
							id: MESSAGE_FIELD,
							label: botCopy("Your message", "رسالتك"),
							paragraph: true,
							maxLength: MODMAIL_LIMITS.maxText,
						},
					],
				}),
			);
			return;
		}

		if (context.action === "start" && interaction.isModalSubmit()) {
			const guild = client.guilds.cache.get(guildId);
			if (guild === undefined)
				throw new UserFacingError(botCopy("I am no longer in that server.", "لم أعد عضوًا في ذلك الخادم."));

			const parsed = firstMessage.safeParse(interaction.fields.getTextInputValue(MESSAGE_FIELD));
			if (!parsed.success)
				throw new UserFacingError(botCopy("Write a message, without HTML.", "اكتب رسالة من دون وسوم HTML."));

			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
			const { told } = await startConversation(client, guild, presser, parsed.data);
			await interaction.editReply(
				told
					? `📬 Sent to the staff of **${guild.name}**. Their replies will come to you in a direct message.`
					: `📬 Sent to the staff of **${guild.name}**, but I could not message you, so you will not see their replies. Allow direct messages from this server's members, then write to me.`,
			);
			return;
		}
	},
});
