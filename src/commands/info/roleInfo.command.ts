import { botCopy } from "@config/strings";
import { defineCommand, roleOption } from "@core/command";
import { UserFacingError } from "@core/errors";
import { permissionName } from "@core/language";
import { embed, reply } from "@lib/discord";
import { discordTime, formatNumber, humanisePermission, truncate } from "@lib/format";

export default defineCommand({
	name: "role-info",
	description: "Shows information about a role.",
	category: "info",
	private: true,
	guildOnly: true,
	options: [{ name: "role", description: "The role to look up.", type: "role", required: true }],

	async run(interaction) {
		const role = roleOption(interaction, "role");
		if (!role)
			throw new UserFacingError(botCopy("I could not find that role in this server.", "لم أجد الدور في هذا الخادم."));
		if (role.name === "@everyone")
			throw new UserFacingError(
				botCopy("The `@everyone` role has no useful information.", "لا تتوافر معلومات إضافية عن الدور `@everyone`."),
			);

		const permissions = role.permissions.toArray();

		await reply(interaction, {
			embeds: [
				embed({
					colour: role.colors.primaryColor === 0 ? undefined : role.hexColor,
					category: "info",
					title: botCopy(`Role: ${role.name}`, `الدور: ${role.name}`),
					fields: [
						{ name: botCopy("Colour", "اللون"), value: role.hexColor, inline: true },
						{ name: botCopy("Position", "الموضع في ترتيب الأدوار"), value: String(role.position), inline: true },
						{ name: botCopy("Members", "عدد الأعضاء"), value: formatNumber(role.members.size), inline: true },
						{
							name: botCopy("Mentionable", "يمكن الإشارة إليه"),
							value: role.mentionable ? botCopy("Yes", "نعم") : botCopy("No", "لا"),
							inline: true,
						},
						{
							name: botCopy("Hoisted", "يُعرض أعضاؤه على حدة"),
							value: role.hoist ? botCopy("Yes", "نعم") : botCopy("No", "لا"),
							inline: true,
						},
						{
							name: botCopy("Managed", "يديره تكامل"),
							value: role.managed ? botCopy("Yes", "نعم") : botCopy("No", "لا"),
							inline: true,
						},
						{ name: botCopy("Created", "أُنشئ"), value: discordTime(role.createdAt, "R") },
						{
							name: botCopy(`Permissions (${permissions.length})`, `الصلاحيات (${permissions.length})`),
							value: truncate(
								permissions
									.map((flag) => botCopy(humanisePermission(flag), permissionName("ar", flag)))
									.join(botCopy(", ", "، ")) || botCopy("None", "لا توجد صلاحيات"),
								1_000,
							),
						},
					],
					footer: botCopy(`Role ID: ${role.id}`, `معرّف الدور: ${role.id}`),
				}),
			],
		});
	},
});
