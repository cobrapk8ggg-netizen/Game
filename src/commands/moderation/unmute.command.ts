import { PermissionFlagsBits } from "discord.js";
import { strings } from "@config/strings";
import { theme } from "@config/theme";
import { defineCommand, inGuild } from "@core/command";
import { UserFacingError } from "@core/errors";
import { readerLanguage } from "@core/language";
import { reply } from "@lib/discord";
import { actionEmbed, DEFAULT_REASON, moderatorOf, notificationField, removeTimeout } from "@lib/moderation";

export default defineCommand({
	name: "unmute",
	description: "Removes a member's timeout.",
	category: "moderation",
	guildOnly: true,
	permissions: [PermissionFlagsBits.ModerateMembers],
	botPermissions: [PermissionFlagsBits.ModerateMembers],
	options: [
		{ name: "user", description: "The member to untimeout.", type: "user", required: true },
		{ name: "reason", description: "Why the timeout is being lifted.", type: "string" },
	],

	async run(interaction, client) {
		const language = readerLanguage(interaction, client.env.BOT_LANGUAGE);
		const ar = language === "ar";
		const guild = inGuild(interaction);
		const target = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason") ?? DEFAULT_REASON;

		const member = await guild.members.fetch(target.id).catch(() => null);
		if (!member) throw new UserFacingError(ar ? "هذا العضو غير موجود في الخادم." : strings.moderation.memberNotFound);
		const { notified: delivered } = await removeTimeout(guild, member, moderatorOf(interaction.user), reason);

		await reply(interaction, {
			embeds: [
				actionEmbed({
					action: ar ? "تم رفع التقييد المؤقت" : "Timeout removed",
					language,
					emoji: theme.emoji.success,
					guild,
					target,
					moderator: interaction.user,
					reason,
					extra: [notificationField(delivered, language)],
				}),
			],
		});
	},
});
