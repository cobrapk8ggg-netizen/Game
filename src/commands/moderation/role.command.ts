import { PermissionFlagsBits } from "discord.js";
import { botCopy, strings } from "@config/strings";
import { asMember, defineCommand, inGuild, roleOption, type CommandInput } from "@core/command";
import { UserFacingError } from "@core/errors";
import { reply, successEmbed } from "@lib/discord";

export default defineCommand({
	name: "role",
	description: "Adds or removes a role from a member.",
	category: "moderation",
	private: true,
	guildOnly: true,
	permissions: [PermissionFlagsBits.ManageRoles],
	botPermissions: [PermissionFlagsBits.ManageRoles],
	subcommands: [
		{
			name: "add",
			description: "Gives a role to a member.",
			options: [
				{ name: "user", description: "The member.", type: "user", required: true },
				{ name: "role", description: "The role to add.", type: "role", required: true },
			],
			run: (interaction) => apply(interaction, "add"),
		},
		{
			name: "remove",
			description: "Takes a role away from a member.",
			options: [
				{ name: "user", description: "The member.", type: "user", required: true },
				{ name: "role", description: "The role to remove.", type: "role", required: true },
			],
			run: (interaction) => apply(interaction, "remove"),
		},
	],

	async run(interaction) {
		await apply(interaction, interaction.options.getSubcommand() === "remove" ? "remove" : "add");
	},
});

async function apply(interaction: CommandInput, mode: "add" | "remove"): Promise<void> {
	const guild = inGuild(interaction);
	const moderator = asMember(interaction);
	const target = interaction.options.getUser("user", true);
	const role = roleOption(interaction, "role");

	if (!role) throw new UserFacingError(botCopy("I could not find that role.", "لم أجد تلك الرتبة."));
	if (role.managed)
		throw new UserFacingError(
			botCopy(
				"That role is managed by an integration and cannot be assigned.",
				"يدير أحد التكاملات هذه الرتبة، لذا لا يمكن منحها يدويًا.",
			),
		);

	if (moderator.id !== guild.ownerId && role.position >= moderator.roles.highest.position) {
		throw new UserFacingError(
			botCopy("That role is equal to or higher than your own.", "تلك الرتبة مساوية لأعلى رتبك أو أعلى منها."),
		);
	}

	const me = guild.members.me;
	if (me && role.position >= me.roles.highest.position) {
		throw new UserFacingError(
			botCopy(
				"That role is higher than mine, so I cannot assign it.",
				"تلك الرتبة أعلى من رتبتي، لذا لا أستطيع منحها.",
			),
		);
	}

	const member = await guild.members.fetch(target.id).catch(() => null);
	if (!member) throw new UserFacingError(strings.moderation.memberNotFound);

	const hasRole = member.roles.cache.has(role.id);
	if (mode === "add" && hasRole) throw new UserFacingError(`${target} already has ${role}.`);
	if (mode === "remove" && !hasRole) throw new UserFacingError(`${target} does not have ${role}.`);

	if (mode === "add") await member.roles.add(role, `Added by ${interaction.user.username}`);
	else await member.roles.remove(role, `Removed by ${interaction.user.username}`);

	await reply(interaction, {
		embeds: [successEmbed(mode === "add" ? `Added ${role} to ${target}.` : `Removed ${role} from ${target}.`)],
	});
}
