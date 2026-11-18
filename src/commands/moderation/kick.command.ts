import { PermissionFlagsBits } from "discord.js";
import { strings } from "@config/strings";
import { theme } from "@config/theme";
import { defineCommand, inGuild } from "@core/command";
import { UserFacingError } from "@core/errors";
import { readerLanguage } from "@core/language";
import { reply } from "@lib/discord";
import {
	actionEmbed,
	assertModeratable,
	DEFAULT_REASON,
	kickMember,
	moderatorOf,
	notificationField,
} from "@lib/moderation";

export default defineCommand({
	name: "kick",
	description: "Kicks a member from the server.",
	category: "moderation",
	guildOnly: true,
	permissions: [PermissionFlagsBits.KickMembers],
	botPermissions: [PermissionFlagsBits.KickMembers],
	options: [
		{ name: "user", description: "The member to kick.", type: "user", required: true },
		{ name: "reason", description: "Why they are being kicked.", type: "string" },
	],

	async run(interaction, client) {
		const language = readerLanguage(interaction, client.env.BOT_LANGUAGE);
		const ar = language === "ar";
		const guild = inGuild(interaction);
		const target = interaction.options.getUser("user", true);
		const reason = interaction.options.getString("reason") ?? DEFAULT_REASON;

		const member = await guild.members.fetch(target.id).catch(() => null);
		if (!member) throw new UserFacingError(ar ? "هذا العضو غير موجود في الخادم." : strings.moderation.memberNotFound);

		assertModeratable(interaction, member, language);
		const { notified: delivered } = await kickMember(guild, member, moderatorOf(interaction.user), reason);

		await reply(interaction, {
			embeds: [
				actionEmbed({
					action: ar ? "تم طرد العضو" : "Member kicked",
					language,
					emoji: theme.emoji.moderation,
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
