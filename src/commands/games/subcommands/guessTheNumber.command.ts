import { randomInt } from "node:crypto";
import { botCopy } from "@config/strings";
import { defineCommand, inTextChannel } from "@core/command";
import { embed, reply } from "@lib/discord";

export default defineCommand({
	name: "guess-the-number",
	description: "Guess the number the bot is thinking of.",
	category: "games",
	guildOnly: true,
	cooldown: 10_000,
	options: [{ name: "maximum", description: "The highest possible number.", type: "integer", min: 10, max: 1_000 }],

	async run(interaction) {
		const channel = inTextChannel(interaction);
		const maximum = interaction.options.getInteger("maximum") ?? 100;
		const target = randomInt(1, maximum + 1);

		await reply(interaction, {
			embeds: [
				embed({
					category: "games",
					title: botCopy("Guess the number", "خمّن العدد"),
					description: botCopy(
						`I am thinking of a number between **1** and **${maximum}**. You have 60 seconds and six guesses.`,
						`اخترت عددًا من **1** إلى **${maximum}**. أمامك ست محاولات خلال ستين ثانية.`,
					),
				}),
			],
		});

		const collector = channel.createMessageCollector({
			filter: (message) => !message.author.bot && /^\d{1,4}$/.test(message.content.trim()),
			time: 60_000,
			max: 6,
		});

		await new Promise<void>((resolve) => {
			collector.on("collect", (message) => {
				const guess = Number.parseInt(message.content.trim(), 10);
				if (guess === target) {
					collector.stop("won");
					void message.reply({
						embeds: [
							embed({
								category: "games",
								title: botCopy("Correct", "إجابة صحيحة"),
								description: botCopy(
									`${message.author} got it \u2014 the number was **${target}**.`,
									`عاشت إيدك يا ${message.author}! العدد كان **${target}**. 🎉`,
								),
							}),
						],
					});
					return;
				}

				void message.react(guess < target ? "\u2b06\ufe0f" : "\u2b07\ufe0f").catch(() => null);
			});

			collector.on("end", (_collected, reason) => {
				if (reason !== "won" && channel.isSendable()) {
					void channel.send({
						embeds: [
							embed({
								category: "games",
								title: botCopy("Game over", "انتهت اللعبة"),
								description: botCopy(
									`Nobody guessed it. The number was **${target}**.`,
									`ما حد خمّنه! العدد كان **${target}**. نخليها جولة ثانية؟`,
								),
							}),
						],
					});
				}
				resolve();
			});
		});
	},
});
