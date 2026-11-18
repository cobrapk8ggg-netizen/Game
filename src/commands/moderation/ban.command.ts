import { PermissionFlagsBits } from "discord.js";
import { theme } from "@config/theme";
import { defineCommand, inGuild } from "@core/command";
import { UserFacingError } from "@core/errors";
import { readerLanguage } from "@core/language";
import { reply } from "@lib/discord";
import {
	actionEmbed,
	assertModeratable,
	banUser,
	blockText,
	DEFAULT_REASON,
	moderatorOf,
	notificationField,
} from "@lib/moderation";

export default defineCommand({
	name: "ban",
	description: "Bans a user from the server.",
	category: "moderation",
	guildOnly: true,
	permissions: [PermissionFlagsBits.BanMembers],
	botPermissions: [PermissionFlagsBits.BanMembers],
	options: [
		{ name: "user", description: "The user to ban.", type: "user", required: true },
		{ name: "reason", description: "Why they are being banned.", type: "string" },
		{
			name: "delete-days",
			description: "Days of their messages to delete (0-7).",
			type: "integer",
			min: 0,
			max: 7,
		},
	],

	async run(interaction, client) {
		const language = readerLanguage(interaction, client.env.BOT_LANGUAGE);
		const ar = language === "ar";
		const guild = inGuild(interaction);
		const target = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason") ?? DEFAULT_REASON;
		const deleteDays = interaction.options.getInteger("delete-days") ?? 0;

		if (target.id === client.user?.id) throw new UserFacingError(blockText("bot", language));
		if (target.id === interaction.user.id) throw new UserFacingError(blockText("you", language));

		const member = await guild.members.fetch(target.id).catch(() => null);
		if (member) assertModeratable(interaction, member, language);

		const { notified: delivered } = await banUser(
			guild,
			target,
			member,
			moderatorOf(interaction.user),
			reason,
			deleteDays,
		);

		await reply(interaction, {
			embeds: [
				actionEmbed({
					action: ar ? "تم حظر المستخدم" : "User banned",
					language,
					emoji: theme.emoji.moderation,
					guild,
					target,
					moderator: interaction.user,
					reason,
					extra: [
						{
							name: ar ? "أيام الرسائل المحذوفة" : "Messages deleted",
							value: ar ? String(deleteDays) : `${deleteDays} day(s)`,
							inline: true,
						},
						notificationField(delivered, language),
					],
				}),
			],
		});
	},
});
