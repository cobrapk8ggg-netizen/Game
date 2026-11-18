import { botCopy, strings } from "@config/strings";
import { defineCommand } from "@core/command";
import { UserFacingError } from "@core/errors";
import { embed, reply } from "@lib/discord";
import { containsProfanity } from "@lib/moderation";

export default defineCommand({
	name: "master-oogway",
	description: "Shares a piece of Oogway's wisdom.",
	category: "fun",
	cooldown: 5_000,
	options: [
		{
			name: "quote",
			description: "The wisdom to share.",
			type: "string",
			required: true,
			maxLength: 200,
		},
	],

	async run(interaction) {
		const quote = interaction.options.getString("quote", true).trim();
		if (containsProfanity(quote)) throw new UserFacingError(strings.generic.profanity);

		await reply(interaction, {
			embeds: [
				embed({
					category: "fun",
					title: botCopy("🐢 Master Oogway's wisdom", "🐢 حكمة المعلّم أوغواي"),
					description: botCopy(`> *"${quote}"*\n> — Master Oogway`, `> *«${quote}»*\n> — المعلّم أوغواي`),
					footer: botCopy(`Requested by ${interaction.user.username}`, `بطلب من ${interaction.user.username}`),
					footerIcon: interaction.user.displayAvatarURL(),
				}),
			],
		});
	},
});
