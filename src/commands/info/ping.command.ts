import { defineCommand } from "@core/command";
import { readerLanguage } from "@core/language";
import { embed, reply } from "@lib/discord";

export default defineCommand({
	name: "ping",
	description: "Checks the bot's latency.",
	category: "info",
	private: true,
	aliases: ["latency"],

	async run(interaction, client) {
		const ar = readerLanguage(interaction, client.env.BOT_LANGUAGE) === "ar";
		const unit = ar ? " مللي ثانية" : "ms";
		const sentAt = Date.now();
		await reply(interaction, {
			embeds: [embed({ category: "info", description: ar ? "جارٍ قياس زمن الاستجابة…" : "Pinging…" })],
		});
		const roundTrip = Date.now() - sentAt;

		await interaction.editReply({
			embeds: [
				embed({
					category: "info",
					title: ar ? "زمن الاستجابة" : "Pong",
					fields: [
						{
							name: ar ? "بوابة Discord" : "Gateway",
							value: `${Math.max(0, Math.round(client.ws.ping))}${unit}`,
							inline: true,
						},
						{ name: ar ? "الذهاب والإياب" : "Round trip", value: `${roundTrip}${unit}`, inline: true },
					],
				}),
			],
		});
	},
});
