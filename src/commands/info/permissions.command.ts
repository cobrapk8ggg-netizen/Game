import { PermissionFlagsBits } from "discord.js";
import { botCopy } from "@config/strings";
import { defineCommand } from "@core/command";
import { UserFacingError } from "@core/errors";
import { permissionName } from "@core/language";
import { embed, reply } from "@lib/discord";
import { humanisePermission } from "@lib/format";

export default defineCommand({
	name: "permissions",
	description: "Lists the permissions a member has in this server.",
	category: "info",
	private: true,
	guildOnly: true,
	options: [{ name: "user", description: "The member to inspect. Defaults to you.", type: "user" }],

	async run(interaction) {
		const target = interaction.options.getUser("user") ?? interaction.user;
		const member = interaction.guild ? await interaction.guild.members.fetch(target.id).catch(() => null) : null;
		if (!member)
			throw new UserFacingError(botCopy("That member is not in this server.", "لا يوجد هذا العضو في الخادم."));

		const all = Object.keys(PermissionFlagsBits) as (keyof typeof PermissionFlagsBits)[];
		const granted = all.filter((flag) => member.permissions.has(PermissionFlagsBits[flag]));
		const denied = all.filter((flag) => !member.permissions.has(PermissionFlagsBits[flag]));

		const format = (flags: string[]): string =>
			flags.length > 0
				? flags
						.map((flag) => `\`${botCopy(humanisePermission(flag), permissionName("ar", flag))}\``)
						.join(botCopy(", ", "، "))
				: botCopy("None", "لا توجد صلاحيات في هذه الفئة");

		await reply(interaction, {
			embeds: [
				embed({
					category: "info",
					title: botCopy(`Permissions for ${member.displayName}`, `صلاحيات ${member.displayName}`),
					fields: [
						{
							name: botCopy(`✅ Granted (${granted.length})`, `✅ الصلاحيات الممنوحة (${granted.length})`),
							value: format(granted),
						},
						{
							name: botCopy(`❌ Denied (${denied.length})`, `❌ الصلاحيات غير الممنوحة (${denied.length})`),
							value: format(denied),
						},
					],
					thumbnail: target.displayAvatarURL(),
					footer: `${target.username} • ${target.id}`,
				}),
			],
		});
	},
});
